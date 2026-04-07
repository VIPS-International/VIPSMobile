//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.Detail', {
    extend: 'Ext.form.Panel',

    requires: [
        'VIPSMobile.ux.InfoSheet',
        'Ext.carousel.Carousel'
    ],

    tbConfig: {
        title: 'Data',
        items: [{
            text: VIPSMobile.getString('Cancel'),
            ui: 'back action',
            func: 'Index',
            addFn: function (controller) {
                // shouldn't show this if coming from cart
                return true;
            }
        }, {
            text: VIPSMobile.getString('Copy'),
            ui: 'action',
            align: 'right',
            func: 'Copy',
            addFn: function (controller) {
                // shouldn't show this if coming from cart
                return true;
            }

        }, {
            text: VIPSMobile.getString('Prev'),
            ui: 'back action',
            align: 'right',
            func: 'Prev',
            addFn: function (controller) {
                // shouldn't show this if coming from cart
                return true;
            },
            disabledFn: function (controller, view) {
                return view.getNodeIndex() === 0;
            }
        }, {
            text: VIPSMobile.getString('Next'),
            ui: 'forward action',
            align: 'right',
            func: 'Next',
            addFn: function (controller) {
                // shouldn't show this if coming from cart
                return true;
            },
            disabledFn: function (controller, view) {
                return (view.getNodeIndex() === (controller.getCallFlow().getIndexStore().getCount() - 1));
            }
        }, {
            xtype: 'button',
            itemId: 'closeCf',
            align: 'right',
            text: 'X'
        }]
    },

    fsButton: {
        iconCls: 'list',
        func: 'Index'
    },

    config: {
        itemId: 'datadetail',
        scrollable: 'vertical', //false,
        margin: '0.5em',
        panel: 'right',
        cls: 'rightpanel',

        layout: {
            type: 'vbox',
            align: 'stretch',
            pack: 'start'
        },

        field: null,
        initialTbConfig: null,
        node: null,
        nodeIndex: null,     // index of the node in the store index
        commentsField: null,
    },

    initialize: function () {
        this.setField(this.down('#field'));
        //this.setPanel('right');
    },

    setup: function (controller, node) {
        var cntDesc;

        if (VIPSMobile.Main.useMultiPanels()) {
            this.tbConfig.title = null;
        }

        // remember the node
        this.setNode(node);
        CFN = node;

        // add the group and description
        if (node.get('TypeID') !== CallFlowNode.Types.ProductDetail && node.get('TypeID') !== CallFlowNode.Types.SQLWebReportNode) {

            // get the index of the node in the index store
            this.setNodeIndex(controller.getCallFlow().getIndexStore().indexOf(node));

            // add the group
            this.insert(0, {
                xtype: 'container',
                html: node.get('Group'),
                cls: 'datadetailgroup',
                padding: '0.3em',
                docked: 'top'
            });

            // only add description if different than group
            if (node.get('Group') !== node.get('Description')) {

                cntDesc = this.insert(1, {
                    xtype: 'container',
                    html: node.get('Description'),
                    padding: '0.3em',
                    docked: 'top',
                    listeners: {
                        painted: { fn: this.setDescriptionFontSize },
                        click: { fn: this.showDescription }
                    }
                });
                cntDesc.element.on('tap', this.showDescription, cntDesc);

            }

        }

        // set the node value
        this.setValue(node.get('Value'));

        // add the naration SQL result to the top
        if (node.get('NarationSQL') && node.get('NarationSQL') !== '') {
            DataFunc.executeSQL({
                sql: DataFunc.PrepareQuery(node, node.get('NarationSQL'), true),
                scope: this,
                success: function (tx, results) {
                    var strItemHtml, strNarationHtml = "", objResults, resArray;
                    var field = this.getField();

                    if (results.rows.length === 1) {

                        objResults = DataFunc.GetScalarValue(results);
                        if (objResults) {
                            strNarationHtml = objResults + "";
                        }

                    } else if (results.rows.length > 1) {

                        resArray = DataFunc.GetResultsArray(results);

                        for (i = 0; i < results.rows.length; i++) {
                            strItemHtml = resArray[i].Field0 || "";
                            strNarationHtml += strItemHtml;
                        }

                    }

                    strNarationHtml = strNarationHtml.replace(/\n/gi, '<br/>');
                    if (strNarationHtml && strNarationHtml.indexOf("<iframe") !== -1 && Ext.browser.name !== "Chrome") {
                        strNarationHtml = strNarationHtml.replace("<iframe", `<a target="_blank"`).replace(`src="`, `href="`).replace('</iframe', '<h1 style="font-size: 72px"><i class="fab fa-youtube-square"></i></h1> View in device browser</a');
                        console.log(strNarationHtml);
                    }
                    var onPainted = function () {
                        var blnScrollable, height, elHeight = objNarationField.element.getHeight(),
                            parentHeight = objNarationField.element.parent().getHeight(),
                            availHeight = 0, usedHeight = 0;

                        console.log('painted');

                        objNarationField.parent.items.items.map(function (obj) {
                            if (obj !== objNarationField) {
                                console.log(obj, obj.element.getHeight());
                                usedHeight += obj.element.getHeight();
                            }
                        })

                        availHeight = parentHeight - usedHeight - 90;

                        if (availHeight < usedHeight && elHeight > 0) {
                            height = Math.min(...[parentHeight / 2, elHeight]);
                        } else if (elHeight > availHeight) {
                            height = availHeight;
                        } else {
                            height = elHeight;
                        }

                        blnScrollable = elHeight > height;

                        objNarationField.setHeight(height);
                        objNarationField.setScrollable(blnScrollable);

                        usedHeight = 0;
                        if (field && field.getHeight() !== null) {
                            field.parent.items.items.map(function (obj) {
                                if (obj !== field) {
                                    usedHeight += obj.element.getHeight();
                                }
                            })
                            var fieldHeight = parentHeight - usedHeight - 40; //20 for padding etc.                            
                            field.setHeight(fieldHeight);
                        }

                        console.log(parentHeight, usedHeight, availHeight, height, fieldHeight);
                        //Ext.Msg.alert('Detail.NarationField', parentHeight + ', ' + usedHeight + ', ' + availHeight + ', ' + height + ', ' + fieldHeight);

                    }

                    objNarationField = {
                        xtype: 'container',
                        styleHtmlContent: true,
                        docked: 'top',
                        html: strNarationHtml
                    };
                    if(strNarationHtml!==""){
                        objNarationField = this.insert(2, objNarationField);
                    }
                    
                    Ext.defer(onPainted, this, 100);

                }
            });
        }

        if (node.get('ReadOnlySQL')) {
            DataFunc.executeSQL({
                sql: DataFunc.PrepareQuery(node, node.get('ReadOnlySQL'), true),
                scope: this,
                success: function (tx, results) {
                    var fieldName, objResults, resItems = [], resArray;

                    if (results.rows.length === 1) {
                        fieldName = DataFunc.GetScalarValue(results);

                        if (typeof fieldName === "string") {
                            console.log("used for comments field", fieldName, node);

                            var oldValue = "";
                            if (node.get('commentsField')) {
                                oldValue = node.get('commentsField').value;
                            }

                            var tempObj = this.add({
                                docked: 'bottom',
                                items: [{
                                    html: "Comments",
                                }, {
                                    xtype: 'textareafield',
                                    cls: 'field-body',
                                    itemId: 'commentsField',
                                    data: { 'fieldName': fieldName },
                                    value: oldValue,
                                }, {
                                    xtype: 'button',
                                    func: 'Action',
                                    ui: 'action',
                                    text: 'Done',
                                    docked: 'bottom',
                                    margin: '0.5em 0 0 0'
                                }]
                            });
                            var tmpCommentsField = tempObj.query('#commentsField')[0];

                            this.setCommentsField(tmpCommentsField);

                        } else {
                            // used for setting the field as read only
                            this.getField().setDisabled(true);
                            console.log("this.getField().setDisabled(true);", fieldName, node);
                        }

                    }
                }
            });
        }

        if (node.get('LeadingCharacter')) {
            this.getField().parent.add({
                docked: 'left',
                cls: (node.get('IsReadOnly')) ? 'x-html' : '',
                html: node.get('LeadingCharacter')
            });
        }

        if (node.get('MaxInputLength') > 0 && this.getField().setMaxLength) {
            this.getField().setMaxLength(node.get('MaxInputLength'));
        }

        // hide the titlebar buttons if came in from cart
        this.hideTitlebarButtons(controller, node);

    },

    hideTitlebarButtons: function (controller, node) {
        var fromCart, i, btn, blnRemove;

        // seemed to remember the config so always start with initial tb config
        if (!this.getInitialTbConfig()) {
            this.setInitialTbConfig(this.tbConfig);
        }
        this.tbConfig = this.getInitialTbConfig();

        // check if coming from a cart node
        fromCart = false; //!!!node; //(this.OnAcceptActionOverride && this.OnAcceptActionOverride == CallFlowNode.AcceptActions.CART);

        // loop through each item
        i = 0;
        while (i < this.tbConfig.items.length) {

            btn = this.tbConfig.items[i];

            // check if should remove the button
            blnRemove = false;
            if (btn.source === 'default' && fromCart) {
                blnRemove = true;
            }
            if (btn.source === 'cart' && !fromCart) {
                blnRemove = true;
            }

            // check if need to be disabled
            btn.disabled = false;
            if (btn.text === 'Prev' && (this.getNodeIndex() === 0)) { btn.disabled = true; }


            //removed as used by some merchandisers as the "done" button on time nodes
            //if (btn.text === 'Next' && (this.getNodeIndex() === (controller.getCallFlow().getIndexStore().getCount() - 1))) {
            //    btn.disabled = true;
            //}

            // either remove the button or proceed to next
            if (blnRemove) {
                this.tbConfig.items.remove(i);
            } else {
                i++;
            }

        }

    },

    setDescriptionFontSize: function (descPanel) {
        var cmpDesc = Ext.getCmp(descPanel.getId()),
            sngFontSize = 1.05,
            objSize;

        do {

            sngFontSize -= 0.05;

            cmpDesc.setStyle('font-size:' + sngFontSize.toFixed(2) + 'em');

            objSize = DataFunc.measureString(descPanel.getHtml(), cmpDesc, descPanel.getWidth());

        } while (objSize.height > 66 && sngFontSize > 0.6);

    },

    showDescription: function () {
        Ext.Msg.alert(null, this.getHtml());
    }

});
