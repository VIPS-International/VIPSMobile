//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.LabelNode', {
    extend: 'VIPSMobile.view.data.Detail',
    alias: ['VIPSMobile.view.data.fields.LableNode'],

    config: {
        scrollable: 'both',
        padding: '.6em',            
        items: [{
            xtype: 'container',
            itemId: 'field',
            styleHtmlContent: true,
            cls: 'label-body font120'
        }, {
            xtype: 'button',
            text: 'Ok',
            ui: 'action',
            docked: 'bottom',
            func: 'Action'
        }]
    },

    statics: {

        getFormattedValue: function (node) {
            var tmpStringVal = node.get('Value')
            if (!tmpStringVal) {
                tmpStringVal = '';
            }
            return tmpStringVal.toString();
        }

    },

    getValue: function () {
        return this.getField().getHtml();
    },

    setValue: function (value) {
        if ((!value && value !== 0) || value === '') {
            value = '';
            this.getField().setHidden(true);
        }

        this.getField().setHtml(value.toString());

    }

});
