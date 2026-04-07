//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.messages.DetailItems', {
    extend: 'Ext.dataview.DataView',
    alias: 'widget.detailitems',

    requires: [
        'VIPSMobile.view.messages.items.DetailItem'
    ],

    config: {
        store: 'DetailItems',
        defaultType: 'detailitem',
        grouped: true,
        useComponents: true
    }

});
