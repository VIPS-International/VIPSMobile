//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.CallFlow', {
    alias: 'CallFlow',

    requires: ['VIPSMobile.util.ShopOptions'],

    config: {
        buildCount: 0,
        calculatedValueSQL: false,
        callFlowID: 0,
        cartStore: null,
        colour: null,
        currentNode: null,
        custNo: 0,
        DCNo: 0,
        description: null,
        hasDraft: false,
        hasMapNode: false,
        hasProductNode: false,
        hasSQLReportNode: false,
        indexStore: null,
        inputMethod: null,
        lastQuestionId: null,
        loading: true,
        nodeTree: null,
        orphans: {}, // don't think this is used
        ready: false,
        savedReports: null,
        secondaryDescription: null,
        thumbnail: null
    },

    constructor: function (config) {

        // check for errors
        if (!config.callFlowID) {
            throw new Error('Need to set the call flow id');
        }

        // apply the config
        this.initConfig(config);

        // create the index store
        this.setIndexStore(Ext.create('VIPSMobile.store.IndexItems'));

        // load draft if it exists
        this.LoadDraft();

    },

    // create the orders cart store if has a product node
    updateHasProductNode: function (value) {
        if (value) {
            if (!this.getCartStore()) {
                this.setCartStore(Ext.create('VIPSMobile.store.OrdersCart'));
            }
        } else {
            if (this.getCartStore()) { this.getCartStore().destroy(); }
            this.setCartStore(null);
        }
    },

    // load saved reports if has SQL node
    updateHasSQLReportNode: function (value) {
        if (value) {
            this.GetSavedReportIds();
        } else {
            this.setSavedReports(null);
        }
    },

    // set or remove the draft flag for data menu
    updateHasDraft: function (newValue, oldValue) {
        var item;

        // get the item in the data menu
        item = Ext.getStore('DataMenu').getById(this.getCallFlowID());
        if (item) {

            // set if the item has a draft
            item.set('Draft', newValue);

        }

    },

    LoadDraft: function () {
        var rowDraft, nodes, cart, i;

        DataFunc.executeMany({
            statements: [
                SQLTables.CreateTables.DataDrafts,
                'SELECT * FROM DataDrafts WHERE CallFlowID=' + this.getCallFlowID()
            ],
            scope: this,
            callback: function (statements) {

                // check if there was an error
                if (statements[1].error) {

                    console.error('Error getting draft');

                } else if (statements[1].results) {

                    // check if a draft was found
                    if (statements[1].results.rows.length === 1) {

                        // get the draft
                        rowDraft = statements[1].results.rows.item(0);

                        VIPSMobile.log("LoadDraft()", rowDraft);

                        // get the nodes from the draft
                        nodes = JSON.parse(rowDraft.Nodes);

                        // rebuild the node tree
                        this.setNodeTree(this.CreateNodeFromDraft(nodes, nodes[rowDraft.StartNodeID]));

                        // reload the Cart Store if the draft contains a cart
                        if (rowDraft.Cart) {

                            // create the store
                            this.setCartStore(Ext.create('VIPSMobile.store.OrdersCart'));

                            // add the items
                            cart = JSON.parse(rowDraft.Cart);
                            for (i = 0; i < cart.length; i++) {
                                this.getCartStore().add(cart[i]);
                            }
                        }
                        this.setHasDraft(true);
                    }
                }
                this.draftLoaded();
            }
        });
    },

    draftLoaded: function () {
        this.getIndexStore().setIsLoaded();
        this.setReady(true);
    },

    CreateNodeFromDraft: function (vDraft, vNodeData, vPrevNode, vParentNode) {
        var product, modNode, id, i, children;

        // create the node model
        modNode = VIPSMobile.model.IndexItem.create(vNodeData);

        // reseed if id greater than current seed
        id = parseInt(modNode.getId(), 10);
        if (id > modNode.getIdentifier().getSeed()) {
            modNode.getIdentifier().setSeed(id + 1);
        }

        // set prev or parent node
        if (vPrevNode) { modNode.setPrevNode(vPrevNode); }
        if (vParentNode) { modNode.setParentNode(vParentNode); }

        // create any child nodes
        if (modNode.get('ChildNodeIds').length) {

            children = [];
            for (i = 0; i < modNode.get('ChildNodeIds').length; i++) {
                children.push(this.CreateNodeFromDraft(vDraft, vDraft[modNode.get('ChildNodeIds')[i]], null, modNode));
            }

            modNode.setChildNodes(children);

        }

        // create next node
        if (modNode.get('NextNodeId') && vDraft[modNode.get('NextNodeId')]) {
            var draftChild = vDraft[modNode.get('NextNodeId')];
            modNode.setNextNode(this.CreateNodeFromDraft(vDraft, draftChild, modNode));
        }

        // add the model to the store if visible
        if (!modNode.get('Hidden')) {
            this.getIndexStore().add(modNode);
        }

        return modNode;

    },

    DeleteDraft: function (callback, scope) {

        // this is done from user class
        DataFunc.executeSQL({
            sql: 'DELETE FROM DataDrafts WHERE CallFlowID=' + this.getCallFlowID(),
            scope: this,
            success: function (tx, results) {

                this.setHasDraft(false);

                if (callback) { callback.apply(scope || this); }

            },
            failure: function (tx, ex) {

                console.error('Error deleting draft', ex);

                this.setHasDraft(false);

                if (callback) { callback.apply(scope || this); }

            }
        });

    },

    SaveDraft: function () {
        var i, nodes, cart;

        // Don't want drafts on reports or call flows where start node has exclude from save set
        if (this.getHasSQLReportNode()) { return; }
        if (this.getNodeTree().get('ExcludeFromSave')) { return; }

        console.log('SaveDraft');

        // put all the nodes into an object
        nodes = {};
        this.AddNodeToDraft(nodes, this.getNodeTree());
        nodes = Ext.encode(nodes);

        // get all the cart items
        if (this.getCartStore()) {

            cart = [];
            for (i = 0; i < this.getCartStore().getCount(); i++) {
                cart.push(this.getCartStore().getAt(i).data);
            }

            cart = Ext.encode(cart);

        } else {
            cart = '';
        }

        // this is done from user class
        DataFunc.executeSQL({
            sql: 'REPLACE INTO DataDrafts (CallFlowID, StartNodeID, SavedAt, Nodes, Cart) VALUES (?, ?, ?, ?, ?)',
            params: [this.getCallFlowID(), this.getNodeTree().getId(), DataFunc.getUTCdate(), nodes, cart],
            scope: this,
            success: function (tx, results) {
                this.setHasDraft(true);
            },
            failure: function (tx, ex) {
                console.error('Error saving draft', ex);
                this.setHasDraft(true);
            }
        });

    },

    AddNodeToDraft: function (nodes, node) {
        var i;

        if (node.data.Description) {

            nodes[node.getId()] = node.data;

            for (i = 0; i < node.getChildNodes().length; i++) {
                this.AddNodeToDraft(nodes, node.getChildNodes()[i]);
            }

            if (node.getNextNode()) {
                this.AddNodeToDraft(nodes, node.getNextNode());
            }

        } else {
            console.log("Has no Description", node);
        }

    },

    GetSavedReportIds: function () {
        var strSQLs, ids;

        // create the saved reports table if needed and get the saved times for this call flow
        strSQLs = [
            'CREATE TABLE IF NOT EXISTS SavedReports (CallFlowID INTEGER, SavedAt INTEGER, ReportHTML TEXT)',
            'SELECT SavedAt FROM SavedReports WHERE CallFlowID=' + this.getCallFlowID() + ' LIMIT ' + VIPSMobile.User.getSavedReportsCount()
        ];

        // execute the sqls and remember the report ids
        DataFunc.executeMany({
            statements: strSQLs,
            scope: this,
            callback: function (statements) {
                ids = DataFunc.ScalarSQLResultsToArray(statements[1].results);
                this.setSavedReports(ids);
            }
        });

    },

    // create a new instance of the call flow
    Create: function (vCallbackFn, scope) {

        // empty the stores
        this.getIndexStore().removeAll();
        if (this.getCartStore()) {
            this.getCartStore().removeAll();
            VIPSMobile.Cart.CartCount = this.getCartStore().data.length;
            VIPSMobile.Cart.CartProducts = this.getCartStore().getActiveCount();
            VIPSMobile.Cart.CartItems = this.getCartStore().sum('Quantity');
            VIPSMobile.Cart.CartTotalPrice = this.getCartStore().sum('TotalPrice').toFixed(2);
        }

        // disable events while building the call flow
        this.getIndexStore().suspendEvents();

        // reset the build count
        this.setBuildCount(0);

        VIPSMobile.log("CallFlow.Create()", this.getCallFlowID());

        // build the node tree
        this.BuildNodeTree(this.getCallFlowID(), null, function () {

            // reenable events and refresh the view
            this.getIndexStore().resumeEvents(true);
            if (this.getIndexStore().view) {
                this.getIndexStore().view.refresh();
            }

            // remove the mask
            VIPSMobile.Main.setMask('Data', false);

            // execute the call back
            if (vCallbackFn) {
                vCallbackFn.apply(scope || this);
            }

        });

    },

    BuildNodeTree: function (vCallFlowNodeID, vPreviousNode, vCallback) {
        var node;

        console.debug('BuildNodeTree', arguments);

        // get the node from the node id
        node = this.CreateNextNode(vPreviousNode, vCallFlowNodeID);
        if (node) {

            if (this.ReadyToDisplayNode(node)) {

                // increment the build count
                this.setBuildCount(this.getBuildCount() + 1);

                // show building mask
                VIPSMobile.Main.setMask('Data', 'Building ' + this.getBuildCount() + '...');

                // defer to allow browser to stay responsive and update mask
                Ext.defer(function () {

                    if (vPreviousNode) {
                        node.getPrevNode().setNextNode(node);
                    }

                    // Node tree starts with start node
                    if (node.get('TypeID') === CallFlowNode.Types.StartNode) {
                        this.setNodeTree(node);
                    }

                    if (node.get('NodeTypeDesc') !== 'DynamicNode' && !node.get('StorageTable') && node.getPrevNode()) {
                        node.set('StorageTable', node.getPrevNode().get('StorageTable'));
                    }

                    // To get around async issue of displaying nodes, just prepare the query and look for any remaining
                    // tags then run node query and hide control if needed after added
                    this.GetOptions(node, vCallback);

                }, 5, this);

            } else {

                // add the node as hidden so that is still in tree incase it's value is needed by previous node
                if (vPreviousNode) {
                    node.getPrevNode().setNextNode(node);
                }
                node.set('Hidden', true);

                // build done
                this.BuildDone(vCallback);

            }

        } else {
            this.BuildDone(vCallback);

        }

    },

    // add the node to the index
    CreateNextNode: function (vPreviousNode, vCallFlowNodeId) {
        return this.CreateNode(null, vPreviousNode, vCallFlowNodeId);
    },
    CreateChildNode: function (vParentNode, vCallFlowNodeId) {
        return this.CreateNode(vParentNode, null, vCallFlowNodeId);
    },
    CreateNode: function (vParentNode, vPreviousNode, vCallFlowNodeId) {
        var node, callFlowNode;

        callFlowNode = this.getNode(vCallFlowNodeId);

        if (callFlowNode) {

            // create a new model for the item
            node = VIPSMobile.model.IndexItem.create(callFlowNode);

            // set prev or parent node
            if (vPreviousNode) {
                node.setPrevNode(vPreviousNode);
            } else if (vParentNode) {
                node.setParentNode(vParentNode);
            }

            node.set('SortKey', this.GetSortKey(node));

        }

        return node;

    },

    getNode: function (vNodeId) {
        var node;

        // get the node by the call flow id
        node = Ext.getStore('CallFlowNodes').getById(vNodeId);

        if (node) {

            node = node.data;
            node.NodeTypeDesc = CallFlowNode.Types[node.TypeID];

            // make sure the node is in this callflow
            if (node.CustNo !== this.getCustNo() || node.DCNo !== this.getDCNo()) {
                console.error('Call flow node ' + vNodeId + ' not in this call flow.');
                node = null;
            }

        }

        return node;

    },

    // sort key to make sure the index is in the correct order
    GetSortKey: function (vNode) {
        var curNode, strKey;

        curNode = vNode;
        strKey = curNode.getId();

        while (curNode) {

            if (curNode.getParentNode()) {
                strKey = curNode.getId() + '.' + strKey;
                curNode = curNode.getParentNode();
            } else {
                curNode = curNode.getPrevNode();
            }

        }

        return strKey;

    },

    ReadyToDisplayNode: function (node) {
        var blnReady;

        // assume it's ready
        blnReady = true;

        // start nodes are always ready to display
        if (node.get('TypeID') !== CallFlowNode.Types.StartNode) {
            var i, tmpStr, RequiredStatements = ['RequiredFields', 'ListSQL', 'NarationSQL'];

            for (i = 0; i < RequiredStatements.length; i++) {
                // check if all required fields have values
                tmpStr = DataFunc.ReplaceValueTags(node, node.get(RequiredStatements[i]), true);
                if (tmpStr.indexOf('[') >= 0) {
                    console.log('ReadyToDisplayNode-Fail', tmpStr.match(/\[\w*\]/gm), node);
                    blnReady = false;
                }
            }

        }

        return blnReady;

    },

    // make sure all the values are set to check if node should be displayed
    GetOptions: function (node, vCallback) {
        var i, option, blnSortByDistance, item, ndeView;

        console.debug('GetOptions', node);

        if (node.get('ListSQL') !== '') {

            DataFunc.executeSQL({
                sql: DataFunc.PrepareQuery(node, node.get('ListSQL'), true),
                scope: this,
                success: function (tx, results) {

                    ndeView = VIPSMobile.view.data.fields[node.getNodeViewType()] || VIPSMobile.view.dashboard.charts[node.getNodeViewType()] || {};
                    node.set('Options', []);

                    // Remember options if not hidden, skip otherwise
                    if (results.rows.length > 0) {

                        for (i = 0; i < results.rows.length; i++) {

                            item = results.rows.item(i);

                            // check if the node type has function to convert result to option
                            if (ndeView.convertListOption) {

                                option = ndeView.convertListOption(item);
                                node.get('Options').push(option);

                            } else {

                                if (item.Field0 !== undefined && item.Field1) {

                                    option = {
                                        text: item.Field1,
                                        value: item.Field0.toString(),
                                        destination: item.Field2
                                    };

                                    // if lat/long returned, sort by it if enabled and have current location
                                    if (VIPSMobile.User.getUseLocation() && Ext.isNumber(item.Field2) && Ext.isNumber(item.Field3)) {
                                        blnSortByDistance = true;
                                        option.location = { lat: item.Field2, lon: item.Field3 };
                                    }

                                    node.get('Options').push(option);

                                }

                            }

                        }

                        // check if should sort by distance and have current location
                        if (blnSortByDistance) {
                            node.get('Options').sort(DataFunc.SortOptionsByDistance);
                        }

                        this.GetCalculatedValue(node, vCallback);

                    } else {

                        this.SetupNode(node, vCallback);

                    }

                },
                failure: function (tx, ex) {
                    var me = this;
                    console.error('Error getting options', node, ex);
                    Ext.Msg.show({
                        title: VIPSMobile.getString('Error Building')
                        , message: VIPSMobile.getString('An unexpected error has occurred. <br /> Please press Retry. <br /> If this continues to happen then please call the Vips Helpdesk on 1300 788 801')
                        , buttons: [
                            { text: 'Cancel', itemId: 'cancel' },
                            { text: 'Retry', itemId: 'ok', ui: 'action' }
                        ]
                        , fn: function (btn) {
                            console.log(btn);
                            if (btn == 'ok') {
                                this.GetOptions(node, vCallback);
                            } else {
                                node.set({
                                    NodeTypeDesc: "LabelNode",
                                    TypeID: CallFlowNode.Types.LabelNode,
                                    FormattedValue: null,
                                    ValidationSQL: VIPSMobile.getString("SELECT 'There was an error building this Data Option you can not save this entry, Clear the Draft to Retry.'"),
                                    Value: null,
                                    Description: VIPSMobile.getString('Error Building <br /> Clear the Draft to Retry. <br /> If this continues to happen then please call the Vips Helpdesk on 1300 788 801'),
                                    ExcludeFromSave: true,
                                    ExcludeFromLoad: true,
                                    Answered: VIPSMobile.CallFlows.AnswerMethod.Unanswered,
                                    Hidden: false,
                                    Options: null
                                });
                                this.SetupNode(node, function () {
                                    vCallback.apply(me);
                                    window.location.assign('#Data');
                                })
                            }
                        }
                        , scope: this
                    });
                }

            });

        } else {
            this.GetCalculatedValue(node, vCallback);
        }

    },

    // confusing but split into two functions since called from Data controller for Save node and don't need to do node setup steps
    GetCalculatedValue: function (node, vCallback) {

        this.GetCalculatedValue2(node, function () {
            this.SetupNode(node, vCallback);
        }, this);

    },
    GetCalculatedValue2: function (node, vCallback, scope) {
        var sql, i, value, useGlobal, globalVal;

        console.debug('GetCalculatedValue2', node);

        node.set('Value', null);

        // check if have a default value
        if (node.get('DefaultValue')) {

            value = DataFunc.ReplaceValueTags(node, node.get('DefaultValue'));
            this.SetNodeValue(node, value, VIPSMobile.CallFlows.AnswerMethod.Default);

        }

        if (node.get('IsGlobal') & VIPSMobile.CallFlows.globals.flags.Read) {

            // check if have a global
            useGlobal = node.get('IsGlobal') & VIPSMobile.CallFlows.globals.flags.Read;
            globalVal = VIPSMobile.CallFlows.globals.getValue(node.get('FieldToStoreValue'));
            if (useGlobal && globalVal) {
                this.SetNodeValue(node, globalVal, VIPSMobile.CallFlows.AnswerMethod.Global);
            }

        }

        sql = node.get('CalculatedValueSQL');

        if (sql) {

            // convert the sql to an array
            if (sql.indexOf(';') > 0) {
                sql = sql.split(';');
            } else {
                sql = [sql];
            }

            // prepare all the queries
            for (i = 0; i < sql.length; i++) {
                sql[i] = { sql: DataFunc.PrepareQuery(node, sql[i], false, true) };
            }

            DataFunc.executeMany({
                statements: sql,
                scope: this,
                callback: function (statements) {
                    var tmp, tmps;


                    // check if a single query set
                    if (statements.length === 1) {

                        value = null;

                        // check if multiple values returned
                        if (statements[0].results.rows.length === 1) {
                            if (Object.keys(statements[0].results.rows.item(0)).length === 1) {
                                value = DataFunc.GetScalarValue(statements[0].results);
                            } else {
                                value = statements[0].results.rows.item(0);
                            }
                        } else if (statements[0].results.rows.length > 1) {
                            value = [];
                            for (i = 0; i < statements[0].results.rows.length; i++) {

                                if (Object.keys(statements[0].results.rows.item(0)).length === 1) {
                                    tmps = statements[0].results.rows.item(i);
                                    Ext.iterate(tmps, function (key, value) {
                                        tmp = value;
                                    });
                                } else {
                                    tmp = statements[0].results.rows.item(i);
                                }

                                // only if the value is different should it be added to the list
                                if (value.indexOf(tmp) === -1) {
                                    value.push(tmp);
                                }

                            }
                        }

                    } else {

                        value = [];
                        for (i = 0; i < statements.length; i++) {
                            if (statements[i].results.rows.length > 0) {
                                if (Object.keys(statements[i].results.rows.item(0)).length === 1) {
                                    value.push(DataFunc.GetScalarValue(statements[i].results));
                                } else {
                                    value.push(DataFunc.SQLResultsToArray(statements[i].results));
                                }
                            }
                        }

                    }

                    // if the node is a product detail node, value is product info, not an actual value
                    if (node.get('TypeID') === CallFlowNode.Types.ProductDetail) {
                        this.setProductInfo(node, value);
                    } else if (node.get('TypeID') === CallFlowNode.Types.BarcodeNode) {
                        this.setBarcodeInfo(node, value);
                    }
                    else {
                        this.SetNodeValue(node, value, VIPSMobile.CallFlows.AnswerMethod.Calculated);
                    }

                    vCallback.apply(scope);

                }
            });

        } else {
            vCallback.apply(scope);
        }

    },

    BuildDone: function (vCallback) {

        // execute callback
        vCallback.apply(this);

    },

    setBarcodeInfo: function (node, value) {
        var arValue = [];
        console.debug('setBarcodeInfo', arguments);

        if (value && !Ext.isArray(value)) { value = [value]; }  // make array of objects

        //expand the "objects" into multiple barcode values, it fitts the "spinner" mechaninc in the barcode node
        Ext.iterate(value, function (obj) {
            var i = 0;

            for (i = 0; i < obj.Quantity; i++) {
                arValue.push(obj.BarCode);
            }

        });

        this.SetNodeValue(node, arValue, VIPSMobile.CallFlows.AnswerMethod.Calculated);

    },


    // convert the value into product info object
    setProductInfo: function (node, value) {

        console.debug('setProductInfo', arguments);
        var product = {}, qty = {};

        // make sure the value is an array of [product, uoms, specials]
        if (!Ext.isArray(value)) { value = [value]; }  // product info
        if (value.length < 2) { value.push([]); }  // units of measure
        if (value.length < 3) { value.push([]); }      // specials

        // create the product object from passed in values   
        product = value[0][0];

        Ext.iterate(value[1], function (item) {
            qty[item.Value] = item;
        });

        product.Quantity = qty;
        product.specials = value[2];

        node.set("Value", product);

    },

    SetNodeValue: function (node, value, answerMethod) {
        var ndeView, useGlobal;

        console.debug('SetNodeValue', arguments);

        ndeView = VIPSMobile.view.data.fields[node.getNodeViewType()] || VIPSMobile.view.dashboard.charts[node.getNodeViewType()] || {};

        // if have list of valid options, check the value against list
        if (node.get('Options')
            && (node.get('TypeID') !== CallFlowNode.Types.BarcodeNode
                && node.get('TypeID') !== CallFlowNode.Types.ImageNode
                && node.get('TypeID') !== CallFlowNode.Types.DateNode
                && node.get('TypeID') !== CallFlowNode.Types.ProductDetail
                && node.get('TypeID') !== CallFlowNode.Types.MapNode
                && (node.get('TypeID') !== CallFlowNode.Types.DynamicNode
                    && !node.get('DynamicAsTable')))) {
            value = this.CheckIfValueInOptions(node, value);
        }

        if (node.get("Value") !== value && typeof (value) === "string" && node.get('TypeID') === CallFlowNode.Types.MultiPickListNode) {
            value = value.split(',');
        }

        if ((!Ext.isArray(value) && value !== null) || (Ext.isArray(value) && value.length !== 0)
            || (node.get("Value") !== value && node.get('TypeID') === CallFlowNode.Types.MultiPickListNode)) {

            switch (node.get('TypeID')) {
                case CallFlowNode.Types.CartNode:
                    this.AddOptionsToCart(node, value);
                    break;
                case CallFlowNode.Types.ProductDetail:
                    this.updateCartProduct(node, value);
                    break;

            }

            // set the answer method if not passed in
            if (answerMethod === undefined) {
                answerMethod = VIPSMobile.CallFlows.AnswerMethod.Default;
            }

            // update the node
            node.set('Value', (ndeView.getTypedValue) ? ndeView.getTypedValue(value) : value);
            node.set('FormattedValue', (ndeView.getFormattedValue) ? ndeView.getFormattedValue(node) : value);
            node.set('Answered', answerMethod);

            // remember any primary keys as global variables for defaults in other call flows
            useGlobal = node.get('IsGlobal') & VIPSMobile.CallFlows.globals.flags.Write;
            if (useGlobal && node.get('FieldToStoreValue') && answerMethod !== VIPSMobile.CallFlows.AnswerMethod.Default) {
                VIPSMobile.CallFlows.globals.setValue(node.get('FieldToStoreValue'), node.get('Value'));
            }

        }

        // validate the node
        this.ValidateNode(node);

    },

    CheckIfValueInOptions: function (node, value) {
        var optionValues, i;

        console.debug('CheckIfValueInOptions', arguments);

        // only need the values from the options
        optionValues = Ext.Array.pluck(node.get('Options'), 'value');

        if (Ext.isArray(value)) {

            i = 0;
            if (value.length === 0) {
                return [];
            }

            var newValue = [];
            for (var x = 0; x < optionValues.length; x++) {
                for (var y = 0; y < value.length; y++) {
                    if (optionValues[x].toString() === value[y].toString()) {
                        newValue.push(value[y]);
                    }
                }
            }
            value = newValue;

        } else {

            if (value !== null && optionValues.indexOf(value.toString()) < 0) {
                value = null;
            }

        }

        return value;

    },

    // add or remove the product from the cart
    updateCartProduct: function (node, values) {
        var cartItem,
            newKey,
            newValue,
            newObj,
            cartStore = this.getCartStore();

        console.log('updateCartProduct', arguments);

        // get the current values
        values.Tag = values.Tag || this.getExtraProductValues(node);

        Ext.iterate(values.Quantity, function (nk, nv, no) {
            newKey = nk;
            newValue = nv;
            newObj = no;

            nv.id = newKey;
            console.log('nv', nv);
            cartItem = cartStore.getById(newKey);
            if (!cartItem) {
                cartItem = cartStore.add(nv)[0];
            } else {
                cartItem.set("Quantity", nv.Quantity);
                cartItem.set("OverridePrice", nv.OverridePrice);
                cartItem.set("Discount", nv.Discount);
                cartItem.set("Notes", nv.Notes);
            }
            totalPrice = nv.Quantity * (nv.OverridePrice || cartItem.get("Price")) * ((100 - (nv.Discount || 0)) / 100);
            cartItem.set("TotalPrice", totalPrice);
            cartItem.set("Tag", values.Tag);
        }, this);

        VIPSMobile.Cart.CartCount = this.getCartStore().data.length;
        VIPSMobile.Cart.CartProducts = this.getCartStore().getActiveCount();
        VIPSMobile.Cart.CartItems = this.getCartStore().sum('Quantity');
        VIPSMobile.Cart.CartTotalPrice = this.getCartStore().sum('TotalPrice').toFixed(2);

        this.ValidateAllNodes();
        this.SaveDraft();

    },

    updateBarcodeItems: function (node, values) {

        node.setValue(values);

    },

    getExtraProductValues: function (node) {
        var tag, curNode;

        console.debug('getExtraProductValues', arguments);

        tag = node.Tag;
        if (!tag && node.get("Value")) {
            tag = node.get("Value").Tag;
        }
        if (!tag) {
            tag = {
                TableName: node.get('StorageTable'),
                FieldToStoreIn: node.get('FieldToStoreIn')
            };
        }

        // check all sibling nodes for extra fields and/or foreign keys
        curNode = node;
        while (curNode) {

            // check for extra fields to add to table
            if (curNode.get('FieldToStoreValue')) {
                if (!tag.NodeValues) { tag.NodeValues = {}; }
                tag.NodeValues[curNode.get('FieldToStoreValue')] = curNode.get('FieldToStoreValue');
            }

            // check for foreign key name
            if (curNode.get('FKColumn')) {
                tag.identity = '|' + curNode.get('FKColumn');
            }

            // check next node
            curNode = curNode.getNextNode();

        }

        return tag;

    },

    AddOptionsToCart: function (node, value) {
        var i, j, lstUOM, lstProducts, Product, productNode, objClone;

        console.debug('AddOptionsToCart', arguments);

        // clear the cart
        this.getCartStore().removeAll();

        VIPSMobile.Cart.CartCount = this.getCartStore().data.length;
        VIPSMobile.Cart.CartProducts = this.getCartStore().getActiveCount();
        VIPSMobile.Cart.CartItems = this.getCartStore().sum('Quantity');
        VIPSMobile.Cart.CartTotalPrice = this.getCartStore().sum('TotalPrice').toFixed(2);

        if (Ext.isArray(value)) {

            lstProducts = value[0];
            lstUOM = value[1];

            //build the cart
            for (i = 0; i < lstProducts.length; i++) {

                Product = lstProducts[i];
                Product.Quantity = {};

                for (j = 0; j < lstUOM.length; j++) {
                    if (lstProducts[i].SpecialID === lstUOM[j].SpecialID) {
                        objClone = Ext.clone(lstUOM[j]);
                        Product.Quantity[lstUOM[j].Value] = objClone;
                        Product.TotalQuantity = (Product.TotalQuantity || 0) + objClone.Quantity;
                        Product.TotalPrice = (Product.TotalPrice || 0) + objClone.TotalPrice;
                        if (objClone.Quantity > 0) {
                            Product.TotalUnits = (Product.TotalUnits || 0) + 1;
                        }
                    }
                }

                productNode = this.CreateChildNode(node, node.get('CallFlowID'));
                productNode.set('NodeTypeDesc', 'ProductDetail');
                productNode.set('TypeID', CallFlowNode.Types.ProductDetail);

                this.SetNodeValue(productNode, Product, VIPSMobile.CallFlows.AnswerMethod.Calculated);

            }
        }

    },

    SetupNode: function (node, vCallback) {
        var prevNode;

        console.debug('SetupNode', node);

        prevNode = node.getPrevNode();

        // first node after child dynamics use dynamic's description
        if (prevNode && prevNode.get('NodeTypeDesc') === 'DynamicNode' && prevNode.getParentNode()) {

            prevNode.set('Hidden', true);

            if (prevNode.get('DynamicListMode') !== CallFlowNode.DynamicListModes.UseListItemsAsOptions) {
                node.set('Description', prevNode.get('Description'));
            }

        }

        if (node.get('TypeID') === CallFlowNode.Types.DynamicNode) {

            if (node.get('DynamicListMode') === CallFlowNode.DynamicListModes.UseAllItemsFromList && !node.get('DynamicAsTable')) {
                node.set('Hidden', true);
            } else {
                node.set('Hidden', false);
            }

        } else if (node.get('TypeID') === CallFlowNode.Types.SQLWebReportNode) {

            // rename the node to just say Generate
            node.set('Description', 'Generate Report');

        } else if (node.get('TypeID') === CallFlowNode.Types.TableNode) {

            node.set('Hidden', true);

        }

        if (node.get('Options') && node.get('Options').length === 0) {

            if (!node.get('ListNotFoundText')) {
                node.set('Hidden', true);
            } else {
                node.set('FormattedValue', node.get('ListNotFoundText'));
                node.set('Answered', VIPSMobile.CallFlows.AnswerMethod.Default);
            }

        }

        // if a sync node, sync the given table
        if (node.get('TypeID') === CallFlowNode.Types.SyncNode && node.get('StorageTable')) {

            VIPSMobile.Sync.doSync({
                tableName: node.get('StorageTable'),
                forceSync: true,
                scope: this,
                callback: function (tableName, params, records) {

                    // make sure the node is hidden and set the value to number of records sync'd incase needed for call flow logic
                    node.set('Hidden', true);
                    node.set('Value', records.length);

                    this.GetPreviousEntry(node, vCallback);

                }
            });

        } else {
            this.GetPreviousEntry(node, vCallback);
        }

    },

    GetPreviousEntry: function (node, vCallback) {
        var strSQL, value;

        console.debug('GetPreviousEntry', node);

        //console.log('GetPreviousEntry: ' + node.get('CallFlowID'));
        if (!node.get('ExcludeFromLoad') && node.get('FieldToStoreValue') !== '' && node.get('StorageTable') !== '') {

            // set the query for the previous entry(s)
            strSQL = 'SELECT ' + node.get('FieldToStoreValue');
            strSQL += ' FROM ' + node.get('StorageTable');

            if (node.get('OverrideLoadPrevDataSQL')) {
                strSQL += ' ' + node.get('OverrideLoadPrevDataSQL');
            } else {
                strSQL += this.GetPreviousEntryWhere(node);
            }

            // only want most recent answer by default
            if (node.get('TypeID') !== CallFlowNode.Types.DynamicNode || node.get('DynamicListMode') !== CallFlowNode.DynamicListModes.UseListItemsAsOptions) {
                strSQL += ' ORDER BY CallDate DESC LIMIT 1';
            } else {
                console.debug("DynamicNode load previous");
            }

            strSQL = DataFunc.PrepareQuery(node, strSQL);

            // execute the query to get any previous entry(s)
            DataFunc.executeSQL({
                sql: strSQL,
                scope: this,
                success: function (tx, results) {

                    // check if any rows were found
                    if (results.rows.length > 0) {

                        if (node.get('TypeID') === CallFlowNode.Types.CustomPanel) { // custom panel

                            console.log('previous entries on custom pannel');
                            //node.customPanel.onPrevious(results);

                        } else {

                            if (node.get('TypeID') === CallFlowNode.Types.DynamicNode && node.get('DynamicListMode') !== CallFlowNode.DynamicListModes.UseManualKeyEntry) {

                                this.SetNodeValue(node, DataFunc.GetResultsArray(results, 'Field0'), VIPSMobile.CallFlows.AnswerMethod.Previous);
                                this.AddNodeToIndex(node, vCallback);
                            } else {

                                value = DataFunc.GetScalarValue(results);

                                if (node.get('StorageTable')) {

                                    strSQL = 'SELECT ' + VIPSMobile.SQLTables.getTables()[SQLTables.LocalTableName(node.get('StorageTable'))].getKeyId();
                                    strSQL += ' FROM ' + node.get('StorageTable');

                                    if (node.get('OverrideLoadPrevDataSQL')) {
                                        strSQL += ' ' + node.get('OverrideLoadPrevDataSQL');
                                    } else {
                                        strSQL += this.GetPreviousEntryWhere(node);
                                    }

                                    // only want "synced" records
                                    strSQL += " AND InputMethod > 0 "

                                    // only want most recent answer by default
                                    if (node.get('TypeID') !== CallFlowNode.Types.DynamicNode || node.get('DynamicListMode') !== CallFlowNode.DynamicListModes.UseListItemsAsOptions) {
                                        strSQL += ' ORDER BY CallDate DESC LIMIT 1';
                                    }

                                    strSQL = DataFunc.PrepareQuery(node, strSQL);

                                    DataFunc.executeSQL({
                                        sql: strSQL,
                                        scope: this,
                                        success: function (tx, results) {
                                            node.set('PreviousRecordId', DataFunc.GetScalarValue(results));
                                            this.SetNodeValue(node, value, VIPSMobile.CallFlows.AnswerMethod.Previous);
                                            this.AddNodeToIndex(node, vCallback);
                                        }
                                    });
                                }

                            }

                        }

                    } else {
                        this.AddNodeToIndex(node, vCallback);
                    }


                },
                failure: function (tx, ex) {

                    console.error('GetPreviousEntry() Error', node);
                    this.AddNodeToIndex(node, vCallback);

                }

            });

        } else {
            this.AddNodeToIndex(node, vCallback);
        }

    },

    // recursively replace all tags
    GetPreviousEntryWhere: function (node) {
        var ndeCurrent, strWhere, datEntry;

        console.debug('GetPreviousEntryWhere', node);

        strWhere = '';

        if (!node.get('ExcludeFromLoad')) {

            ndeCurrent = node;
            while (ndeCurrent) {

                // check if the node is the entry date since needed to ignore any entries after the entry date if selecting a date in the past
                // divide and add back on to use end of the selected day
                if (ndeCurrent.get('FieldToStoreValue') === 'EntryDate') {
                    datEntry = parseInt(ndeCurrent.get('Value') / 1000000, 10) * 1000000 + 235959;
                }

                if (ndeCurrent.get('IsPrimaryKey') && ndeCurrent.get('Value') && !ndeCurrent.get('ExcludeFromPrimaryKeyForLoad')) {

                    if (!ndeCurrent.get('FieldToStoreValue')) {
                        throw { message: 'Primary key with no field to store set for node ' + ndeCurrent.get('CallFlowID') };
                    }

                    // compliances format ignores entry date for previous entries
                    if (!(node.get('FKColumn') && ['EntryDate', 'IncomingMailbox'].indexOf(ndeCurrent.get('FieldToStoreValue')) >= 0)) {
                        if (strWhere.length > 0) { strWhere += ' AND '; }
                        strWhere += ndeCurrent.get('FieldToStoreValue') + "='" + ndeCurrent.get('Value') + "'";
                    }

                }

                // check previous nodes
                if (ndeCurrent.getParentNode()) {
                    ndeCurrent = ndeCurrent.getParentNode();
                } else {
                    ndeCurrent = ndeCurrent.getPrevNode();
                }

            }

            // prepend the where if anything set
            if (strWhere !== '') {

                // only check entries up to selected date
                if (datEntry) {
                    strWhere += ' AND EntryDate<' + datEntry;
                }

                strWhere = ' WHERE ' + strWhere;

            }

        }

        return strWhere;

    },

    AddNodeToIndex: function (node, vCallback) {

        // only add if the node isn't hidden
        if (!node.get('Hidden')) {

            this.ValidateNode(node);

            // set the group for the node
            this.SetNodeGroup(node);

            // add the node to the index
            this.getIndexStore().add(node);

        }

        this.FindDestinationNode(node, vCallback);

    },

    SetNodeGroup: function (node) {
        var curNode, intDynamics, strGroup;

        console.debug('SetNodeGroup', node);

        // start nodes should be hidden but just incase it isn't, use it's description
        if (node.get('TypeID') === CallFlowNode.Types.StartNode) {

            strGroup = node.get('SecondaryDescription') || node.get('Description');

        } else {

            // go up the tree counting dynamics on way up
            curNode = node.getPrevNode();
            intDynamics = 0;
            while (curNode.getPrevNode()) {
                if (curNode.get('TypeID') === CallFlowNode.Types.DynamicNode) {
                    intDynamics++;
                }
                curNode = curNode.getPrevNode();
            }

            if (curNode.getParentNode()) {
                strGroup = curNode.get('Group') || curNode.getParentNode().get('Description');
            } else {
                strGroup = node.get('SecondaryDescription') || curNode.get('Description');
            }

            // add spaces after group for each dynamic since need to make group unique again if group changes
            if (!node.get('SecondaryDescription')) {
                strGroup += Ext.String.repeat(' ', intDynamics);
            }

        }

        // Set the group
        node.set('Group', strGroup);

    },

    CompareVersions: function (record1, record2) {
        var keys1, keys2, a, b, i;

        keys1 = (record1.get('SortKey') || "0").split(".");
        keys2 = (record2.get('SortKey') || "0").split(".");

        for (i = 0; i < Math.max(keys1.length, keys2.length); i++) {

            a = parseInt(keys1[i] || "0", 10);
            b = parseInt(keys2[i] || "0", 10);

            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
        }

        return 0;

    },

    ValidateNode: function (node, vCallback, scope) {
        var strSQL, item, ndeView, valType;

        console.debug('ValidateNode', node);

        // clear the current validation info
        node.set({ ValidationType: '', ValidationText: '' });

        if (node.get('ValidationSQL')) {

            ndeView = VIPSMobile.view.data.fields[node.getNodeViewType()] || VIPSMobile.view.dashboard.charts[node.getNodeViewType()] || {};
            if (ndeView.getValidateNode !== undefined) {
                ndeView.getValidateNode(node, vCallback, scope || this);
            } else {

                strSQL = DataFunc.PrepareQuery(node, node.get('ValidationSQL'));

                // if there are { } in it, old validation type
                if (strSQL.indexOf('{') >= 0 || strSQL.indexOf('}') >= 0) {
                    Ext.Msg.alert('Bad Call Flow', 'Old validation method: ' + node.get('Description') + ' (' + node.get('CallFlowID') + ')');
                    return;
                }

                DataFunc.executeSQL({
                    sql: strSQL,
                    scope: this,
                    success: function (tx, results) {

                        item = (results.rows.length > 0) ? results.rows.item(0) : {};

                        if (item.Field0) {

                            if (item.Field1) {
                                if (item.Field1 === 'info') {
                                    valType = 'info';
                                } else {
                                    valType = 'warning';
                                }
                            } else {
                                valType = 'error';
                            }

                            node.set({
                                ValidationType: valType,
                                ValidationText: item.Field0
                            });

                        } else {

                            // clear the current validation info
                            node.set({ ValidationType: '', ValidationText: '' });

                        }

                        if (vCallback) { vCallback.apply(scope || this); }

                    },
                    failure: function (tx, ex) {

                        // show the error and continue on
                        console.error('ValidateNode(' + node.get('CallFlowID') + ') error', strSQL);

                        if (vCallback) { vCallback.apply(scope || this); }

                    }
                });
            }

        } else {

            if (vCallback) { vCallback.apply(scope || this); }

        }

    },

    FindDestinationNode: function (node, vCallback) {
        var ndeClone;

        console.debug('FindDestinationNode ' + node.get('Description'), node);

        // build children if dynamic node
        if (node.get('TypeID') === CallFlowNode.Types.DynamicNode) {

            node.set('ExcludeFromPrimaryKeyForLoad', true);

            this.FindDynamicDestinationNode(node, vCallback);

        } else if (node.get('TypeID') === CallFlowNode.Types.TableNode || CallFlowNode.ChartNodeTypes.indexOf(node.get('TypeID')) !== -1) {

            ndeClone = this.CreateChildNode(node, node.get('CallFlowID'));
            ndeClone.set('Hidden', true);
            ndeClone.set('Destination1', node.get('Destination2'));
            ndeClone.set('Destination2', 0);

            node.setChildNodes([ndeClone]);
            this.BuildDynamicChildNodes(0, node, vCallback);

            //            this.BuildNodeTree(ndeClone.get('Destination2'), ndeClone);

        } else {

            this.FindNextDestinationNode(node, vCallback);

        }

    },

    FindNextDestinationNode: function (node, vCallback) {
        var strSQL, intDest;

        console.debug('FindNextDestinationNode ' + node.get('Description'), node);

        // build next node
        if (node.get('Dest1SQL')) {

            strSQL = DataFunc.PrepareQuery(node, node.get('Dest1SQL'));

            //Execute the Dest1SQL to ge the Destination Node ID
            DataFunc.executeSQL({
                sql: strSQL,
                scope: this,
                success: function (tx, results) {
                    intDest = DataFunc.GetScalarValue(results);
                    this.BuildNodeTree(intDest, node, vCallback);
                },
                failure: function (tx, ex) {

                    console.error('FindNextDestinationNode(' + node.get('CallFlowID') + ') error', strSQL);
                    this.BuildNodeTree(0, node, vCallback);

                }
            });

        } else {

            this.BuildNodeTree(node.get('Destination1'), node, vCallback);

        }

    },

    FindDynamicDestinationNode: function (node, vCallback) {
        var children, i, j, ndeClone;

        children = [];

        switch (node.get('DynamicListMode')) {
            case CallFlowNode.DynamicListModes.UseAllItemsFromList:

                if (node.get('Options')) {

                    // loop through each option from ListSQL
                    for (i = 0; i < node.get('Options').length; i++) {

                        ndeClone = this.CreateChildNode(node, node.get('CallFlowID'));
                        ndeClone.set('Description', node.get('Options')[i].text);

                        this.SetNodeValue(ndeClone, node.get('Options')[i].value, VIPSMobile.CallFlows.AnswerMethod.Calculated);

                        if (node.get('Options')[i].destination) {
                            ndeClone.set('Destination1', node.get('Options')[i].destination);
                        } else {
                            ndeClone.set('Destination1', node.get('Destination2'));
                        }

                        ndeClone.set('Options', null);
                        ndeClone.set('Destination2', 0);

                        children.push(ndeClone);

                    }

                }
                break;

            case CallFlowNode.DynamicListModes.UseListItemsAsOptions:
                let tmpValue = node.get('Value');
                if (tmpValue > 0) {
                    tmpValue = [node.get('Value')];
                }

                // this node has already selected children/values
                if (Ext.isArray(tmpValue) && tmpValue.length > 0) {

                    // loop through each value adding hidden clones set to the an item from the value array
                    for (i = 0; i < tmpValue.length; i++) {

                        ndeClone = this.CreateChildNode(node, node.get('CallFlowID'));
                        ndeClone.set('Description', tmpValue[i]);
                        ndeClone.set('Hidden', true);
                        for (j = 0; j < node.get('Options').length; j++) {
                            if (node.get('Options')[j].value === tmpValue[i]) {
                                ndeClone.set('Group', node.get('Options')[j].text);
                            }
                        }

                        this.SetNodeValue(ndeClone, tmpValue[i]);

                        ndeClone.set('Destination1', node.get('Destination2'));
                        ndeClone.set('ExcludeFromPrimaryKeyForLoad', false);

                        ndeClone.set('Options', null);
                        ndeClone.setChildNodes([]);
                        ndeClone.set('Destination2', 0);

                        children.push(ndeClone);

                    }

                }
                break;

            case CallFlowNode.DynamicListModes.UseManualKeyEntry:
                break;

            case CallFlowNode.DynamicListModes.UseAllItemsFromListAndAllowManualEntry:
                break;

            default:
                console.error("Node " + node.get('CallFlowID') + " doesn't have DynamicListMode set.", node);
                break;
        }

        // if any children set, build them
        if (children.length > 0) {

            node.setChildNodes(children);

            this.BuildDynamicChildNodes(0, node, vCallback);

        } else {

            // if no children were found and list not found text is set, convert the node to a label and show it
            if (node.get('ListNotFoundText') !== '') {

                node.set({
                    NodeTypeDesc: "LabelNode",
                    TypeID: CallFlowNode.Types.LabelNode,
                    FormattedValue: '',
                    Value: '',
                    Description: node.get('ListNotFoundText'),
                    ExcludeFromSave: true,
                    ExcludeFromLoad: true,
                    Answered: VIPSMobile.CallFlows.AnswerMethod.Calculated,
                    Hidden: false,
                    Options: null
                });

                // added so list not found shows up
                // set the group for the node
                this.SetNodeGroup(node);

                // add the node to the index
                this.getIndexStore().add(node);

            }

            this.FindNextDestinationNode(node, vCallback);

        }

    },

    BuildDynamicChildNodes: function (index, node, vCallback) {
        var ndeChild, intOptIndex, i;

        console.debug('BuildDynamicChildNodes', index, node);

        if (index < node.getChildNodes().length) {

            ndeChild = node.getChildNodes()[index];
            ndeChild.set('SecondaryDescription', ndeChild.get('Group'));

            this.BuildNodeTree(ndeChild.get('Destination1'), ndeChild, function () {

                // set the description from the option with the node's value
                if (node.get('TypeID') === CallFlowNode.Types.DynamicNode && node.get('DynamicListMode') === CallFlowNode.DynamicListModes.UseListItemsAsOptions) {

                    intOptIndex = -1;
                    for (i = 0; i < node.get('Options').length; i++) {
                        if (node.get('Options')[i].value === ndeChild.get('Value')) {
                            intOptIndex = i;
                        }
                    }

                    if (intOptIndex !== -1 && ndeChild.getNextNode() !== undefined) {
                        ndeChild.getNextNode().set('Group', node.get('Options')[intOptIndex].text);
                    }

                }

                this.BuildDynamicChildNodes(index + 1, node, vCallback);

            });

        } else {

            this.FindNextDestinationNode(node, vCallback);

        }

    },

    // convert the node tree into a save info object
    GetSaveInfo: function () {
        var ndeStart, objInfo;

        console.debug('GetSaveInfo');

        ndeStart = this.getNodeTree();

        objInfo = {
            startNodeID: ndeStart.get('CallFlowID'),
            keys: {},
            tables: [],
            validationResults: { infos: [], warnings: [], criticals: [] }
        };

        // get table info
        this.GetSaveTables(objInfo, ndeStart, []);

        // need to reverse the tables list
        objInfo.tables.reverse();

        // get products if have a cart store
        if (this.getCartStore()) { this.GetCartItems(objInfo); }

        return objInfo;

    },

    GetSaveTables: function (rInfo, vNodeRow, vParentKeys) {
        var dicTables, ndeCurrent;

        dicTables = {};

        // loop through all the nodes
        ndeCurrent = vNodeRow;
        while (ndeCurrent) {

            // get the node info based on type
            if (ndeCurrent.get('NodeTypeDesc') === "DynamicNode" || ndeCurrent.get('NodeTypeDesc') === "TableNode") {
                this.GetDynamicNodeInfo(rInfo, vParentKeys, ndeCurrent);
            } else if (ndeCurrent.get('NodeTypeDesc') === "LocationNode") {
                this.GetLocationInfo(rInfo, vParentKeys, dicTables, ndeCurrent);
            } else if (ndeCurrent.get('NodeTypeDesc') === "BarcodeNode") {
                this.GetBarcodeInfo(rInfo, vParentKeys, ndeCurrent);
            } else {
                this.GetNodeInfo(rInfo, vParentKeys, dicTables, ndeCurrent);
            }

            // check if have validation errors added Hidden because there is an issue with null and default 0
            if (ndeCurrent.get('ValidationType') !== '') { // && !ndeCurrent.get('Hidden')) {
                switch (ndeCurrent.get('ValidationType')) {
                    case 'info':
                        rInfo.validationResults.infos.push(ndeCurrent.get('ValidationText'));
                        break;
                    case 'warning':
                        rInfo.validationResults.warnings.push(ndeCurrent.get('ValidationText'));
                        break;
                    default:
                        rInfo.validationResults.criticals.push(ndeCurrent.get('ValidationText'));
                }

            }

            ndeCurrent = ndeCurrent.getNextNode();

        }

        // push all the tables onto the info object
        this.PushTablesOntoInfo(rInfo, vParentKeys, dicTables);

    },

    GetDynamicNodeInfo: function (rInfo, vParentKeys, ndeCurrent) {
        var i, objValue;

        //// cloned dynamic child don't have children

        for (i = 0; i < ndeCurrent.getChildNodes().length; i++) {

            objValue = {
                field: ndeCurrent.get('FieldToStoreValue'),
                value: ndeCurrent.getChildNodes()[i].get('Value')
            };

            if (!ndeCurrent.get('ExcludeFromSave')) {
                vParentKeys.push(objValue);
            }

            this.GetSaveTables(rInfo, ndeCurrent.getChildNodes()[i], vParentKeys);

            if (!ndeCurrent.get('ExcludeFromSave')) {
                vParentKeys.remove(-1);
            }

        }

    },

    GetBarcodeInfo: function (rInfo, vParentKeys, ndeCurrent) {
        var i, objValues = {}, objTable,
            values = ndeCurrent.get('Value'),
            ProcessItems;

        ProcessItems = function (key, value) {
            objTable = {
                keys: {},
                tablename: ndeCurrent.get('StorageTable'),
                fields: {}
            };

            objTable.keys[ndeCurrent.get('FieldToStoreValue')] = key;
            objTable.fields.Quantity = value;
            objTable.fields.CallDate = DataFunc.getdate();

            // set optional values
            if (ndeCurrent.get('FKColumn')) {
                objTable.identity = '|' + ndeCurrent.get('FKColumn');
            }

            if (ndeCurrent.get('ExtraSQLInsertStatement')) {
                objTable.extraSQL.push({ statement: ndeCurrent.get('ExtraSQLInsertStatement') });
            }

            rInfo.tables.push(objTable);

        };
        if (values) {

            for (i = 0; i < values.length; i++) {

                if (objValues[values[i]] !== undefined) {
                    objValues[values[i]] += 1;
                } else {
                    objValues[values[i]] = 1;
                }

            }

            Ext.iterate(objValues, ProcessItems);

        }

    },

    GetLocationInfo: function (rInfo, vParentKeys, dicTables, ndeCurrent) {
        var i, objValues = {}, objTable,
            values = ndeCurrent.get('Value'),
            ProcessItems, table;

        table = ndeCurrent.get('StorageTable');

        if (!dicTables[table]) {
            objTable = {}

        } else {
            objTable = dicTables[table];
        }

        for (var key in values) {
            if (hasOwnProperty.call(values, key)) {
                objTable[key] = values[key];
            }
        }

        if (!dicTables[table]) {
            var tempTable = {
                tablename: ndeCurrent.get('StorageTable'),
                fields: objTable,
                extraSQL: []
            }
            // set optional values
            if (ndeCurrent.get('FKColumn')) {
                tempTable.identity = '|' + ndeCurrent.get('FKColumn');
            }

            if (ndeCurrent.get('ExtraSQLInsertStatement')) {
                tempTable.extraSQL.push({ statement: ndeCurrent.get('ExtraSQLInsertStatement') });
            }

            rInfo.tables.push(tempTable);
        }
    },

    GetNodeInfo: function (rInfo, vParentKeys, dicTables, ndeCurrent) {
        var table, field, value, ndeView;

        // get the table and field names for the node
        table = ndeCurrent.get('StorageTable');
        field = ndeCurrent.get('FieldToStoreValue');

        ndeView = VIPSMobile.view.data.fields[ndeCurrent.getNodeViewType()] || VIPSMobile.view.dashboard.charts[ndeCurrent.getNodeViewType()] || {};
        value = (ndeView.getTypedValue) ? ndeView.getTypedValue(ndeCurrent.get('Value')) : ndeCurrent.get('Value');

        // check if have a field to store in
        if (field) {

            // check if saving based on the answer type
            if (ndeCurrent.get('SaveAnswerTypes') & ndeCurrent.get('Answered')) {

                // check if the value is a primary key
                if (ndeCurrent.get('IsPrimaryKey')) {

                    if (ndeCurrent.get('Value')) {
                        rInfo.keys[field] = value;
                    } else {
                        console.warn("[WARNING] Primary key field '" + field + "' is null so ignoring value.");
                    }

                } else {

                    // check if a table is set
                    if (table) {

                        // create the table objects if needed
                        if (!dicTables[table]) {
                            dicTables[table] = { extraSQL: [] };
                        }

                        // set the value
                        if (Ext.isArray(value)) {
                            value = value.join(",");
                        }

                        dicTables[table][field] = value;

                        console.log(ndeCurrent.get('Description'), ndeCurrent.get('Value'));
                        if (!!(ndeCurrent.get('commentsField')) && ndeCurrent.get('commentsField').field !== '' && ndeCurrent.get('commentsField').value !== '') {
                            dicTables[table][ndeCurrent.get('commentsField').field] = ndeCurrent.get('commentsField').value;
                        }

                        // set optional values
                        if (ndeCurrent.get('FKColumn')) {
                            dicTables[table].identity = (vParentKeys.length > 0) ? '|' + ndeCurrent.get('FKColumn') : ndeCurrent.get('FKColumn');
                        }

                        if (ndeCurrent.get('ExtraSQLInsertStatement')) {
                            dicTables[table].extraSQL.push({ statement: ndeCurrent.get('ExtraSQLInsertStatement') });
                        }

                    } else {

                        console.warn("[WARNING] Trying to save field '" + field + "' but no table is set so ignoring value.");

                    }

                }

            }

        }

    },

    // push all the tables onto the info object
    PushTablesOntoInfo: function (rInfo, vParentKeys, dicTables) {
        var i, objTable, loopFn;

        loopFn = function (parentKey) { objTable.keys[parentKey.field] = parentKey.value; };

        Ext.iterate(dicTables, function (vTablename, vValue) {

            // check if the value is an array
            if (!Ext.isArray(vValue)) {
                vValue = [vValue];
            }

            // loop through all the values
            for (i = 0; i < vValue.length; i++) {

                // set base table object
                objTable = {
                    tablename: vTablename
                };

                // add optional values
                if (vValue[i].extraSQL.length) {
                    objTable.extraSQL = vValue[i].extraSQL;
                }
                if (vValue[i].identity) {
                    objTable.identity = vValue[i].identity;
                }

                // delete optional values
                delete vValue[i].identity;
                delete vValue[i].extraSQL;

                // set the table's keys
                if (vParentKeys.length) {
                    objTable.keys = {};
                    Ext.iterate(vParentKeys, loopFn);
                }

                // set the fields to whatever is left
                objTable.fields = vValue[i];

                // push the table onto info object
                rInfo.tables.push(objTable);

            }

        });

    },

    GetCartItems: function (rInfo) {
        var filters, items, i, objTable, lstIdentityFields, ProcessItems;

        lstIdentityFields = ["OrderProductID", "id"];

        // remove filters to get all the products in the store
        filters = this.getCartStore().getFilters();
        this.getCartStore().setFilters(null);
        items = this.getCartStore().getRange();
        this.getCartStore().setFilters(filters);

        ProcessItems = function (uom, index) {
            var uomTag,
                div = document.createElement('div'),
                value = uom.data;

            div.innerHTML = uom.get("Name");
            value.Name = div.innerText;

            uomTag = uom.get('Tag');

            var uomData = { ...uom.raw, ...uom.data };
            DataFunc.RemoveNulls(uomData);

            objTable = {
                tablename: uomTag.TableName,
                keys: {
                    ProductID: uom.get('ProductID'),
                    UOM: uom.get("UOM")
                },
                fields: {
                    ...uomData
                }
            };

            delete objTable.fields.Tag;
            delete objTable.fields.GroupName;


            //notes need to be removed if still has all options
            if (objTable.fields.Notes !== undefined && objTable.fields.Notes !== null) {
                if (objTable.fields.Notes.indexOf('[') !== -1) {
                    objTable.fields.Notes = '';
                }
            }

            // Extra node values after the ProductDetailNode
            Ext.iterate(uomTag.NodeValues, function (field, value) {

                // if the field doesn't exist add it
                if (!objTable.fields[field] && !objTable.keys[field] && !rInfo.keys[field]) {
                    objTable.fields[field] = value;
                }

            });

            Ext.iterate(objTable.fields, function (field, value) {
                // special case to remove identity fields
                if (lstIdentityFields.indexOf(field) > -1) {
                    delete objTable.fields[field];
                }
            });


            // set the identity if needed
            if (uomTag.identity) {
                objTable.identity = uomTag.identity;
            }

            rInfo.tables.push(objTable);

        };

        // loop through all the products
        Ext.iterate(items, ProcessItems);

    },

    ValidateAllNodes: function () {
        var allNodes = [];

        this.getAllNodes(this.getNodeTree(), allNodes);

        // revalidate all the nodes
        this.revalidateNode(allNodes, 0, null);

    },

    // get all the nodes into the array
    getAllNodes: function (node, allNodes) {
        var i;

        // add the node to the array
        allNodes.push(node);

        // recurse through any children
        for (i = 0; i < node.getChildNodes().length; i++) {
            this.getAllNodes(node.getChildNodes()[i], allNodes);
        }

        // add the next node
        if (node.getNextNode()) {
            this.getAllNodes(node.getNextNode(), allNodes);
        }

    },

    // revalidate all the nodes when save pressed
    revalidateNode: function (nodes, index, saveNode) {

        // check if there are more nodes
        if (index < nodes.length) {

            // validate the node
            this.ValidateNode(nodes[index], function () {

                // revalidate the next node
                this.revalidateNode(nodes, index + 1, saveNode);

            }, this);

        }

    }

});
