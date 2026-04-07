//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.DynamicNode', {
    extend: 'VIPSMobile.view.data.Detail',

    statics: {

        getFormattedValue: Ext.emptyFn

    },

    setup: function (controller, node) {

        if (!node.options) {
            this.setHtml(node.get('ListNotFoundText'));
            this.setHeight(50);
        }

        // call parent setup
        this.callParent(arguments);
    },

    getValue: Ext.emptyFn,

    setValue: Ext.emptyFn

});
