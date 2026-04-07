//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.ProductDetail', {
    //extend: 'VIPSMobile.view.data.Detail',
    extend: 'VIPSMobile.view.orders.Detail',

    tbConfig: {
        title: 'Data',
        items: [{
            text: VIPSMobile.getString('Cancel'),
            ui: 'action back',
            func: 'Index'
        }, {
            text: VIPSMobile.getString('Done'),
            ui: 'action',
            align: 'right',
            func: 'Action',
            addFn: function (controller) {
                // shouldn't show this if coming from cart
                return true;
            },
            disabledFn: function (controller, view) {
                return view.getNodeIndex() === 0;
            }
        }, {
            xtype: 'button',
            itemId: 'closeCf',
            align: 'right',
            text: 'X'
        }]
    },

    config: {
        itemId: 'datadetail',
        margin: '0.5em',
        scrollable: 'vertical',
        node: null
    },

    statics: {

        getFormattedValue: function (node) {
            var nodeValue, strReturn,
                strDisplayUOM = "",
                intTotalProducts = 0,
                intTotalQuantity = 0;

            nodeValue = node.get('Value');

            replaceables = {
                "strDisplayUOM": strDisplayUOM,
                "intTotalProducts": intTotalProducts,
                "intTotalQuantity": intTotalQuantity
            };

            Ext.iterate(nodeValue.Quantity, function (uom, value) {
                if (value.Quantity > 0) {
                    intTotalProducts += 1;
                    intTotalQuantity += value.Quantity;
                    strDisplayUOM += value.Name + ': ' + value.Quantity + "<br/>"
                }
            });

            if (nodeValue.Quantity && nodeValue.Quantity.FormattedValue) {
                strReturn = nodeValue.Quantity.FormattedValue;
                Ext.iterate(replaceables, function (key, value) {
                    strReturn = strReturn.replace("{{" + key + "}}", value);
                });
            } else {
                strReturn = "Products in Cart: " + intTotalProducts + '<br/> Qty: ' + intTotalQuantity;
            }

            //if (node.product && node.product.FormattedValue) {
            //    strReturn = node.product.FormattedValue;
            //    Ext.iterate(replaceables, function (key, value) {
            //        strReturn = strReturn.replace("{{" + key + "}}", value);
            //    });
            //} else {
            //    strReturn = "Products in Cart: " + intTotalProducts + '<br/> Qty: ' + intTotalQuantity;
            //}

            return strReturn;

        },

        getValidateNode: function (node, vCallback, scope) {
            var value, strSQL
                , intTotalProducts = 0
                , intTotalQuantity = 0;

            value = node.get("Value");
            //console.log("getValidateNode", value);
            if (value) {

                Ext.iterate(value.Quantity, function (uom, value) {
                    if (value.Quantity > 0) {
                        intTotalProducts += 1;
                        intTotalQuantity += value.Quantity;
                    }
                });

                strSQL = DataFunc.PrepareQuery(node, node.get('ValidationSQL'));

                replaceables = {
                    "intTotalProducts": intTotalProducts,
                    "intTotalQuantity": intTotalQuantity
                };

                Ext.iterate(replaceables, function (key, value) {
                    strSQL = strSQL.replace("[" + key + "]", value);
                });

                DataFunc.executeSQL({
                    sql: strSQL,
                    scope: scope || this,
                    success: function (tx, results) {

                        // turn into scalar query
                        item = results.rows.length > 0 ? results.rows.item(0) : {};

                        if (item.Field0) {

                            node.set({
                                ValidationType: (item.Field1) ? 'warning' : 'error',
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
                        console.error('ProductDetail.getValidateNode(' + node.get('CallFlowID') + ') error', strSQL);

                        if (vCallback) { vCallback.apply(scope || this); }

                    }
                });

            } else {
                if (vCallback) { vCallback.apply(scope || this); }
            }
        }

    },

    setup: function (controller, node) {
        // call parent setup
        this.callParent(arguments);

        console.debug("ProductDetail setup()", controller, node);

        var product;

        CFN = node;

        product = node.get('Value');

        // hide the title bar from the orders view
        this.down('titlebar').destroy();

        this.setNode(node);

        // set up the view for the product
        this.setProductValues(product);

        // add the ok button
        this.add({
            xtype: 'button',
            text: VIPSMobile.getString('Done'),
            ui: 'action',
            style: 'margin: 1em 0',
            func: 'Action'
        });

    },

    getValue: function () {
        return this.getValues();
    },

    setValue: function (value) {
        var cf, inCart;

        if (value) {

            // look for the item in the cart store include in value
            if (!value.Quantity) {
                cf = VIPSMobile.CallFlows.get(VIPSMobile.CallFlows._currentBySection.Data);
                inCart = cf.getCartStore().getById(value.ProductID);
                if (inCart) {
                    value.Quantity = inCart.data.Quantity;
                }
            }

            this.setQuantities(value);

        }
    }

});
