//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.BarcodeNode', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {

        html: '<div class="answered font90" style="text-align:center">' + VIPSMobile.getString('Begin scanning to add items') + '</div>',

        layout: {
            type: 'vbox'
        },

        items: [{
            xtype: 'textfield',
            itemId: 'scanBox',
            placeHolder: 'Tap here to type barcode',
            height: '3em',
            docked: 'top'
        }, {
            xtyle: 'panel',
            itemId: 'scanVideo',
            html: '<video autoplay="true" id="videoElement" style="width: 480px;height: 320px"></video>',
            width: 300,
            height: 300,
            docked: 'top',
        }, {
            xtype: 'fieldset',
            scrollable: 'vertical',
            flex: 1,
            layout: {
                align: 'left',
                pack: 'top',
                type: 'vbox'
            },
            itemId: 'QtyFS'
        }, {
            xtype: 'fieldset',
            layout: {
                type: 'hbox'
            },
            items: [{
                xtype: 'togglefield',
                itemId: 'ShowAllToggle',
                label: VIPSMobile.getString('Show All') + '<br /><span class="small">' + VIPSMobile.getString('display more than 20 line items') + '</span>',
                value: false,
                flex: 1
            }, {
                itemId: 'TotalField',
                xtype: 'textfield',
                label: 'Total Quantity/Items',
                style: 'text-align: right',
                labelWidth: '60%',
                readOnly: true,
                flex: 1
            }]
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            margin: '0.5em 0 0 0',
            docked: 'bottom'
        }],

        barcode: '',
        allowAnyBarcode: false,
        barcodes: {},
        internalValue: {},
        barcodeOrder: []

    },

    statics: {

        getFormattedValue: function (node) {

            var value = node.get('Value');

            if (!Ext.isArray(value)) {
                value = [value];
            }

            return value.length.toString() + ' ' + VIPSMobile.getString('items');

        },

        convertListOption: function (option) {
            return {
                value: option.Field0,
                text: option.Field1,
                stock: option.Field2
            };
        }

    },

    setup: function (controller, node) {

        var me, i, option;

        // listen for key presses
        me = this;
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
            this.down("#scanBox").element.query('input')[0].dispatchEvent(clickevent);

            this.down("#ShowAllToggle").on('change', this.setValue, this);

        }, this, {
            single: true
        });


        //hide the scan box for read only, should still be able to change qty
        this.down("#scanBox").setHidden(node.get('IsReadOnly'));

        this.setBarcodes({});

        for (i = 0; i < node.get('Options').length; i += 1) {
            option = node.get('Options')[i];
            if(option.value !== null){
                this.getBarcodes()[option.value] = option;

                if (option.value === '*') {
                    this.setAllowAnyBarcode(true);
                }
            }
        }

        this.setInternalValue({});
        this.setBarcodeOrder([]);

        // call parent setup
        this.callParent(arguments);


        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    var video = document.getElementById("videoElement");

                    video.srcObject = stream;
                })
                .catch(function (err0r) {
                    console.log("Something went wrong!");
                });
        }
    },

    onKeyPress: function (e) {
        var barcode,
            me = this;

        e.stopPropagation();

        //this.down("#scanBox").setValue(this.getBarcode());

        // check if completing scan (tab or cr)
        if (e.keyCode === 11 || e.keyCode === 13) {

            setTimeout(function () {
                barcode = me.down("#scanBox").getValue();

                if (barcode) {
                    me.checkBarcode(barcode);
                    me.down("#scanBox").setValue('');
                    me.setTotal();
                }

            }, 250);

            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();

            return false;

        }

        if (this.down("#scanBox").element.query('input')[0] !== document.activeElement) {
            this.down("#scanBox").focus();
        }

    },

    // check if the scanned barcode is in the current options
    checkBarcode: function (barcode) {

        var option, field, intBarcode;

        // find the option
        option = this.findOption(barcode);
        if (Ext.isArray(option)) {

            Ext.iterate(option, function (item) {
                this.incrementOption(item, 0);
            }, this);

        } else if (option) {

            intBarcode = parseInt(option.value, 10);

            if (this.getBarcodeOrder().indexOf(intBarcode) !== -1) {
                this.getBarcodeOrder().splice(this.getBarcodeOrder().indexOf(intBarcode), 1);
            }

            this.getBarcodeOrder().unshift(intBarcode);

            // increment the count for the item
            this.incrementOption(option, 1);

            // to re-order the items;
            //this.getInternalValue().push(barcode);

            this.setValue();

        }

        // clear the current barcode
        field = this.down('#scanBox');
        field.setValue('');
        field.focus();

    },

    incrementOption: function (option, value) {

        var item, fs, newItem;

        // hide the place holder
        this.setHtml(null);

        fs = this.down('#QtyFS');


        if (!this.getInternalValue()[option.value]) {
            this.getInternalValue()[option.value] = option;
            this.getInternalValue()[option.value].qty = (option.PartialMatch) ? 0 : 1;
        } else {
            this.getInternalValue()[option.value].qty += value;
        }

        // get the list and the item in the list
        item = fs.down("spinnerfield[barcode='" + option.value + "']");

        // check if item found
        if (item) {

            // increment the count of the item
            item.setValue(this.getInternalValue()[option.value].qty);

        } else {

            // add the item to the list
            newItem = {
                xtype: 'spinnerfield',
                width: '100%', // seem to need this for iphone
                label: option.text,
                labelWrap: true,
                minValue: 0,
                stepValue: 1,
                value: this.getInternalValue()[option.value].qty
            };

            if (option.stock && option.stock > 0) {
                newItem.maxValue = option.stock;
            }

            if (option.PartialMatch) {
                item = fs.insert(0, newItem);
                delete option.PartialMatch;
            } else {
                item = fs.add(newItem);
            }
            item.element.down('input').setWidth('3em');

            item.barcode = option.value;
            item.on('change', this.setTotal, this);
        }


        this.getInternalValue()[option.value].qty = item.getValue();

    },

    // check if the given barcode is in the options
    findOption: function (barcode) {

        var i, option, partialOptions = [], key, intKey, partMatchCount = 0;

        key = barcode.toString();

        option = this.getBarcodes()[key] || this.getBarcodes()[key.substring(0, key.length - 1)];
        if (option) {
            return option;
        }

        for (i = 0; i < this.getNode().get('Options').length && partMatchCount < 20; i += 1) {

            option = this.getNode().get('Options')[i];

            // check if the barcode matches the item
            if (option.text && option.text.toLowerCase().indexOf(key.toLowerCase()) !== -1) {
                option.PartialMatch = true;
                partMatchCount += 1;
                partialOptions.push(option);
            }

        }

        if (this.getAllowAnyBarcode() && partialOptions.length === 0) {
            intKey = parseInt(key) || -this.getBarcodeOrder().length;

            this.getBarcodes()[intKey] = {
                text: key + ' - Product not on file',
                value: intKey
            };

            return this.getBarcodes()[intKey];

        } else {
            return partialOptions;
        }

    },

    // sort all the spinner fields
    sortItems: Ext.emptyFn,

    getValue: function () {

        var value, items, i;

        value = [];

        // get all the options in the list
        items = this.getInternalValue();
        Ext.iterate(items, function (key, item) {
            for (i = 0; i < item.qty; i += 1) {
                value.push(item.value);
            }
        });

        return value;

    },

    setValue: function (value) {

        var maxLoops, i, fs, option;

        if (!value) {
            value = [];
        }

        for (i = 0; i < value.length; i += 1) {
            if (!this.getInternalValue()[value[i]]) {
                option = this.findOption(value[i]);
                if (!Ext.isArray(option)) {

                    this.getInternalValue()[option.value] = option;
                    this.getInternalValue()[option.value].qty = 1;

                } else if (Ext.isArray(option)) {

                    // ignore partial matches here (bad data in field value); 
                    this.getBarcodes()[value[i]] = {
                        text: value[i] + ' - Product not on file',
                        value: value[i]
                    };

                    this.getInternalValue()[value[i]] = this.getBarcodes()[value[i]];
                    this.getInternalValue()[value[i]].qty = 1;

                }
            } else {
                this.getInternalValue()[value[i]].qty += 1;
            }
            var intBarcode = parseInt(value[i], 10);
            if (this.getBarcodeOrder().indexOf(intBarcode) === -1) {
                this.getBarcodeOrder().unshift(intBarcode);
            }

        }

        fs = this.down('#QtyFS');
        fs.removeAll();

        maxLoops = (this.getBarcodeOrder().length > 20 && this.down("#ShowAllToggle").getValue() === 0)
            ? 20
            : this.getBarcodeOrder().length;

        // add the values to the list
        Ext.iterate(this.getBarcodeOrder(), function (key) {
            if (maxLoops > 0) {
                var item = this.getInternalValue()[key];
                this.incrementOption(item, 0);
                maxLoops -= 1;
            }
        }, this);

        this.setTotal();

    },

    setTotal: function (e) {

        var totalField, items, totalItems = 0;

        if (e) {
            this.getInternalValue()[e.barcode].qty = e.getValue();

            var intBarcode = parseInt(e.barcode, 10);

            if (this.getBarcodeOrder().indexOf(intBarcode) === -1) {
                this.getBarcodeOrder().unshift(intBarcode);
            }
        }

        items = this.getInternalValue();
        Ext.iterate(items, function (key, item) {
            totalItems += item.qty;
        });

        totalField = this.down('#TotalField');
        totalField.setValue(totalItems + '/' + this.getBarcodeOrder().length);

    }

});
