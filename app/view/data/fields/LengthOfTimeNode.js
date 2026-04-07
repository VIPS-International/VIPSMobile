//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.LengthOfTimeNode', {
    extend: 'VIPSMobile.view.data.Detail',

    requires: ['VIPSMobile.ux.picker.Field'],

    config: {
        scrolling: false,
        items: [{
            xtype: 'container',
            layout: 'hbox',
            defaults: { xtype: 'label', flex: 1 },
            items: [{ html: 'Hours' }, { html: 'Mins' }]
        }, {
            xtype: 'container',
            layout: 'hbox',
            items: [{
                xtype: 'selectfield',
                itemId: 'hour',
                cls: 'form-picker',
                flex: 1,
                useTitles: true,
                options: [{ text: '0', value: 0 }, { text: '1', value: 1 }, { text: '2', value: 2 }, { text: '3', value: 3 }, { text: '4', value: 4 }, { text: '5', value: 5 }, { text: '6', value: 6 }, { text: '7', value: 7 }, { text: '8', value: 8 }, { text: '9', value: 9 }, { text: '10', value: 10 }, { text: '11', value: 11 }, { text: '12', value: 12 }, { text: '13', value: 13 }, { text: '14', value: 14 }, { text: '15', value: 15 }, { text: '16', value: 16 }, { text: '17', value: 17 }, { text: '18', value: 18 }, { text: '19', value: 19 }, { text: '20', value: 20 }, { text: '21', value: 21 }, { text: '22', value: 22 }, { text: '23', value: 23 }]
            }, {
                xtype: 'selectfield',
                itemId: 'min',
                flex: 1,
                cls: 'form-picker',
                useTitles: true,
                options: [{ text: '00', value: 0 }, { text: '01', value: 1 }, { text: '02', value: 2 }, { text: '03', value: 3 }, { text: '04', value: 4 }, { text: '05', value: 5 }, { text: '06', value: 6 }, { text: '07', value: 7 }, { text: '08', value: 8 }, { text: '09', value: 9 }, { text: '10', value: 10 }, { text: '11', value: 11 }, { text: '12', value: 12 }, { text: '13', value: 13 }, { text: '14', value: 14 }, { text: '15', value: 15 }, { text: '16', value: 16 }, { text: '17', value: 17 }, { text: '18', value: 18 }, { text: '19', value: 19 }, { text: '20', value: 20 }, { text: '21', value: 21 }, { text: '22', value: 22 }, { text: '23', value: 23 }, { text: '24', value: 24 }, { text: '25', value: 25 }, { text: '26', value: 26 }, { text: '27', value: 27 }, { text: '28', value: 28 }, { text: '29', value: 29 }, { text: '30', value: 30 }, { text: '31', value: 31 }, { text: '32', value: 32 }, { text: '33', value: 33 }, { text: '34', value: 34 }, { text: '35', value: 35 }, { text: '36', value: 36 }, { text: '37', value: 37 }, { text: '38', value: 38 }, { text: '39', value: 39 }, { text: '40', value: 40 }, { text: '41', value: 41 }, { text: '42', value: 42 }, { text: '43', value: 43 }, { text: '44', value: 44 }, { text: '45', value: 45 }, { text: '46', value: 46 }, { text: '47', value: 47 }, { text: '48', value: 48 }, { text: '49', value: 49 }, { text: '50', value: 50 }, { text: '51', value: 51 }, { text: '52', value: 52 }, { text: '53', value: 53 }, { text: '54', value: 54 }, { text: '55', value: 55 }, { text: '56', value: 56 }, { text: '57', value: 57 }, { text: '58', value: 58 }, { text: '59', value: 59 }]
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

        getFormattedValue: function (node) {
            var value = parseInt(node.get('Value'), 10);
            return parseInt(value / 60) + " hr  " + (value % 60) + " min";
        }

    },

    setup: function (controller, node) {
        // call parent setup
        this.callParent(arguments);

        var value = node.get("Value");

        this.setValue(value);

        if (node.get("NarationSQL") === "") {
            controller.getDetail().setHeight('25em');
            controller.getDetail().setScrollable(false);
        }

    },

    getValue: function () {
        var value;

        value = {
            minute: this.down("#min").getValue(),
            hour: this.down("#hour").getValue(),
        }
        value = (value.hour * 60) + value.minute;

        return parseInt(value, 10);

    },

    setValue: function (value) {

        value = { hour: parseInt(value / 60), minute: (value % 60) };

        this.down("#min").setValue(value.minute);
        this.down("#hour").setValue(value.hour);

    }

});
