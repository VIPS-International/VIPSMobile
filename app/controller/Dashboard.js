//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.controller.Dashboard', {
    extend: 'Ext.app.Controller',

    config: {

        views: [
            'dashboard.Detail',
            'dashboard.Index',
            'dashboard.Menu',
            'dashboard.charts.BarChartNode',
            'dashboard.charts.GuageChartNode',
            'dashboard.charts.LabelChartNode',
            'dashboard.charts.LineChartNode',
            'dashboard.charts.PieChartNode',
            'dashboard.charts.TableChartNode',
            'dashboard.charts.SQLWebReportNode',
            'dashboard.params.DateNode',
            'dashboard.params.IntegerNode',
            'dashboard.params.TextNode',
            'dashboard.params.ListNode',
            'data.Empty',
            'data.fields.BarcodeNode',
            'data.fields.CurrencyNode',
            'data.fields.DateNode',
            'data.fields.DynamicNode',
            'data.fields.EmailTextNode',
            'data.fields.FloatNode',
            'data.fields.ImageNode',
            'data.fields.IntegerNode',
            'data.fields.LabelNode',
            'data.fields.LengthOfTimeNode',
            'data.fields.LibraryItemNode',
            'data.fields.ListNode',
            'data.fields.LocationNode',
            'data.fields.MapNode',
            'data.fields.MultiLineTextNode',
            'data.fields.MultiPickListNode',
            'data.fields.PhoneTextNode',
            'data.fields.ProductDetail',
            'data.fields.Signature',
            'data.fields.SQLWebReportNode',
            'data.fields.TableNode',
            'data.fields.RatingNode',
            'data.fields.table.FloatNode',
            'data.fields.table.GridNode',
            'data.fields.table.IntegerNode',
            'data.fields.table.LabelNode',
            'data.fields.table.ListNode',
            'data.fields.TextNode',
            'data.fields.TimeNode',
            'data.fields.UseListItemsAsOptions',
            'data.fields.UseManualKeyEntry',
        ],

        routes: {
            'Dashboard/:callflowId': {
                action: 'showCart',
                conditions: {
                    ':callflowId': '[0-9]+'
                }
            },
            'Dashboard': 'route',
            'Dashboard/:callflowId': {
                action: 'route',
                conditions: {
                    ':callflowId': '[0-9]+'
                }
            },
            'Dashboard/:callflowId/:questionId': {
                action: 'route',
                conditions: {
                    ':callflowId': '[0-9]+',
                    ':questionId': '[0-9]+'
                }
            }
        },

        models: ['CallFlowNode', 'DashboardMenuItem', 'DashboardIndexItem', 'KeyValue'],
        stores: ['CallFlowNodes', 'DashboardMenu', 'DashboardIndexItems', 'KeyValueItems'],

        refs: {
            detail: {
                selector: '#dashboarddetail'
            },
            main: {
                selector: '#mainview'
            },
            index: {
                selector: '#dashboardindex'
            },
            menu: {
                selector: '#dashboardmenu'
            },
        },
        returningFromQuestionId: 0,
        currentCallFlowID: null,
        callFlow: null

    },

    setup: function () {

        // Get call flow data and sync required tables
        VIPSMobile.Sync.doMany({
            tableNames: [SQLTables.Tables.CallFlowDef
                , SQLTables.Tables.SQLStatements
                , SQLTables.Tables.ColourPallet
            ],
            forceSync: true,
            scope: this,
            callback: function () {

                // populate the call flow nodes when store is initialized
                ChartFunc.setColourPallet();

                VIPSMobile.CallFlows.processNodes();

                VIPSMobile.Main.setMask(this, false);
                this.WarnOnOldData();

            }
        });
    },

    route: function (callflowId, questionId) {
        var cf;

        console.debug('Dashboard.route', callflowId, questionId);

        this.setCurrentCallFlowID(callflowId);

        // setup app if needed
        VIPSMobile.Main.SetupApplication(this, function () {

            // wait for the stores to be loaded
            this.getCallFlowNodesStore().waitForLoad(function () {

                // if call flow not passed in, go to last call flow
                if (!callflowId && this.getCallFlowNodesStore() && this.getCallFlowNodesStore() && this.getCallFlowNodesStore().findRecord("InputMethod", 6)) {
                    callflowId = this.getCallFlowNodesStore().findRecord("InputMethod", 6).get("CallFlowID");
                }

                // check if the call flow exists (possible to get link to message that doesn't exist)
                if (callflowId) {

                    // wait for the callflow to be ready
                    VIPSMobile.CallFlows.callflowReady(callflowId, function () {

                        cf = VIPSMobile.CallFlows.get(callflowId);
                        if (!cf) { 
                            console.log('call flow not found: ' + callflowId); 
                            callflowId = 0; 
                            questionId = 0; 
                        }
                        
                        this.route2(cf, callflowId);

                    }, this);

                } else {

                    this.route2(null, questionId);
                }

            }, this);

        });

    },

    // called by route after call flow is ready
    route2: function (cf, callflowId) {
        var ques, blnFirstLoad;
                
        // check if loading call flow for first time
        if (!this.getCallFlow()) {
            blnFirstLoad = true;
        } else {
            blnFirstLoad = (cf && cf.getCallFlowID() !== this.getCallFlow().getCallFlowID()) || (cf && cf.getIndexStore().data.length === 0);
        }

        // remember the ids
        this.setCallFlow(cf);

        this.showMenu(cf);
        this.GetPreviousEntryTables(callflowId, function () {
            this.showCallFlow(cf, blnFirstLoad);
        });
    },

    showMenu: function (callflow) {
        var view, cfIndex;

        // show the menu
        view = Ext.create('VIPSMobile.view.dashboard.Menu');
        view.setup(this);
        VIPSMobile.Main.showView(this, view);

        // update the sync button badge
        this.ShowSyncOffLabel(VIPSMobile.User, VIPSMobile.User.getSyncFrequency());
    },

    onShowDashboardTap: function (btn) {
        var callflowId = btn.getItemId();

        this.redirectTo('Dashboard/' + callflowId);
    },

    // get the current call flow for the controller
    getCallFlow: function () {
        return VIPSMobile.CallFlows.getCurrent(this);
    },
    setCallFlow: function (callflow) {
        VIPSMobile.CallFlows.setCurrent(this, callflow);
    },

    ShowSyncOffLabel: function (user, freq) {
        this.getApplication().fireEvent('setBadgeText', '#datarefresh', (freq < 0) ? 'off' : false);
    },

    WarnOnOldData: function () {
        var datWarn;

        // calculate the time to warn before
        datWarn = Ext.Date.add(Ext.Date.parseDate(DataFunc.getUTCdate(), DataFunc.DATE_FORMAT), Ext.Date.HOUR, -12);
        datWarn = parseInt(Ext.Date.format(datWarn, DataFunc.DATE_FORMAT), 10);

        // check if last sync before warning
        if (VIPSMobile.SQLTables.MaxLastSync() < datWarn) {
            Ext.Msg.alert(VIPSMobile.getString('Sync Warning'), VIPSMobile.getString("It has been a long time since you have synchronized your device.") + "<br />" + VIPSMobile.getString("Please sync soon."));
        }

    },

    onRefreshTap: function () {
        var lstTables, i, strSQL;

        VIPSMobile.Main.setMask(this, 'Refreshing...');

        VIPSMobile.MsgQueue.submitNextMessage();

        VIPSMobile.Sync.doMany({
            tableNames: [SQLTables.Tables.CallFlowDef
                , SQLTables.Tables.SQLStatements
                , SQLTables.Tables.ColourPallet],
            forceSync: true,
            scope: this,
            callback: function (vTableName, vParams, vSyncRecords) {

                strSQL = "SELECT DISTINCT tablename as tablename FROM " + SQLTables.Tables.SQLStatements + " UNION SELECT '" + SQLTables.Tables.CallFlowDef + "'";
                DataFunc.executeSQL({
                    sql: strSQL,
                    scope: this,
                    success: function (tx, results) {

                        lstTables = [];
                        for (i = 0; i < results.rows.length; i++) {
                            lstTables.push(results.rows.item(i).tablename);
                        }

                        VIPSMobile.Sync.doMany({
                            tableNames: lstTables,
                            forceSync: true,
                            scope: this,
                            callback: function () {
                                VIPSMobile.Main.setMask(this, false);
                                this.route();
                            }
                        });
                    }

                });

            }

        });

    },

    openCallFlow: function (callFlowID) {

        // sync all the tables and proceed if sync ok
        this.GetPreviousEntryTables(callFlowID, function (ok) {

            if (this.openingCallFlow) {
                delete this.openingCallFlow[callFlowID];
            }

            if (ok) {
                this.redirectToIndex(callFlowID);
            }

        }, this);

    },

    onDashboardIndexItemTap: function (view, index, item, node) {
        console.log('onDashboardIndexItemTap', node, node.PreparedQuerys);

        if (node.getChildNodes().length > 0 && node.getChildNodes()[0].getNextNode()) {
            var tmpNode = Ext.clone(node.getChildNodes()[0].getNextNode()), store, view;

            view = Ext.create('VIPSMobile.view.dashboard.Index');
            store = Ext.create('VIPSMobile.store.IndexItems');

            while (tmpNode) {
                tmpNode.set('Group', node.get('Description'));
                store.add(tmpNode);
                tmpNode = tmpNode.getNextNode();
            }

            view.setup(this);
            view.setStore(store);

            // show the view
            VIPSMobile.Main.showView(this, view);

        }
    },

    LinkToWebsite: function (href, node) {
        var link = Ext.getDom('hidden_link'),
            clickevent = new MouseEvent('click'),
            prepHref;

        prepHref = DataFunc.PrepareQuery(node, href, false, true);

        link.href = prepHref;

        clickevent.initEvent('click', true, false);
        link.dispatchEvent(clickevent);

    },

    // sync sql statements, call flow nodes and any tables used by the call flow
    GetPreviousEntryTables: function (vStartNodeID, vCallBackFn, scope) {
        var strSQL, lstTables, i;

        // Get call flow data and sync required tables
        VIPSMobile.Sync.doMany({
            tableNames: [SQLTables.Tables.SQLStatements, SQLTables.Tables.CallFlowDef],
            scope: this,
            callback: function () {

                // Get all the data tables used by call flow
                strSQL = 'SELECT DISTINCT tablename as tablename FROM ' + SQLTables.Tables.SQLStatements + ' WHERE StartNodeID=' + vStartNodeID;
                DataFunc.executeSQL({
                    sql: strSQL,
                    scope: this,                    
                    success: function (tx, results) {

                        if (results.rows.length > 0) {

                            lstTables = [];
                            for (i = 0; i < results.rows.length; i++) {
                                lstTables.push(SQLTables.LocalTableName(results.rows.item(i).tablename || ""));
                            }

                            // sync all the tables used by the call flow
                            VIPSMobile.Sync.doMany({
                                tableNames: lstTables,
                                scope: this,
                                callback: function () {

                                    lstTables.push(SQLTables.Tables.SQLStatements);

                                    this.CheckTablesForSyncError(lstTables, vCallBackFn, scope);

                                }
                            });

                        } else {

                            this.CheckTablesForSyncError([SQLTables.Tables.SQLStatements], vCallBackFn, scope);

                        }

                    }

                });

            }
        });

    },

    // checks if all the tables exist in sql and if they had any sync errors
    CheckTablesForSyncError: function (tables, vCallBackFn, scope) {
        var i, lstSQL, intMissing;

        // build the sql to check if all the given tables exist in database
        lstSQL = [];
        for (i = 0; i < tables.length; i++) {
            lstSQL.push("SELECT COUNT(*) FROM SQLITE_MASTER WHERE type='table' AND lower(name)=lower('" + tables[i] + "')");
        }

        DataFunc.executeMany({
            statements: lstSQL,
            scope: this,
            callback: function (statements) {

                // count the number of existing tables
                intMissing = tables.length;
                for (i = 0; i < statements.length; i++) {
                    intMissing -= DataFunc.GetScalarValue(statements[i].results);
                }

                // filter tables to ones with errors
                i = 0;
                while (i < tables.length) {
                    if (!VIPSMobile.SQLTables.get(tables[i]).getLastSyncError()) {
                        tables.remove(i);
                    } else {
                        i++;
                    }
                }

                // if error found, ask user if want to continue
                if (tables.length > 0 || intMissing > 0) {
                    this.ErrorSyncingTables(tables, intMissing, vCallBackFn);
                } else {
                    if (vCallBackFn) {
                        vCallBackFn.apply(scope || this, [true]);
                    }
                }

            }
        });

    },

    ErrorSyncingTables: function (tables, missingTables, vCallBackFn, scope) {
        var strMsg, objButtons;

        VIPSMobile.Main.setMask(this, false);

        // set the message and buttons to display
        if (missingTables === 0 && window.navigator.onLine) {

            strMsg = 'There was a problem syncing ' + tables.length + ' ';
            strMsg += (tables.length > 1) ? 'tables.' : 'table.';
            objButtons = Ext.MessageBox.YESNOCANCEL;
        } else if (missingTables === 0 && !window.navigator.onLine) {
            objButtons = false;
            vCallBackFn.apply(scope || this, [true]); //load the next step
        } else {

            strMsg = 'Some required tables are missing.';
            objButtons = [Ext.MessageBox.YES, Ext.MessageBox.CANCEL];

        }
        strMsg += '<br />Please check your connection.<br />Would you like to try again?';

        if (objButtons) {

            // show the message box
            Ext.Msg.show({
                title: VIPSMobile.getString('Data Sync'),
                message: strMsg,
                buttons: objButtons,
                scope: this,
                iconCls: Ext.MessageBox.WARNING,
                fn: function (btn) {

                    if (btn === 'yes') {

                        VIPSMobile.Sync.doMany({
                            tableNames: tables,
                            forceSync: true,
                            scope: this,
                            callback: function () {
                                this.CheckTablesForSyncError(tables, vCallBackFn, scope);
                            }

                        });

                    } else {
                        if (vCallBackFn) {
                            vCallBackFn.apply(scope || this, [btn !== 'cancel']);
                        }
                    }

                }
            });

        }
    },

    showCallFlow: function (callflow, firstLoad) {

        // set up the call flow
        this.setupCallFlow(callflow);
        this.setCurrentCallFlowID(callflow.getCallFlowID());

        // if call flow has changed, check for drafts
        if (firstLoad || !this.getReturningFromQuestionId()) {

            // add application accessed cdr
            VIPSMobile.CDR.add(VIPSMobile.CDR.Types.ApplicationsAccessed, null, callflow.getDescription(), callflow.getCallFlowID());

            // check if there is an unsaved draft
            if (callflow.getHasDraft()) {

                VIPSMobile.Main.setMask(this, false);

                if (callflow.getLastQuestionId()) {
                    this.redirectToQuestion(callflow.getCallFlowID(), callflow.getLastQuestionId());
                }

            } else {

                VIPSMobile.Main.setBadgeText('#DataCart', 0);

                // create the call flow
                callflow.Create();

            }

        } else {

            // check if returning to index from a question
            this.getIndex().scrollToItem(this.getReturningFromQuestionId());
            this.setReturningFromQuestionId(0);

        }

    },

    showQuestion: function (callflow, node) {
        var strNodeXtype, view;

        try {

            this.getCallFlow().setCurrentNode(node);
            this.getCallFlow().setLastQuestionId(node.getId());

            strNodeXtype = node.getNodeViewType();

            if (node.get('IsReadOnly') && node.get('TypeID') !== CallFlowNode.Types.BarcodeNode) {
                strNodeXtype = 'LabelNode';
            }

            // check if the field type exists
            if (VIPSMobile.view.data.fields[strNodeXtype]) {

                // create the view
                view = Ext.create('VIPSMobile.view.data.fields.' + strNodeXtype);
                view.setup(this, node);

                // show the detail view
                VIPSMobile.Main.showView(this, view);

            } else {
                console.error('Node type not found: ', strNodeXtype);
            }

        } catch (ex) {
            console.error('Error showing question: ', ex.message);
        }

    },

    onClearSigTap: function () {
        this.getDetail().clearCanvas();
    },

    onBackTap: function (btn) {

        this.redirectToMenu();

    },

    onCloseCfTap: function (btn) {
        var cf = this.getCallFlow(),
            node = cf._nodeTree;

        if (cf.getHasDraft()) {

            Ext.Msg.confirm(VIPSMobile.getString('Delete Draft'),
                VIPSMobile.getString('Would you like to discard your ') + cf.getDescription() + '?',
                function (button) {
                    VIPSMobile.log("Data.onCloseCfTap()", button, cf.startNodeID);
                    if (button === 'yes') {

                        while (node._nextNode) {
                            node = node._nextNode;
                        }
                        this.RollbackToUndo(node, true);

                        cf.DeleteDraft();

                    }

                    // close call flow
                    this.onBackTap();

                }, this);

        } else {

            // close call flow
            this.onBackTap();

        }

    },

    onIndexTap: function (btn) {

        // clear the last question id
        this.getCallFlow().setLastQuestionId(null);

        // set the returning question if so index highlights it
        if (this.getDetail() && this.getDetail().getNode()) {
            this.setReturningFromQuestionId(this.getDetail().getNode().getId());
        } else {
            this.setReturningFromQuestionId(0);
        }

        this.redirectToIndex();

    },

    showReport: function (item) {
        var view;

        view = Ext.create('VIPSMobile.view.data.fields.SQLWebReportNode');
        view.setup(this, item);

        // show the detail view
        VIPSMobile.Main.showView(this, view);

    },

    onCartItemBackTapTap: function () {
        this.setAcceptActionOverride(null);
        this.redirectToIndex();
    },

    OpenLibraryItem: function (item) {
        var libraryItem = item.get('Value'),
            libraryController = this.getApplication().getController('Library');

        if (typeof libraryItem === "string") {
            libraryController.DoClickEvent(libraryItem, libraryItem.indexOf('http') !== -1);
        } else {

            VIPSMobile.Main.setMask(this, 'Loading...');

            href = VIPSMobile.ServiceURL + 'Files/' + VIPSMobile.User.getMailbox() + '/10/' + libraryItem.ID;

            libraryController.DoClickEvent(href, true);

            VIPSMobile.Main.setMask(this, false);

            libraryController.SaveRecentFile(libraryItem, true);

        }

    },

    CalculateSaveNodeValue: function (saveNode) {
        var allNodes;

        if (this.getCallFlow()) {

            this.getCallFlow().GetCalculatedValue2(saveNode, function () {

                // get all the nodes into an array
                allNodes = [];
                this.getAllNodes(this.getCallFlow().getNodeTree(), allNodes);

                // re-calculate the nodes that need it then re-validate
                this.recalculateNode(allNodes, 0, saveNode);

            }, this);

        } else {

            console.error('Error with save CalculateSaveNodeValue, the CallFlow is missing');
            Ext.Msg.alert(VIPSMobile.getString('Save Error'), VIPSMobile.getString('There was an error saving the information.<br />Please delete the draft and re-enter your values.'), Ext.emptyFn, this);

        }

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

    // recalculate all the nodes when save pressed
    recalculateNode: function (nodes, index, saveNode) {

        // check if there are more nodes
        if (index < nodes.length) {

            if (nodes[index].get("ReCalcValueSQLAgainBeforeSave")) {

                // calculate the node
                this.getCallFlow().GetCalculatedValue2(nodes[index], function () {

                    // recalculate the next node
                    this.recalculateNode(nodes, index + 1, saveNode);

                }, this);

            } else {

                // recalculate the next node
                this.recalculateNode(nodes, index + 1, saveNode);

            }
        } else {

            // revalidate all the nodes
            this.revalidateNode(nodes, 0, saveNode);

        }

    },

    // revalidate all the nodes when save pressed
    revalidateNode: function (nodes, index, saveNode) {

        // check if there are more nodes
        if (index < nodes.length) {

            // validate the node
            this.getCallFlow().ValidateNode(nodes[index], function () {

                // revalidate the next node
                this.revalidateNode(nodes, index + 1, saveNode);

            }, this);

        } else {

            // save the call flow
            this.SaveCallFlowEntries(saveNode);

        }

    },

    SaveCallFlowEntries: function (saveNode) {
        var cf, objInfo, hasKeys;

        // get the call flow save info
        cf = this.getCallFlow();
        objInfo = this.getCallFlow().GetSaveInfo();

        VIPSMobile.log('Save Info', objInfo);

        // check if there are any keys
        hasKeys = false;
        Ext.iterate(objInfo.keys, function () { hasKeys = true; }, this);

        // check for any errors in the data
        if (!objInfo.tables || objInfo.tables.length === 0 || !hasKeys || !objInfo.startNodeID) {

            // raise the error so it's logged and tell user to reenter
            console.error('Error with save info, keys or tables missing', objInfo);
            Ext.Msg.alert(VIPSMobile.getString('Save Error'),

                VIPSMobile.getString('There was an error saving the information.<br />you will have to re-enter your values.'),

                function (btn) {

                    this.RollbackToUndo(saveNode);
                    cf.DeleteDraft();

                    // close call flow
                    this.onBackTap();

                }, this);

        } else {

            // check for validation errors
            if (objInfo.validationResults.warnings.length + objInfo.validationResults.criticals.length) {

                this.ShowValidationErrors(saveNode, objInfo);

            } else {

                // no validation errors so confirm and save
                Ext.Msg.confirm(VIPSMobile.getString('Save'), VIPSMobile.getString('Save now?'), function (btn) {

                    if (btn === 'yes') {
                        this.CommitFormData(saveNode, objInfo);
                    }

                }, this);

            }

        }

    },

    ShowValidationErrors: function (saveNode, objInfo) {
        var strMsg, i,
            intCritCount = objInfo.validationResults.criticals.length,
            intWarnCount = objInfo.validationResults.warnings.length;

        if (intCritCount === 0) {

            // no criticals but has warnings
            if (intWarnCount > 1) {
                strMsg = 'There are ' + intWarnCount + ' warnings, continue with save?';
            } else {
                strMsg = 'There is 1 warning, continue with save?';
            }

            strMsg += '<ul style="font-size: small">';
            for (i = 0; i < intWarnCount; i++) {
                strMsg += '<li>' + objInfo.validationResults.warnings[i] + '</li>';
            }
            strMsg += '</ul>';

            Ext.Msg.confirm(VIPSMobile.getString('Validation'), strMsg, function (btn) {
                if (btn === 'yes') {
                    this.CommitFormData(saveNode, objInfo);
                }
            }, this);

        } else {

            if (intWarnCount === 0) {

                // all criticals
                if (intCritCount > 1) {
                    strMsg = 'There are ' + intCritCount + ' errors so saving is disabled.';
                } else {
                    strMsg = 'There is 1 error so saving is disabled.';
                }

                strMsg += '<ul style="font-size: small">';
                for (i = 0; i < intCritCount; i++) {
                    strMsg += '<li>' + objInfo.validationResults.criticals[i] + '</li>';
                }
                strMsg += '</ul>';

                Ext.Msg.alert(VIPSMobile.getString('Validation'), strMsg);

            } else {

                // criticals and warnings
                if (intWarnCount > 1) {
                    strMsg = 'There are ' + intWarnCount + ' warnings';
                } else {
                    strMsg = 'There is 1 warning';
                }

                strMsg += '<ul style="font-size: small">';
                for (i = 0; i < intWarnCount; i++) {
                    strMsg += '<li>' + objInfo.validationResults.warnings[i] + '</li>';
                }
                strMsg += '</ul>';

                strMsg += ' and ';

                if (intCritCount > 1) {
                    strMsg += intCritCount + ' errors so saving is disabled.';
                } else {
                    strMsg += ' 1 error so saving is disabled.';
                }

                strMsg += '<ul style="font-size: small">';
                for (i = 0; i < intCritCount; i++) {
                    strMsg += '<li/>' + objInfo.validationResults.criticals[i] + '</li>';
                }
                strMsg += '</ul>';

                Ext.Msg.alert(VIPSMobile.getString('Validation'), strMsg);

            }

        }

    },

    CommitFormData: function (ndeSave, objInfo) {
        var strSaveComplete = VIPSMobile.getString("Save Completed");

        if (ndeSave.get('SaveSuccessDescription') !== "") {
            strSaveComplete = VIPSMobile.getString(ndeSave.get('SaveSuccessDescription'));
        }

        try {

            delete objInfo.validationResults;

            VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.DataEntry, objInfo);

            VIPSMobile.CDR.add(VIPSMobile.CDR.Types.ActionBoxPostData, null, null, null, this.getCallFlow().getCallFlowID());

            // delete the draft
            this.getCallFlow().DeleteDraft();

            // update the local db with the info
            try {

                if (ndeSave.get('ReLoadPreviousEntriesOnChange')) {

                    VIPSMobile.Main.setMask(this, 'Saving...');

                    this.SaveToLocalDBTable(objInfo, 0, {}, function () {

                        this.RollbackToUndo(ndeSave);

                        VIPSMobile.Main.setMask(this, false);

                        Ext.Msg.alert(VIPSMobile.getString("Data"), strSaveComplete);

                    });
                } else {

                    this.SaveToLocalDBTable(objInfo, 0, {});

                    this.RollbackToUndo(ndeSave);

                    Ext.Msg.alert(VIPSMobile.getString("Data"), strSaveComplete);

                }

            } catch (ex) {
                console.error('Error saving to local db', ex.message);
            }



        } catch (exx) {

            console.error('Error committing save data', exx.message);
            Ext.Msg.alert(VIPSMobile.getString('Error'), VIPSMobile.getString('There seems to be an error saving entry.'));

        }

    },

    SaveToLocalDBTable: function (vInfo, i, vIdentities, vCallback) {
        var j, funcIterator, objTable, strFields, strKeys, strValues, strValue, objValues, strSQL, strIdentity, strWHERE, blnUpdate, value;

        strKeys = [];
        strFields = [];
        strValues = [];
        objValues = [];

        // get the table def
        objTable = VIPSMobile.SQLTables.get(vInfo.tables[i].tablename);

        funcIterator = function (key, value) {

            //if (strFields.length > 0) strFields += ',';
            strFields.push(key);

            //if (strValues.length > 0) strValues += ',';
            strValues.push("?");
            objValues.push(value);

            //if (strKeys.length > 0) strKeys += ' AND ';
            strKeys.push(key);

        };

        // add identity to keys if needed
        if (vInfo.tables[i].identity && vInfo.tables[i].identity[0] === '|') {
            strIdentity = vInfo.tables[i].identity;
            strIdentity = strIdentity.replace('|', '');
            if (vInfo.tables[i].keys) {
                vInfo.tables[i].keys[strIdentity] = vIdentities[strIdentity];
            }
        }

        // get all the global and table keys
        Ext.iterate(vInfo.keys, funcIterator);
        Ext.iterate(vInfo.tables[i].keys, funcIterator);

        // check if there is already an entry with these keys
        strSQL = 'SELECT ' + objTable.getKeyId() + ' FROM ' + objTable.getName() + ' WHERE ' + strKeys.join('=? AND ') + '=?';
        DataFunc.executeSQL({
            sql: strSQL,
            params: objValues,
            scope: this,
            success: function (tx, results) {

                // use prev entry's id if found to cause replace
                if (!vInfo.tables[i].identity && results.rows.length > 0) {

                    blnUpdate = true;

                    value = DataFunc.GetScalarValue(results);

                    //if (strFields.length > 0) strFields += ',';
                    strFields.push(objTable.getKeyId());

                    //if (strValues.length > 0) strValues += ',';
                    strValues.push("?");
                    objValues.push(value);

                    for (j = 0; j < strKeys.length; j++) {

                        if (j === 0) {
                            strWHERE = " WHERE ";
                        } else {
                            strWHERE += " AND ";
                        }

                        if (typeof objValues[j] === "string") { objValues[j] = '\'' + objValues[j] + '\''; }
                        strWHERE += strKeys[j] + '=' + objValues[j];

                    }

                    strFields = [];
                    strValues = [];
                    objValues = [];

                    Ext.iterate(vInfo.tables[i].fields, funcIterator);

                    strSQL = 'UPDATE ' + objTable.getName() + ' SET ';
                    for (j = 0; j < strFields.length; j++) {
                        if (j !== 0) { strSQL += ", "; }
                        strValue = strValues[j];
                        if (typeof strValue === "string") { strValue = '\'' + strValue + '\''; }
                        strSQL += strFields[j] + '=' + strValues[j];
                    }

                    strSQL += strWHERE;

                } else {

                    blnUpdate = (results.rows.length > 0);

                    Ext.iterate(vInfo.tables[i].fields, funcIterator);

                    strSQL = 'INSERT OR REPLACE INTO ' + objTable.getName() + ' (' + strFields.join(',') +
                        ') VALUES (' + strValues.join(',') + ')';

                }

                // update db
                DataFunc.executeSQL({
                    sql: strSQL,
                    params: objValues,
                    scope: this,
                    success: function (tx, results) {

                        if (!blnUpdate) {

                            if (vInfo.tables[i].identity || results.insertId) {

                                // add this fake ID to a list to be deleted the next
                                // time this table is succesfully synced
                                console.debug("added Phantom record: ", objTable, results);
                                this.AddPhantom(objTable, results.insertId);

                            }

                            // remember the identity
                            if (vInfo.tables[i].identity && vInfo.tables[i].identity[0] !== '|') {
                                vIdentities[vInfo.tables[i].identity] = results.insertId;
                            }

                        }

                        // call for the next table
                        if (++i < vInfo.tables.length) {
                            this.SaveToLocalDBTable(vInfo, i, vIdentities, vCallback);
                        } else {
                            if (vCallback) {
                                vCallback.apply(this);
                            }
                        }

                    }
                });

            }
        });

    },

    AddPhantom: function (sqlTable, id) {
        var lstIds;

        if (sqlTable.getPhantomIds()) {
            lstIds = sqlTable.getPhantomIds();
        } else {
            lstIds = [];
        }

        if (lstIds.indexOf(id) < 0) {
            lstIds.push(id);
            sqlTable.setPhantomIds(lstIds);
            sqlTable.save();
        }

    },

    onAutoAdvanceChange: function (field, newValue, oldValue) {
        VIPSMobile.User.setOnActionNext(newValue);
    },

    onShowSavedReportsTap: function () {
        var i, lstIds, savedAt, button;

        // get the ids for the saved reports
        lstIds = this.getCallFlow().getSavedReports();

        if (lstIds.length > 0) {

            // create the saved reports sheet if needed
            if (!this.getIndex().sortSheet) {

                this.getIndex().sortSheet = Ext.Viewport.add({
                    xtype: 'actionsheet',
                    hidden: true,
                    defaults: {
                        ui: 'action',
                        scope: this,
                        handler: this.ShowSavedReport
                    }
                });

            } else {
                this.getIndex().sortSheet.removeAll();
            }

            // loop through all the saved reports
            for (i = 0; i < lstIds.length; i++) {

                // format the saved time
                savedAt = Ext.Date.parseDate(lstIds[i], DataFunc.DATE_FORMAT);
                if (savedAt.isToday()) {
                    savedAt = 'Today - ' + Ext.Date.format(savedAt, Ext.Date.patterns.ShortTime);
                } else if (savedAt.isYesterday()) {
                    savedAt = 'Yesterday - ' + Ext.Date.format(savedAt, Ext.Date.patterns.ShortTime);
                } else {
                    savedAt = Ext.Date.format(savedAt, 'F d, Y - g:i A');
                }

                // add button to sheet
                button = this.getIndex().sortSheet.add({
                    text: savedAt,
                    ui: 'confirm'
                });
                button.savedAt = lstIds[i];

            }

            // add button to sheet
            this.getIndex().sortSheet.add({
                text: 'Cancel',
                ui: 'decline'
            });

            this.getIndex().sortSheet.show();

        } else {

            // no saved reports
            Ext.Msg.alert(VIPSMobile.getString('Saved Reports'), VIPSMobile.getString('No reports have been saved for this option.'));

        }

    },

    // show the saved report clicked on from action sheet
    ShowSavedReport: function (btn) {
        var strHTML, view;

        this.getIndex().sortSheet.hide();

        // show the report if not Cancel
        if (!!btn.savedAt) {

            DataFunc.executeSQL({
                sql: 'SELECT ReportHTML FROM SavedReports WHERE CallFlowID=' + this.getCallFlow().getCallFlowID() + ' AND SavedAt=' + btn.savedAt,
                scope: this,
                success: function (tx, results) {

                    strHTML = DataFunc.GetScalarValue(results);

                    view = Ext.create('VIPSMobile.view.data.fields.SQLWebReportNode');
                    view.setup(this);
                    // show the detail view
                    VIPSMobile.Main.showView(this, view);
                    view.showSaved(strHTML);

                },
                failure: function () {
                    console.error('Error getting saved report', btn.reportInfo, arguments);
                    Ext.Msg.alert(VIPSMobile.getString('Saved Report'), VIPSMobile.getString('Error retreiving saved report.'));
                }
            });

        }

    },

    // show the cart for current call flow
    onDataCartTap: function () {
        this.redirectToCart();
    },

    onPlaceOrderTap: function () {
        var lastNode;

        // use the last node as the save node to delete globals for call flow
        lastNode = this.getCallFlow().getNodeTree();
        while (lastNode.getNextNode()) {
            lastNode = lastNode.getNextNode();
        }

        // save the call flow entries
        this.CalculateSaveNodeValue(lastNode);

    },

    setupCallFlow: function (callflow) {
        var view;

        // clear the current node
        if(callflow){
        callflow.setCurrentNode(null);

        // create the view
        view = Ext.create('VIPSMobile.view.dashboard.Index');
        view.setup(this);
        view.setStore(callflow.getIndexStore());

        // show the view
        VIPSMobile.Main.showView(this, view);

        // associate the view with the store
        callflow.getIndexStore().view = view;
        }
    },

    showLeftContent: function () {
        //left this switch so can rememnber to put options later
        //switch (VIPSMobile.User.getMultiPanelOptions()[VIPSMobile.User.MultiPanelOptions.DataLeftPanel]) {
        //    default:
        this.showMenu(this.getCallFlow());
        //break;
        //}

    },

    showRightContent: function (leftView) {
        var callflow = this.getCallFlow();

        if (callflow && callflow.getCallFlowID()) {
            this.route(callflow.getCallFlowID(), (callflow.getCurrentNode()) ? callflow.getCurrentNode().getId() : 0);
        } else {
            VIPSMobile.Main.showView(this, 'VIPSMobile.view.data.Empty');
        }

    },

    onKeyboardTap: function (btn) {
        var curValue, strKey;

        // get the field and key pressed
        strKey = btn.getText().toString();

        // get the current value
        curValue = this.getDetail().getValue();

        // only allow one decimal if float
        if (strKey === '.' && this.getCallFlow().getCurrentNode().get('TypeID') === CallFlowNode.Types.CurrencyNode) {
            if (curValue.indexOf('.') >= 0) { strKey = ''; }
        }

        if (curValue === null) {
            curValue = "";
        }

        this.getDetail().setValue(curValue + strKey);

    },

    onClearAllTap: function (btn) {
        var field = this.getDetail().getField();
        field.setHtml('');
    },

    onBackSpaceTap: function (btn) {
        var field = this.getDetail().getField(),
            value = field.getHtml();

        if (!value && field.getValue) {
            value = field.getValue();
        }

        if (value === null) {
            value = "";
        } else {
            value = value.toString();
        }

        value = value.substring(0, value.length - 1);

        if (field.getHtml()) {
            field.setHtml(value);
        } else if (field.setValue) {
            field.setValue(value);
        }

    },

    onActionTap: function () {
        var ndeAction, strFunction;

        ndeAction = this.getCallFlow().getCurrentNode().get('OnAcceptAction');

        // set the next function based on node's accept action
        switch (this.getAcceptActionOverride() || ndeAction) {
            case CallFlowNode.AcceptActions.CART: strFunction = 'onDataCartDoneTap'; break;
            case CallFlowNode.AcceptActions.NOACTION: strFunction = 'onAcceptValue'; break;
            case CallFlowNode.AcceptActions.NEXT: strFunction = 'onNextTap'; break;
            case CallFlowNode.AcceptActions.INDEX: strFunction = 'onDoneTap'; break;
            default: strFunction = (VIPSMobile.User.getOnActionNext()) ? 'onNextTap' : 'onDoneTap'; break;
        }

        // delete the override
        this.setAcceptActionOverride(null);

        // call the given function
        if (strFunction) { this[strFunction](); }

    },

    dragStart: function (e) {
        var target;

        try {

            // find the component
            target = e.target.parentElement;
            while (target && target.id.indexOf('element') > 0) {
                target = target.parentElement;
            }

            // check if swiped on the main container
            if (target && target.id === this.getDetail().getId()) {

                // listen for drag end
                this.getDetail().element.on('dragend', this.dragEnd, this, { single: true });

            }

        } catch (ex) {
            console.error('Data.dragStart() Error', ex.message);
        }

    },

    dragEnd: function (e) {

        if (VIPSMobile.User.getDebug()) {
            console.log('Data detail dragend', e.deltaX, e.deltaY);
        }

        // check if a vertical swipe and long enough (if use this, max x and min y should probably be defineable via constants or user settings)
        if (e.absDeltaX < 10 && e.absDeltaY > 20) {

            // raise prev/next presses
            if (e.deltaY < 0) {
                this.onNextTap();
            } else {
                this.onPrevTap();
            }

        }

    },

    onPrevTap: function () {
        this.doPrevNext(-1);
    },

    onNextTap: function () {

        this.onAcceptValue(function () {
            this.doPrevNext(1);
        });

    },

    onDoneTap: function (btn) {

        this.onAcceptValue(function () {
            this.onIndexTap();
        });

    },
    onQuestionFullScreenTap: function () {
        var popup = Ext.create('VIPSMobile.view.Fullscreen');
        popup.setup(this.getDetail().getValue());
        Ext.Viewport.add(popup);
        this.popup = popup;
    },

    onReportInExcelTap: function () {
        var node = this.getDetail().getNode(),
            Params = DataFunc.ReplaceValueTags(node, node.get('SQLWebReportParams'), true);

        url = VIPSMobile.ServiceURL + 'Reports/GetReport';
        url += "?Mailbox=" + VIPSMobile.User.getMailbox();
        url += "&CallFlowID=" + node.get('CallFlowID');
        url += "&Params=" + Params;
        url += "&OutputFormat=" + 'EXCELOPENXML';

        this.DoClickEvent(url, true);

    },

    onReportInPDFTap: function () {
        var node = this.getDetail().getNode(),
            Params = DataFunc.ReplaceValueTags(node, node.get('SQLWebReportParams'), true);

        url = VIPSMobile.ServiceURL + 'Reports/GetReport';
        url += "?Mailbox=" + VIPSMobile.User.getMailbox();
        url += "&CallFlowID=" + node.get('CallFlowID');
        url += "&Params=" + Params;
        url += "&OutputFormat=" + 'PDF';

        this.DoClickEvent(url, true);

    },

    DoClickEvent: function (href, inBlank) {
        var link, clickevent;

        VIPSMobile.Main.setMask(this, 'Loading...');
        Ext.defer(function () { VIPSMobile.Main.setMask(this, false); }, 2000, this);

        link = Ext.getDom('hidden_link');
        clickevent = new MouseEvent('click');

        link.target = (inBlank) ? "_blank" : "";
        link.href = href;

        clickevent.initEvent('click', true, false);
        link.dispatchEvent(clickevent);

    },

    onReportInComplete: function () {
        console.log("onReportInComplete", arguments);
    },
    onDataCartDoneTap: function () {

        this.onAcceptValue(function () {
            this.redirectToCart();
        });

    },

    onAcceptValueChange: function (node, newValue, oldValue) {
        var blnChanged, usedInNode, allNodes, i;

        // set the node value
        this.getCallFlow().SetNodeValue(node, newValue, VIPSMobile.CallFlows.AnswerMethod.User);

        CFN = node;

        // get the first node the value is used in
        if (node.getNextNode()) {
            usedInNode = this.FieldUsedDownTree(node.get('FieldToStoreValue'), node);
        }

        // check if it's a dynamic with list as options
        if (node.get('TypeID') === CallFlowNode.Types.DynamicNode
            && node.get('DynamicListMode') === CallFlowNode.DynamicListModes.UseListItemsAsOptions
            && !node.get('DynamicAsTable')) {

            this.setDynamicOptionsValue(node, vCallback);
        } else if (node.get('TypeID') === CallFlowNode.Types.DynamicNode && node.get('DynamicAsTable')) {
            var children = node.getChildNodes();

            for (i = 0; i < children.length; i++) {
                if (children[i].getNextNode() && children[i].getNextNode().get("Value")) {
                    this.OrphanDestinationNodes(children[i].getNextNode());
                }
            }
        } else {

            if (!node.getNextNode()) {

                // recheck this node's destination
                this.OrphanDestinationNodes(node);

            } else if (usedInNode && usedInNode.getPrevNode()) {

                console.debug('Rebuilding from node ' + usedInNode.get('CallFlowID') + ' ' + usedInNode.get('Description'), usedInNode);

                // rebuild from the node before where value is used
                if (node === usedInNode) {
                    this.OrphanDestinationNodes(usedInNode);
                } else {
                    this.OrphanDestinationNodes(usedInNode.getPrevNode());
                }

            } else {
                this.getCallFlow().SaveDraft();
            }

        }

        // get all the nodes
        allNodes = [];
        this.getAllNodes(this.getCallFlow().getNodeTree(), allNodes);

        // need to validate all nodes that use this value

        // loop through all the nodes
        for (i = 0; i < allNodes.length; i++) {

            if (node.get('FieldToStoreValue')) {
                // check if the node uses the given field
                if (allNodes[i].getId() !== node.getId() && allNodes[i].get('FieldToStoreValue') !== node.get('FieldToStoreValue')) {
                    if (this.usesField(allNodes[i], node.get('FieldToStoreValue'), 'ValidationSQL')) {
                        this.getCallFlow().ValidateNode(allNodes[i]);
                    }
                }
            }

            if (this.usesField(allNodes[i], "", 'CalculatedValueSQL')) {
                if (allNodes[i].get('Answered') !== VIPSMobile.CallFlows.AnswerMethod.User) {
                    this.getCallFlow().GetCalculatedValue2(allNodes[i], function () { }, this);
                }
            }
        }
    },

    FieldUsedDownTree: function (field, node) {
        var i;

        if (!node) {
            return null;
        }

        // check if field used in this node
        if (this.usesField(node, field, ['CalculatedValueSQL', 'Dest1SQL', 'ListSQL', 'NarationSQL', 'RequiredFields', 'SQLWebReportParams'])) {
            return node;
        }

        // check if field used in any children
        for (i = 0; i < node.getChildNodes().length; i += 1) {

            if (!!this.FieldUsedDownTree(field, node.getChildNodes()[i])) {
                return node;
            }

        }

        // check if field used in next node
        return this.FieldUsedDownTree(field, node.getNextNode());

    },

    usesField: function (node, field, checkFields) {
        var i, j, regExp, extras;

        if (!Ext.isArray(checkFields)) {
            checkFields = [checkFields];
        }

        extras = [{
            key: "CartProducts", value: VIPSMobile.Cart.CartProducts
        }, {
            key: "CartItems", value: VIPSMobile.Cart.CartItems
        }, {
            key: "CartTotalPrice", value: VIPSMobile.Cart.CartTotalPrice
        }, {
            key: "!\\w+", value: "!"
        }];

        // loop through all the fields to check
        for (i = 0; i < checkFields.length; i += 1) {
            if (node.get(checkFields[i]) !== "") {

                // check if field used in this node
                if (field !== "") {
                    regExp = new RegExp('\\[' + field + '\\]', 'gi');
                    if (regExp.test(node.get(checkFields[i]))) {
                        return true;
                    }
                }

                for (j = 0; j < extras.length; j += 1) {

                    var defaultRegExp = new RegExp('\\[' + extras[j].key + '\\]', 'gi');
                    if (defaultRegExp.test(node.get(checkFields[i]))) {
                        return true;
                    }

                }

            }

        }

        return false;

    },

    OrphanDestinationNodes: function (node, vCallback) {
        var me, i;

        me = this;

        this.getCallFlow().setOrphans({});

        this.RemoveOrphanedNodes(node.getNextNode());

        for (i = 0; i < node.getChildNodes().length; i++) {
            this.RemoveOrphanedNodes(node.getChildNodes()[i]);
        }

        this.getCallFlow().setBuildCount(0);

        this.getCallFlow().FindDestinationNode(node, function () {

            // hide building mask
            VIPSMobile.Main.setMask(me, false);

            me.getDashboardIndexItemsStore().sort();

            if (vCallback) {
                me.getCallFlow().SaveDraft();
                vCallback.apply(me);
            }

        });

    },

    RemoveOrphanedNodes: function (node) {
        var i, cf;

        if (node) {

            // remove the next and all child nodes
            this.RemoveOrphanedNodes(node.getNextNode());
            for (i = 0; i < node.getChildNodes().length; i++) {
                this.RemoveOrphanedNodes(node.getChildNodes()[i]);
            }

            cf = VIPSMobile.CallFlows.getCurrent(this);

            // add the node to the orphans list
            if (!cf.getOrphans()[node.get('CallFlowID')]) {
                cf.getOrphans()[node.get('CallFlowID')] = [];
            }
            cf.getOrphans()[node.get('CallFlowID')].push(node);

            // remove the node from the index store
            cf.getIndexStore().remove(node);

        }

    },

    setDynamicOptionsValue: function (node, vCallback) {
        var i, newValues;

        // remove the nodes not needed, the value of the node has already been set
        // this removes unwanted options, and cleans up the node tree
        this.OrphanDestinationNodes(node);

        // get all the new values
        newValues = [];
        if (node.get('Value') !== null) {
            for (i = 0; i < node.get('Value').length; i++) {
                if (!node.getChildByValue(node.get('Value')[i])) {
                    newValues.push(node.get('Value')[i]);
                }
            }
        }

        if (!node.get('DynamicAsTable')) {
            this.addNewDynamicChild(node, newValues, 0, vCallback);
        }

    },

    addNewDynamicChild: function (node, values, index, vCallback) {
        var cf, ndeClone, children, i,
            me = this;

        cf = VIPSMobile.CallFlows.getCurrent(this);

        if (index < values.length) {

            node = cf.getCurrentNode();

            if (node.get('Value') && Ext.isArray(node.get('Value'))) {
                node.get('Value').splice(0, 0, values[index]);
            }

            node.set('Answered', true, VIPSMobile.CallFlows.AnswerMethod.Calculated); // all UseListItemsAsOptions should be defaulted to answered

            ndeClone = cf.CreateChildNode(node, node.get('CallFlowID'));
            ndeClone.set('Description', values[index]);
            ndeClone.set('Hidden', true);

            cf.SetNodeValue(ndeClone, values[index]);

            for (i = 0; i < node.get('Options').length; i++) {

                if (node.get('Options')[i].value === values[index]) {
                    ndeClone.set('Group', node.get('Options')[i].text);
                }

            }

            ndeClone.set('Destination1', node.get('Destination2'));
            ndeClone.set('ExcludeFromPrimaryKeyForLoad', false);

            ndeClone.set('Options', null);
            ndeClone.setChildNodes([]);
            ndeClone.set('Destination2', 0);

            //console.log(ndeClone.get('CallFlowID'), ndeClone.get('id'), ndeClone);
            children = node.getChildNodes();
            children.push(ndeClone);

            node.setChildNodes(children);

            // removes the non dynamic next nodes , leaves children alone
            this.RemoveOrphanedNodes(node.getNextNode());

            // build the children, but only the new one
            cf.BuildDynamicChildNodes(children.length - 1, node, function () {

                me.addNewDynamicChild(node, values, index + 1, vCallback);

            });

        } else {

            cf.SaveDraft();
            VIPSMobile.Main.setMask(this, false);
            vCallback.apply(this);

        }

    },

    // try to insert in same order as list eventually
    getNewDynamicIndex: function () {
        return 0;
    },

    onSpinnerTap: function () {
        console.log('onSpinnerTap', arguments);
    },
    // add or remove the product from the cart
    onUpdateCartProductTap: function () {
        var cartItem,
            newKey,
            newValue,
            values,
            cartStore = this.getCallFlow().getCartStore(),
            view = this.getDetail();

        console.log('updateCartProduct', arguments);
        console.log('updateCartProduct', view);

        values = view.getValues();

        Ext.iterate(values, function (nk, nv, no) {
            newKey = nk;
            newValue = nv;
            newObj = no;

            console.log('nv', newValue);

            cartItem = cartStore.getById(newKey);
            if (!cartItem) {
                cartItem = cartStore.add(newValue)[0];
            } else {
                cartItem.set("Quantity", newValue.quantity);
                cartItem.set("OverridePrice", newValue.overrideprice);
                cartItem.set("Discount", newValue.discount);
                cartItem.set("Notes", newValue.notes);
            }

            totalPrice = newValue.quantity * (newValue.overrideprice || cartItem.get("Price")) * ((100 - (newValue.discount || 0)) / 100);

            cartItem.set("TotalPrice", totalPrice);
        }, this);

        VIPSMobile.Cart.CartCount = cartStore.data.length;
        VIPSMobile.Cart.CartProducts = cartStore.getActiveCount();
        VIPSMobile.Cart.CartItems = cartStore.sum('Quantity');
        VIPSMobile.Cart.CartTotalPrice = cartStore.sum('TotalPrice').toFixed(2);

        view.UpdateTotals();

        this.getCallFlow().SaveDraft();
        this.getCallFlow().ValidateAllNodes();

    },

    RollbackToUndo: function (saveNode, discardClear) {
        var node;

        // go up the tree to find undo node
        node = saveNode;
        while (node && node.get('TypeID') !== CallFlowNode.Types.UndoBelowThisNode) {

            // clear the global if allowed
            if ((node.get('IsGlobal') & VIPSMobile.CallFlows.globals.flags.ClearOnSave) || (discardClear && (node.get('IsGlobal') & VIPSMobile.CallFlows.globals.flags.DiscardClear))) {
                VIPSMobile.CallFlows.globals.setValue(node.get('FieldToStoreValue'), null);
            }

            node = node.getPrevNode() || node.getParentNode();

        }

        // check if an undo node was found
        if (node && node.get('TypeID') === CallFlowNode.Types.UndoBelowThisNode) {

            // remove all the nodes after the found node
            this.OrphanDestinationNodes(node);
            node.setNextNode(null);

        } else {

            this.getCallFlow().setNodeTree(null);

            // no undo node so go back to menu
            this.onBackTap();

        }

    },

    redirectToCart: function (callflowId) {
        if (!callflowId) { callflowId = this.getCallFlow().getCallFlowID(); }
        this.redirectTo('Cart/' + callflowId);
    },
    redirectToMenu: function () {
        this.setCallFlow(null);
        this.redirectTo('Data');
    },
    redirectToIndex: function (callflowId) {

        if (!callflowId) { callflowId = this.getCallFlow().getCallFlowID(); }

        this.redirectTo('Dashboard/' + callflowId);

    },
    redirectToQuestion: function (callflowId) {
        if (!callflowId) { callflowId = this.getCallFlow().getCallFlowID(); }
        this.redirectTo('Dashboard/' + callflowId);
    },

    getHelpCategories: function (view) {
        var categories, callFlow, question, viewClass;

        categories = [];

        // get the call flow
        callFlow = VIPSMobile.CallFlows.getCurrent('Dashboard');
        if (callFlow) {

            // check if in a question
            question = callFlow.getCurrentNode();
            if (question) {
                categories.push('NodeID-' + question.get('CallFlowID'));
            }

            // add call flow category key
            categories.push('CallFlow-' + callFlow.getCallFlowID());

        }

        // add the view name
        viewClass = Ext.getClassName(view);
        viewClass = viewClass.substring(viewClass.indexOf('view') + 5);
        categories.push(viewClass);

        // add the default controller category
        categories.push('Dashboard');

        return categories;

    },
    onSendPhoneTap: function () {

        if (this.getDetail().getValue() !== "") {
            window.location.href = "tel:" + this.getDetail().getValue();
        }

    },

    onSendEmailTap: function () {

        if (this.getDetail().getValue() !== "") {
            window.location.href = "mailto:" + this.getDetail().getValue();
        }


    },

    onLoadFromServerTap: function (e) {

        var node = this.getDetail().getNode(),
            field = this.getDetail().getField();

        // load the blob
        blobInfo = {
            Mailbox: VIPSMobile.User.getMailbox(),
            FieldName: node.get('FieldToStoreValue'),
            ID: node.get('PreviousRecordId'),
            KeyField: VIPSMobile.SQLTables.getTables()[SQLTables.LocalTableName(node.get('StorageTable'))].getKeyId(),
            TableName: node.get('StorageTable'),
            CustNo: node.get('CustNo')
        };

        VIPSMobile.Main.setMask('Data', 'Loading from Server...');

        Ext.Ajax.request({
            url: VIPSMobile.ServiceURL + 'Data/GetRecordBlob/',
            headers: { 'Content-Type': 'application/json' },
            jsonData: blobInfo,
            success: function (response, opts) {

                VIPSMobile.Main.setMask('Data', false);
                node.set('Value', response.responseObject);
                field.fireEvent('change', '', node.get('Value'));
                setTimeout(function () {
                    field.setValue(node.get('Value'));
                }, 100);
                field.hideClearButton();
            },
            failure: function () {
                // set the value to null so the "correct" record doesn't get overridden                    
                VIPSMobile.Main.setMask('Data', false);
            }
        });
    }

});
