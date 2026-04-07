//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.orders.Detail', {
    extend: 'VIPSMobile.view.data.Detail',
    alias: 'widget.OrdersDetail',

    requires: [
        'Ext.Img',
        'VIPSMobile.ux.field.UOM'
    ],

    config: {
        items: [{
            xtype: 'titlebar',
            title: 'Product',
            docked: 'top',
            defaults: {
                ui: 'action'
            },
            items: [{
                func: 'detailBack',
                text: 'Back',
                ui: 'back action'
            }, {
                func: 'cart',
                iconCls: 'shop1',
                iconMask: true,
                align: 'right',
                disabled: true
            }]
        }, {
            xtype: 'container',
            html: 'product name',
            itemId: 'prodname',
            cls: 'font110',
            docked: 'top'
        }, {
            xtype: 'fieldset',
            docked: 'top',
            itemId: 'scanBoxContainer',
            items: [{
                xtype: 'textfield',
                itemId: 'scanBox',
                placeHolder: 'Tap here to scan or search'
            }, {
                xtype: 'button',
                itemId: 'searchButton',
                //iconCls: 'search',
                //iconMask: true,
                text: VIPSMobile.getString('Go'),
                docked: 'right',
                align: 'right',
                ui: 'action',
                style: 'padding-top: 12px'
            }]
        }, {
            xtype: 'fieldset',
            itemId: 'proddetails',
            items: [{
                xtype: 'textfield',
                label: 'ProductID',
                name: 'ProductID',
                hidden: true
            }, {
                xtype: 'textfield',
                label: 'Name',
                name: 'Name',
                hidden: true
            }, {
                xtype: 'textfield',
                label: 'Description',
                name: 'Description',
                disabled: true
            }, {
                xtype: 'textfield',
                label: 'Size',
                name: 'Size',
                disabled: true
            }, {
                xtype: 'textfield',
                label: 'SKU',
                name: 'SKU',
                disabled: true
            }, {
                xtype: 'textfield',
                label: 'Stock',
                name: 'Stock',
                disabled: true
            }, {
                xtype: 'textfield',
                label: 'Barcode',
                name: 'Barcode',
                disabled: true
            }, {
                xtype: 'textfield',
                label: 'Is Tax Exempt',
                name: 'IsTaxExempt',
                disabled: true
            }]
        }, {
            xtype: 'fieldset',
            title: 'Quantity',
            itemId: 'QtyFS'            
        }],

        product: null,
        barcode: '',
        allowAnyBarcode: false,
        barcodes: {},
        internalValue: {},
        barcodeOrder: [],
        blnIsBarcodeNode: false,
        delayedTask: null,
        controller: null
    },

    setup: function (controller, node) {
        // call parent setup
        this.callParent(arguments);

        this.setController(controller);
    },

    setProductValues: function (nodeValue) {

        console.debug('setProductValues', nodeValue);

        this.setProduct(nodeValue);

        // set the detail field set's text
        this.down('#prodname').setHtml(nodeValue.Name);

        if (this.getNode().get("Options")) {
            this.prepForScanning();
        } else {
            // this product detail has no options so is not configured for scanning
            this.down('#scanBoxContainer').setHidden(true);
        }

        // add the unit's of measure
        this.addUnitsOfMeasure();

        // set the field values
        this.setValues(nodeValue);

        // hide unset optional fields
        this.hideFieldIfBlank(nodeValue, 'Description');
        this.hideFieldIfBlank(nodeValue, 'RRP');
        this.hideFieldIfBlank(nodeValue, 'Size');
        this.hideFieldIfBlank(nodeValue, 'SKU');
        this.hideFieldIfBlank(nodeValue, 'Stock');
        this.hideFieldIfBlank(nodeValue, 'Barcode');
        this.hideFieldIfBlank(nodeValue, 'IsTaxExempt');
        this.hideFSIfAllBlank(this.down('#proddetails'));

    },

    prepForScanning: function () {
        var scanBox = this.down("#scanBox")
            , node = this.getNode()
            , me = this
            , option
            , intBarcode;

        this.setBlnIsBarcodeNode(true);

        window.onkeypress = function (e) {
            me.onKeyPress(e);
        };

        this.on('erased', function () {
            window.onkeypress = null;
        }, this, {
            single: true
        });

        this.on('painted', function () {
            var clickevent;

            clickevent = new MouseEvent('click');
            clickevent.initEvent('touch', true, false);
            scanBox.element.query('input')[0].dispatchEvent(clickevent);

        }, this, {
            single: true
        });


        this.down("#searchButton").on('tap', function () {
            var e = {},
                empFn = function () { };

            e.keyCode = 11; // this is enter
            e.stopPropagation = empFn;
            e.preventDefault = empFn;
            e.stopImmediatePropagation = empFn;

            me.onKeyPress(e);
        });

        //hide the scan box for read only, should still be able to change qty
        scanBox.setHidden(node.get('IsReadOnly'));

        this.setBarcodes({});

        for (i = 0; i < node.get('Options').length; i += 1) {
            option = node.get('Options')[i];

            this.getBarcodes()[option.value] = option;

            if (option.value === '*') {
                this.setAllowAnyBarcode(true);
            }

        }

        this.setInternalValue({});
        this.setBarcodeOrder([]);

        Ext.iterate(this.getProduct().uom, function (uom) {
            var tmpBarcode = uom.Barcode || uom.Value;

            this.getInternalValue()[tmpBarcode] = this.findOption(tmpBarcode);
            intBarcode = parseInt(tmpBarcode, 10);
            this.getBarcodeOrder().unshift(intBarcode);
        }, this)

        Ext.iterate(this.getProduct().Quantity, function (key, qty) {

            this.getInternalValue()[qty.Barcode] = this.findOption(qty.Barcode);
            intBarcode = parseInt(qty.Barcode, 10);

            if (this.getBarcodeOrder().indexOf(intBarcode) === -1) {
                this.getBarcodeOrder().unshift(intBarcode);
            }

        }, this);

    },

    onKeyPress: function (e) {
        var barcode,
            me = this;

        e.stopPropagation();

        // check if completing scan (tab or cr)
        if (e.keyCode === 11 || e.keyCode === 13) {

            setTimeout(function () {
                barcode = me.down("#scanBox").getValue();

                if (barcode) {
                    me.checkBarcode(barcode);
                    me.down("#scanBox").setValue('');
                }

            }, 250);

            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();

            return false;

        }

        if (e.target.nodeName !== "INPUT" && this.down("#scanBox").element.query('input')[0] !== document.activeElement) {
            this.down("#scanBox").focus();
        }


    },

    // check if the scanned barcode is in the current options
    checkBarcode: function (barcode) {
        var option, field;

        this.setDelayedTask(Ext.create('Ext.util.DelayedTask', this.addUnitsOfMeasure, this));

        // find the option
        option = this.findOption(barcode);
        if (Ext.isArray(option)) {

            Ext.iterate(option, function (item) {
                this.addToBarcodeOrder(parseInt(item.value, 10));
                this.incrementOption(item, 0);
            }, this);

        } else if (option) {
            this.addToBarcodeOrder(parseInt(option.value, 10));

            // increment the count for the item
            this.incrementOption(option, 1);

            this.setValue();
        }

        // clear the current barcode
        field = this.down('#scanBox');
        field.setValue('');
        field.focus();

    },

    addToBarcodeOrder: function (intBarcode) {

        if (this.getBarcodeOrder().indexOf(intBarcode) !== -1) {
            this.getBarcodeOrder().splice(this.getBarcodeOrder().indexOf(intBarcode), 1);
        }

        this.getBarcodeOrder().unshift(intBarcode);

    },

    incrementOption: function (option, value) {
        var sql = this.getNode().get('CalculatedValueSQL'),
            Quantity = value,
            Option = option,
            internalValue = this.getInternalValue();


        if (sql) {
            if (internalValue[Option.value]) {
                // allready in the UOM list

                internalValue[Option.value].Quantity += Quantity;

                Ext.iterate(this.getProduct().uom, function (uom) {
                    if (uom.Value === internalValue[Option.value].Value) {
                        uom.Quantity += Quantity;
                    }
                });

                Ext.iterate(this.getProduct().Quantity, function (key, qty) {
                    if (qty.Value === internalValue[Option.value].Value) {
                        qty.Quantity += Quantity;
                    }
                });

                this.getDelayedTask().delay(100);

            } else {
                // convert the sql to an array
                if (sql.indexOf(';') > 0) {
                    sql = sql.split(';')[1];
                } else {
                    sql = sql;
                }

                // prepare all the queries
                sql = DataFunc.PrepareQuery(this.getNode(), sql, false, true);
                sql = sql.replace('[BARCODE]', Option.value);

                DataFunc.executeSQL({
                    sql: sql,
                    scope: this,
                    success: function (tx, results) {
                        if (results.rows.length > 0) {
                            var obj = results.rows.item(0);
                            obj.Quantity = Quantity;
                            if (this.getProduct().Quantity == null) {
                                this.getProduct().Quantity = {};
                            }
                            this.getProduct().Quantity[obj.Value] = obj;
                            internalValue[Option.value] = Option;
                            internalValue[Option.value].PartialMatch = !obj.Quantity;
                            internalValue[Option.value].Quantity = obj.Quantity;
                            internalValue[Option.value].ProductID = obj.ProductID;
                            internalValue[Option.value].Value = obj.Value;

                            this.getDelayedTask().delay(100);
                        }

                    }
                });

            }

        }

    },

    // check if the given barcode is in the options
    findOption: function (barcode) {
        var i, option, key, intKey,
            partialOptions = [],
            partMatchCount = 0;

        key = barcode.toString();

        option = this.getBarcodes()[key] || this.getBarcodes()[key.substring(0, key.length - 1)];
        if (option) {
            return option;
        }

        for (i = 0; i < this.getNode().get('Options').length && partMatchCount < 20; i += 1) {

            option = this.getNode().get('Options')[i];

            // check if the barcode matches the item
            if (option.text.toLowerCase().indexOf(key.toLowerCase()) !== -1) {
                option.PartialMatch = true;
                partMatchCount += 1;
                partialOptions.push(option);
            }

        }

        if (this.getAllowAnyBarcode() && partialOptions.length === 0) {
            intKey = parseInt(key, 10) || -this.getBarcodeOrder().length;

            this.getBarcodes()[intKey] = {
                text: key + ' - Product not on file',
                value: intKey
            };

            return this.getBarcodes()[intKey];

        } else {
            return partialOptions;
        }

    },

    addUnitsOfMeasure: function () {
        var FS, unitsOfMeasure, node, cmp,strLabel, strLabelWidth, loopFn, i, tmpVal, obj,
            qty = {}, 
            objs = {},
            cartProducts = {};

        node = this.getNode();
        strLabelWidth = node.get("Width") > 0 ? node.get("Width") + '%' : '30%';


        FS = this.down('#QtyFS');

        if (FS) {
            // remove current quantity object
            FS.removeAll();

            unitsOfMeasure = this.getProduct().Quantity;

            if (this.getController()) {
                var cf = VIPSMobile.CallFlows.get(this.getController().getCurrentCallFlowID()),
                    cartItems = cf.getCartStore().getRange();

                Ext.iterate(cartItems, function (item) {
                    cartProducts[item.get("Value")] = item.data;
                });

            }

            if (Ext.isArray(unitsOfMeasure)) {
                console.error("STOP HERE THIS IS BAD");
            }

            Ext.iterate(unitsOfMeasure, function (key, unitsOfMeasureItem) {

                console.debug("unitsOfMeasureItem", unitsOfMeasureItem);

                if (typeof (unitsOfMeasureItem.Quantity) === "string" && unitsOfMeasureItem.Quantity.indexOf("{") !== -1) {
                    var tempUOMKey = unitsOfMeasureItem.Quantity.replace("{", "").replace("}", "");
                    unitsOfMeasureItem.Quantity = (cartProducts[tempUOMKey] !== undefined) ? cartProducts[tempUOMKey].Quantity : 0;
                }
                loopFn = function (Key, Value) {
                    qty[unitsOfMeasureItem.Value][Key] = Value;
                };
                qty[unitsOfMeasureItem.Value] = {};
                qty[unitsOfMeasureItem.Value].Quantity = unitsOfMeasureItem.Quantity;
                Ext.iterate(unitsOfMeasureItem, loopFn);
                strLabel = unitsOfMeasureItem.Name;

                if (VIPSMobile.CallFlows.globals.getValue('ShopOptions') & 2048) {
                    strLabel += ' <span class="order-price">$' + unitsOfMeasureItem.Price.toFixed(2) + '</span>';
                }

                // look for the "UOM Value" in the cart
                if (cartProducts[unitsOfMeasureItem.Value]) {
                    tmpVal = {
                        quantity: cartProducts[unitsOfMeasureItem.Value].Quantity,
                        discount: cartProducts[unitsOfMeasureItem.Value].Discount,
                        overrideprice: cartProducts[unitsOfMeasureItem.Value].OverridePrice,
                        notes: cartProducts[unitsOfMeasureItem.Value].Notes
                    }
                    qty[unitsOfMeasureItem.Value] = {
                        ...qty[unitsOfMeasureItem.Value],
                        ...cartProducts[unitsOfMeasureItem.Value]
                    }
                    unitsOfMeasureItem = {
                        ...unitsOfMeasureItem,
                        ...cartProducts[unitsOfMeasureItem.Value]
                    }
                } else if (qty[unitsOfMeasureItem.Value]) {
                    tmpVal = {
                        quantity: qty[unitsOfMeasureItem.Value].Quantity,
                        discount: qty[unitsOfMeasureItem.Value].Discount,
                        overrideprice: qty[unitsOfMeasureItem.Value].OverridePrice,
                        notes: qty[unitsOfMeasureItem.Value].Notes
                    }
                } else {
                    tmpVal = {
                        quantity: unitsOfMeasureItem.Quantity,
                        discount: unitsOfMeasureItem.Discount,
                        overrideprice: unitsOfMeasureItem.OverridePrice,
                        notes: unitsOfMeasureItem.Notes
                    }
                }

                obj = {
                    xtype: 'uomfield',
                    label: strLabel,
                    width: '100%', // seem to need this for iphone
                    labelWidth: strLabelWidth,
                    labelWrap: true,
                    name: 'Quantity-' + unitsOfMeasureItem.Value,
                    value: tmpVal,
                    minValue: 0,
                    maxValue: (qty[unitsOfMeasureItem.Value]) ? qty[unitsOfMeasureItem.Value].Stock : unitsOfMeasureItem.Stock || 100,
                    stepValue: 1,
                    qtyLabel: unitsOfMeasureItem.qtyLabel || 'Qty.',
                    qtyFieldToStore: unitsOfMeasureItem.qtyFieldToStore || 'Quantity'
                };
                obj.uom = unitsOfMeasureItem;
                objs[obj.uom.Value] = obj;
            })

            if (this.getBarcodeOrder().length > 0) {
                for (i = 0; i < this.getBarcodeOrder().length; i++) {
                    var tmpInterUOM = this.getInternalValue()[this.getBarcodeOrder()[i]];
                    if (tmpInterUOM && tmpInterUOM.Value && objs[tmpInterUOM.Value]) {
                        cmp = FS.add(objs[tmpInterUOM.Value]);
                        cmp.uom = objs[tmpInterUOM.Value].uom;
                        if (cmp && this.getBlnIsBarcodeNode()) {
                            cmp.on('change', this.onChangeEvent, this);
                        }
                    }
                }
            } else {
                Ext.iterate(unitsOfMeasure, function (key, uom) {
                    cmp = FS.add(objs[uom.Value]);
                    cmp.uom = objs[uom.Value].uom;
                    if (cmp && this.getBlnIsBarcodeNode()) {
                        cmp.on('change', this.onChangeEvent, this);
                    }
                }, this);
            }


        }

    },

    onChangeEvent: function (control, newValue, oldValue) {

        this.getInternalValue()[control.uom.Barcode].Quantity = parseFloat(newValue, 10);

        Ext.iterate(this.getProduct().uom, function (uom) {
            if (uom.Value === this.getInternalValue()[control.uom.Barcode].Value) {
                uom.Quantity = parseFloat(newValue, 10);
            }
        }, this);
        Ext.iterate(this.getProduct().Quantity, function (key, qty) {
            if (qty.Value === this.getInternalValue()[control.uom.Barcode].Value) {
                qty.Quantity = parseFloat(newValue, 10);
            }
        }, this);

        //console.log(this.getInternalValue()[control.uom.Barcode]);

    },

    // check if the field is blank and if so, hide the component
    hideFieldIfBlank: function (product, fieldName) {
        var cmp;

        cmp = this.down('field[name=' + fieldName + ']');
        if (cmp) {
            cmp.setHidden(!product[fieldName]);
        }

    },

    hideFSIfAllBlank: function (FS) {
        var i, blnAllHidden;

        // check if all the fields are hidden
        blnAllHidden = true;
        for (i = 0; i < FS.items.length; i++) {
            if (!FS.items.getAt(i).getHidden()) {
                blnAllHidden = false;
            }
        }

        FS.setHidden(blnAllHidden);

    },

    // convert the various quantity display options to an object of { uom : count }
    getValues: function () {
        var values, qty, uom;

        values = this.callParent(arguments);

        // clear the total quantity
        values.TotalUnits = 0;
        values.TotalQuantity = 0;
        values.TotalPrice = 0;
        qty = {};

        // get the quantity display method from the store options
        Ext.iterate(values, function (key, value) {

            // check if the key is for a quantity
            if (key.indexOf('Quantity') === 0) {

                uom = Ext.clone(this.down('field[name=' + key + ']').uom);
                uom.Quantity = value.quantity || 0;
                uom.Discount = (uom.Discount !== undefined && uom.Discount !== null) ? value.discount : undefined;
                uom.OverridePrice = (uom.OverridePrice !== undefined && uom.OverridePrice !== null) ? value.overrideprice : undefined;
                uom.Notes = (uom.Notes !== undefined && uom.Notes !== null) ? value.notes : undefined;
                uom.GroupName = this.getProduct().Name;

                var calculatedPrice;
                if (uom.OverridePrice !== undefined && uom.OverridePrice !== null) {
                    calculatedPrice = uom.OverridePrice
                } else {
                    calculatedPrice = uom.Price;
                }
                uom.TotalPrice = value.quantity * calculatedPrice;

                // get the UoM
                if (this.getInternalValue()[uom.Value]) {
                    // barcode only section
                    // if this was a barcode scan and the quantity is still 0 then discard it.
                    var tmpInterUOM = this.getInternalValue()[uom.Value];
                    if (!tmpInterUOM.PartialMatch || (tmpInterUOM.PartialMatch && tmpInterUOM.Quantity > 0)) {
                        qty[uom.Value] = uom;
                    }

                } else {
                    qty[uom.Value] = uom;
                }

                if (value.quantity > 0) {
                    values.TotalUnits += 1;
                }

                values.TotalQuantity += value.quantity;
                values.TotalPrice += uom.TotalPrice;

                // remove the key
                delete values[key];

            }

        }, this);

        // set the quantity object in values
        values.Quantity = qty;
        //console.log("getValues", values);

        return values;

    },

    setQuantities: function (values) {
        var qty;

        // get the quantities object
        qty = values.Quantity;

        // convert the quantities into form values
        values = {};
        Ext.iterate(qty, function (uom, value) {
            values['Quantity-' + uom] = value.Quantity;
        }, this);

        // set the quantity field values
        this.setValues(values);

    },

    UpdateTotals: function () {
        var html;

        html = '<div class="width100" style="display:table">';
        html += '<span style="display:table-row">';
        html += '<span style="display:table-cell">Products: ' + this.getCartStore().getActiveCount() + '</span>';
        html += '<span style="display:table-cell">Items: ' + this.getCartStore().sum('Quantity') + '</span>';
        if (this.getShopOptionsInt() & 2048) {
            html += '<span style="display:table-cell; text-align:right">$' + this.getCartStore().sum('TotalPrice').toFixed(2) + '</span>';
        }
        html += '</span>';
        html += '</div>';

        // update the totals value on cart
        this.down('#carttotals').setHtml(html);

        // enable or disable the place order button
        this.down('button[func=placeOrder]').setDisabled(this.getCartStore().getCount() === 0);

    }

});
