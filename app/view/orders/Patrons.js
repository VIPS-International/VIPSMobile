//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.orders.Patrons', {
    extend: 'Ext.dataview.List',

    config: {

        store: 'BrowsePatrons',
        itemTpl: '{Name}',
        items: [{
            xtype: 'titlebar',
            title: 'Patrons',
            docked: 'top',
            defaults: {
                ui: 'action'
            },
            items: [{
                func: 'patronsBack',
                text: 'Back',
                ui: 'back action'
            }, {
                func: 'newPatron',
                text: 'New',
                ui: 'action',
                align: 'right'
            }]
        }]

    }

});
