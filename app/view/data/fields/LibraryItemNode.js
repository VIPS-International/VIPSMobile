//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.LibraryItemNode', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        items: [{
            xtype: 'container',
            itemId: 'field',
            styleHtmlContent: true,
            cls: 'label-body',
            listeners: {
                element: 'element',
                tap: function () {
                    var libraryController = VIPSMobile.Main.getApplication().getController('Library');
                    libraryController.DoClickEvent(this.getParent().getNode().get("Value"), true);
                }
            }
        }, {
            xtype: 'button',
            text: 'Ok',
            ui: 'action',
            // style: 'margin: 1em 0',
            func: 'Action',
            margin: '0.5em 0 0 0'
        }]
    },

    statics: {

        getFormattedValue: function (node) {
            return ''; //node.get('Value').length.toString() + ' ' + VIPSMobile.getString('items');
        }

    },

    getValue: function () {
        return this.getNode().get("Value")
    },

    setValue: function (value) {
        if ((!value && value !== 0) || value === '') {
            value = '';
            this.getField().setHidden(true);
        }

        this.getField().setHtml(this.getNode().get("Description"));

    }
});
