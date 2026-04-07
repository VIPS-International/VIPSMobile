//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.TimeNodePicker', {
    extend: 'VIPSMobile.view.data.Detail',

    requires: ['VIPSMobile.ux.picker.Field'],

    config: {
        items: [{
            xtype: 'fieldpicker',
            itemId: 'field',
            cls: 'form-picker',
            slots: [{
                name: 'hour',
                title: 'Hour',
                data: [{ text: '1', value: 1 }, { text: '2', value: 2 }, { text: '3', value: 3 }, { text: '4', value: 4 }, { text: '5', value: 5 }, { text: '6', value: 6 }, { text: '7', value: 7 }, { text: '8', value: 8 }, { text: '9', value: 9 }, { text: '10', value: 10 }, { text: '11', value: 11 }, { text: '12', value: 12 }]
            }, {
                name: 'minute',
                title: 'Minute',
                data: [{ text: '00', value: 0 }, { text: '01', value: 1 }, { text: '02', value: 2 }, { text: '03', value: 3 }, { text: '04', value: 4 }, { text: '05', value: 5 }, { text: '06', value: 6 }, { text: '07', value: 7 }, { text: '08', value: 8 }, { text: '09', value: 9 }, { text: '10', value: 10 }, { text: '11', value: 11 }, { text: '12', value: 12 }, { text: '13', value: 13 }, { text: '14', value: 14 }, { text: '15', value: 15 }, { text: '16', value: 16 }, { text: '17', value: 17 }, { text: '18', value: 18 }, { text: '19', value: 19 }, { text: '20', value: 20 }, { text: '21', value: 21 }, { text: '22', value: 22 }, { text: '23', value: 23 }, { text: '24', value: 24 }, { text: '25', value: 25 }, { text: '26', value: 26 }, { text: '27', value: 27 }, { text: '28', value: 28 }, { text: '29', value: 29 }, { text: '30', value: 30 }, { text: '31', value: 31 }, { text: '32', value: 32 }, { text: '33', value: 33 }, { text: '34', value: 34 }, { text: '35', value: 35 }, { text: '36', value: 36 }, { text: '37', value: 37 }, { text: '38', value: 38 }, { text: '39', value: 39 }, { text: '40', value: 40 }, { text: '41', value: 41 }, { text: '42', value: 42 }, { text: '43', value: 43 }, { text: '44', value: 44 }, { text: '45', value: 45 }, { text: '46', value: 46 }, { text: '47', value: 47 }, { text: '48', value: 48 }, { text: '49', value: 49 }, { text: '50', value: 50 }, { text: '51', value: 51 }, { text: '52', value: 52 }, { text: '53', value: 53 }, { text: '54', value: 54 }, { text: '55', value: 55 }, { text: '56', value: 56 }, { text: '57', value: 57 }, { text: '58', value: 58 }, { text: '59', value: 59 }]
            }, {
                name: 'meridian',
                title: 'Meridian',
                data: [{ text: 'AM', value: 'am' }, { text: 'PM', value: 'pm' }]
            }]
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            docked: 'bottom',
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

        if (value.hour === 12) {
            if (value.meridian === 'am') {
                value.hour -= 12;
            }
        } else if (value.meridian === 'pm') {
            value.hour += 12;
        }

        // check if the time has changed to set seconds to 1
        intSec = (value.hour !== this.initialValue.hour || value.minute !== this.initialValue.minute) ? 1 : 0;

        value = new Date(2000, 0, 1, value.hour, value.minute, intSec);

        return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);

    },

    setValue: function (value) {

        value = VIPSMobile.view.data.fields.TimeNode.ConvertValueToTime(value);

        value = { hour: value.getHours(), minute: value.getMinutes() };
        value.meridian = (value.hour >= 12) ? 'pm' : 'am';

        this.initialValue = {
            hour: value.hour,
            minute: value.minute
        };

        if (value.hour > 12) {
            value.hour -= 12;
        }
        if (value.hour === 0) {
            value.hour = 12;
        }

        this.getField().setValue(value);

    }

});
