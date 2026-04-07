//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.settings.ConsoleLog', {
    extend: 'Ext.dataview.List',

    tbConfig: {
        title: VIPSMobile.getString('Console Log'),
        items: [{
            text: VIPSMobile.getString('Back'),
            ui: 'back action',
            func: 'Back'
        }, {
            align: 'right',
            func: 'SubmitLog',
            text: VIPSMobile.getString('Submit'),
            ui: 'action',
            hidden: true
        }, {
            align: 'right',
            func: 'Filter',
            ui: 'action',
            iconCls: 'arrow_down',
            iconMask: true
        }]
    },

    fsButton: {
        iconCls: 'left2',
        func: 'Back'
    },

    config: {
        itemId: 'SettingsConsole',
        store: 'ConsoleLogItems',
        loadingText: '',
        selectedCls: '',
        grouped: true,
        emptyText: 'none',
        deferEmptyTexT: false,
        panel: 'full',
        itemTpl: '<div class="font80 {method}">{arguments}</div>'
    }

});
