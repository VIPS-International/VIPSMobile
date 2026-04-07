//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.TimeNode', {
    extend: 'VIPSMobile.view.data.Detail',

    requires: ['VIPSMobile.ux.picker.Field'],

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

    initialValue: null,

    statics: {

        getTypedValue: function (value) {
            value = VIPSMobile.view.data.fields.TimeNode.ConvertValueToTime(value);
            value = new Date(2000, 0, 1, value.getHours(), value.getMinutes(), value.getSeconds());
            return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);
        },

        getFormattedValue: function (node) {
            var value = VIPSMobile.view.data.fields.TimeNode.ConvertValueToTime(node.get('Value'));
            return Ext.Date.format(value, Ext.Date.patterns.ShortTime);
        },

        ConvertValueToTime: function (value) {

            if (Ext.isArray(value)) {
                value = value[0];
            }

            if (typeof value === "string") {
                if (Ext.isNumeric(value)) {
                    value = parseInt(value, 10);
                } else {

                    //switch (value.toUpperCase()) {
                    //    default:
                    // use now but knock off the seconds to not set false change flag
                    value = new Date();
                    value = new Date(2000, 0, 1, value.getHours(), value.getMinutes(), 0);
                    //        break;
                    //}

                }
            }

            if (typeof value === "number") {

                if (value > 2400) {
                    value = Ext.Date.parseDate(value, DataFunc.DATE_FORMAT);
                }
                else {
                    value = new Date(2000, 0, 1, parseInt(value / 100, 10), value % 100);
                }

            }

            if (!value) {
                value = new Date();
            }

            return value;

        }

    },

    initialize: function (node) {
        this.callParent(arguments);
        this.getField().setInputType('time');
    },

    setup: function (controller, node) {
        // call parent setup
        this.callParent(arguments);        
    },

    padMinute: function (min) {
        min = min.toString();
        if (min.length < 2) {
            min = '0' + min;
        }
        return min;
    },

    getValue: function () {
        var value, intSec;

        value = this.getField().getValue();


        value = Ext.Date.parseDate(value, 'H:i');
        // check if the time has changed to set seconds to 1
        intSec = (value.getHours() !== this.initialValue.getHours() || value.getMinutes() !== this.initialValue.getMinutes()) ? 1 : 0;

        value = new Date(2000, 0, 1, value.getHours(), value.getMinutes(), intSec);

        return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);

    },

    setValue: function (value) {


        value = VIPSMobile.view.data.fields.TimeNode.ConvertValueToTime(value);

        this.initialValue = value;

        this.getField().setValue(this.padMinute(value.getHours(), 2) + ':' + this.padMinute(value.getMinutes()));

    }

});
