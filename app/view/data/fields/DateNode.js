//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.DateNode', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        items: [{
            xtype: "container",
            itemId: "fieldset",
            layout: {
                type: "hbox",
                align: "stretch",
                pack: "start"
            }, items: [{
                xtype: "textfield",
                cls: "field-body",
                itemId: "field"
                , flex: 20,
                listeners: {
                    painted: function (scope, e, a) {
                        scope.query("input")[0].focus();
                    }
                }
            }]
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            margin: '0.5em 0 0 0'
        }]
    },

    statics: {

        getTypedValue: function (value) {
            value = VIPSMobile.view.data.fields.DateNode.ConvertValueToDate(value);
            return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);
        },

        getFormattedValue: function (node) {
            var value = VIPSMobile.view.data.fields.DateNode.ConvertValueToDate(node.get('Value'));
            return Ext.Date.format(value, Ext.Date.patterns.LongDate);
        },

        ConvertValueToDate: function (value) {

            if (typeof value === "object" && Ext.isArray(value)) {
                value = value[0];
            }

            try {
                if (typeof value === "string") {
                    if (Ext.isNumeric(value)) {
                        value = parseInt(value, 10);
                    } else {
                        //switch (value.toUpperCase()) {
                        //    default:
                        value = new Date();
                        // zero out the time we dont need it
                        value = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0);
                        //break;
                        //}
                    }
                }
                if (typeof value === "number") {
                    value = Ext.Date.parseDate(value, DataFunc.DATE_FORMAT);
                }
            } catch (ex) {
                value = null;
            }

            // Dates are "object" so make sure its a slot object 
            // by looking for year
            if (!value) {
                value = new Date();
            } else if (typeof value === "object" && value.year) {
                value = new Date(value.year, value.month - 1, value.day);
            }

            return value;

        },

        convertListOption: function (option) {
            return {
                value: parseInt(option.Field0, 10),
                text: option.Field1.toString()
            };
        }

    },

    initialize: function () {
        this.callParent(arguments);
        this.getField().setInputType('date');
    },

    setup: function (controller, node) {
        // call parent setup
        this.callParent(arguments);

        var value = node.get("Value");
        this.setValue(value);
    },

    getValue: function () {
        var value;

        // convert picker object value to date
        value = this.getField().getValue();
        if (value === "") {
            return null;
        }
        value = Ext.Date.parseDate(value, 'Y-m-d');

        return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);

    },

    setValue: function (value) {
        var intDate;


        // convert date to picker object value
        value = VIPSMobile.view.data.fields.DateNode.ConvertValueToDate(value);
        intDate = DataFunc.getdate(value)

        this.getField().setValue(value.getFullYear() + '-' + DataFunc.lpad((value.getMonth() + 1), 2) + '-' + DataFunc.lpad(value.getDate(), 2));

    }

});
