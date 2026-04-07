//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.EmailTextNode', {
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
                , flex: 20
            }, {
                xtype: "button",
                func: "SendEmail",
                itemId: "btnSendEmail",
                iconCls: "Memo-png",
                iconMask: true,
                flex: 1,
                cls: "reset",
                pressedCls: "",
                value: "mailto:"
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
