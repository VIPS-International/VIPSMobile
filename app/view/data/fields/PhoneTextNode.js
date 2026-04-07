//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.PhoneTextNode', {
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
                itemId: "field",
                flex: 20
            }, {
                xtype: "button",
                func: "SendPhone",
                itemId: "btnSendPhone",
                iconCls: "phone",
                iconMask: true,
                flex: 1,
                cls: "reset",
                pressedCls: "",
                value: "tel:"
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
                items: [{ iconCls: 'backspace', iconMask: true, func: 'BackSpace', ui: 'decline' },
                { text: '0' },
                { text: 'Done', func: 'Action', ui: 'action' }]
            }]
        }]
    },

    statics: {

        getFormattedValue: function (node) {

            if (!node.get('Value')) { node.set('Value', ''); }

            return node.get('Value').toString();
        }

    },

    getValue: function () {
        return this.getField().getValue();
    },

    setValue: function (value) {

        if (!value) { value = ''; }

        this.getField().setValue(value);
    }

});
