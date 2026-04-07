//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.group.MailGroup', {
    extend: 'Ext.dataview.List',

    tbConfig: {
        title: VIPSMobile.getString('Groups'),
        items: [{
            func: 'Back',
            ui: 'back action',
            text: VIPSMobile.getString('Back')
        }]
    },

    config: {
        itemId: 'mailgroup',
        selectedItemCls: '',
        store: 'MailGroup',
        panel: 'right',
        cls: 'rightpanel',

        emptyText: '<br />' + VIPSMobile.getString('No members'),
        deferEmptyText: false,

        itemTpl: '<strong>{FirstName} {LastName}</strong> - {ListMember}'
    }

});

