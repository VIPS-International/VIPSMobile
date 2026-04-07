//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.IntegerNodeKeyPad', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        items: [{
            xtype: 'container',
            itemId: 'field',
            height: '1.6em',
            cls: 'field-body x-html',
            items: [{
                xtype: 'button',
                docked: 'right',
                func: 'ClearAll',
                iconCls: 'delete_black1',
                iconMask: true,
                cls: 'reset',
                pressedCls: ''
            }]
        }, {
            layout: { type: 'vbox', pack: 'center', align: 'stretch' },
            itemId: 'NumberKeyboard',
            defaults: {
                layout: { type: 'hbox' },
                defaults: {
                    xtype: 'button',
                    func: 'Keyboard',
                    ui: 'light',
                    height: 43,
                    width: '33%'
                }
            },
            items: [{
                items: [{ text: 1 }, { text: 2 }, { text: 3 }]
            }, {
                items: [{ text: 4 }, { text: 5 }, { text: 6 }]
            }, {
                items: [{ text: 7 }, { text: 8 }, { text: 9 }]
            }, {
                items: [{ iconCls: 'backspace', iconMask: true, func: 'BackSpace', ui: 'decline' }, { text: '0' }, { text: 'Done', func: 'Action', ui: 'action' }]
            }]
        }]
    },

    statics: {

        getTypedValue: function (value) {

            if (value === null || value === "") {
                return null;
            }

            return parseInt(value, 10);

        },

        getFormattedValue: function (node) {
            if (node.get('Value') || node.get('Value') === 0 || node.get('Value') === "0") {
                return parseInt(node.get('Value'), 10).toString();
            }

            return "";
        }

    },

    getValue: function () {
        return this.getField().getHtml();
    },

    setValue: function (value) {

        if (Ext.isNumeric(value)) {
            value = parseInt(value, 10).toString();
        } else {
            value = "";
        }
        
        this.getField().setHtml(value.toString());

    }

});
