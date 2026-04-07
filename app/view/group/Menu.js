//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.group.Menu', {
    extend: 'Ext.dataview.List',

    tbConfig: {
        title: 'Groups',
        items: [{
            iconCls: 'refresh',
            itemId: 'groupsrefresh',
            func: 'Refresh',
            iconMask: true
        }]
    },

    config: {
        itemId: 'groupsMenu',
        iconCls: 'group',
        title: VIPSMobile.getString('Groups'),
        selectedItemCls: '',
        emptyText: VIPSMobile.getString('No lists to display'),
        store: 'MailGroupHead',
        panel: 'left',

        itemTpl: '<strong>{ListNo}.</strong>  <tpl if="ListDesc==\'\'">unnamed<tpl else>{ListDesc}</tpl>'

    }

});

