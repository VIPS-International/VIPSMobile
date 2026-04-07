//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.settings.DBTables', {
    extend: 'Ext.dataview.List',

    tbConfig: {
        title: VIPSMobile.getString('Admin Tables'),
        items: [{
            text: VIPSMobile.getString('Back'),
            ui: 'back action',
            func: 'Back'
        }]
    },

    fsButton: {
        iconCls: 'left2',
        func: 'Back'
    },

    config: {
        itemId: 'DBTables',
        itemTpl: '<span>{tableName}</span><span class="DBTableValue">Count: {count}<br />{lastSync}</span>',
        store: 'DBTableItems',
        loadingText: '',
        panel: 'full'
    }

});
