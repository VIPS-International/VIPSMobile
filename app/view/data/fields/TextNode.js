//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.TextNode', {
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
                flex: 20,
                listeners: {
                    painted: function (scope, e, a) {
                        scope.query("input")[0].focus();
                    }
                }
            }]
        },  {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            margin: '0.5em 0 0 0'
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
        var container = this.down("#fieldset");

        if (!value) { value = ''; }

        var regEmail = new RegExp("^[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,}$"),
            regPhone = /\(?([0-9]{2})\)?([ .-]?)([0-9]{4})\2([0-9]{4})/,
            blnEmail = regEmail.test(value.toUpperCase()),
            blnPhone = regPhone.test(value.toUpperCase());

        if (blnEmail || blnPhone) {
            container.add({
                xtype: "button",
                func: "SendEmail",
                itemId: "btnSendEmail",
                iconCls: (blnEmail) ? "Memo-png" : "phone",
                iconMask: true,
                flex: 1,
                cls: "reset",
                pressedCls: "",
                value: ((blnEmail) ? "mailto:" : "tel:") + value
            });
        }        

        this.getField().setValue(value);
    }

});
