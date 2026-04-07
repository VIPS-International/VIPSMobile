//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.orders.Shops', {
    extend: 'Ext.dataview.List',

    config: {

        store: 'Shops',
        selectedCls: '',
        panel: 'full',

        items: [{
            xtype: 'titlebar',
            title: 'Orders',
            docked: 'top',
            defaults: {
                ui: 'action'
            },
            items: [{ func: 'Refresh', iconCls: 'refresh', iconMask: true }]
        }],

        itemTpl: new Ext.XTemplate(
           '<tpl for".">',
               '<div>',
                   '{Name}',
                   '<tpl if="Draft">',
                       '<span class="draft blue">[ draft ]</span>',
                   '</tpl>',
               '</div>',
           '</tpl>'
       )

    }

});
