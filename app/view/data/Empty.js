//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.Empty', {
    extend: 'Ext.Panel',

    config: {
        itemId: 'dataempty',
        scrollable: null,
        panel: 'right',
        cls: 'rightpanel',

        items: [{
            xtype: 'label',
            html: 'Select option on left',
            centered: true
        }]

    }

});
