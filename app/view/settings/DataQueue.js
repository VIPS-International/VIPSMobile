//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.settings.DataQueue', {
    extend: 'Ext.dataview.List',

    tbConfig: {
        title: VIPSMobile.getString('Data Queue'),
        items: [{
            text: VIPSMobile.getString('Back'),
            ui: 'back action',
            func: 'Back'
        }, {
            align: 'right',
            text: VIPSMobile.getString('Send'),
            ui: 'action',
            func: 'SendQueue'
        }, {
            align: 'right',
            text: VIPSMobile.getString('Clear'),
            ui: 'action',
            func: 'ClearQueue'
        }]
    },

    fsButton: {
        iconCls: 'left2',
        func: 'Back'
    },

    config: {
        itemId: 'SettingsQueue',
        itemTpl: '<span class="font80">{text}</span>',
        store: 'DataQueueItems',
        loadingText: '',
        selectedCls: '',
        grouped: true,
        panel: 'full',
        func: 'RemoveFromQueue'
    }

});
