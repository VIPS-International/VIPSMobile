//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.CartItem', {
    extend: 'Ext.Container',

    config: {
        itemId: 'datacartiem',
        scrollable: 'vertical',
        items: [{
            xtype: 'OrdersDetail',
            flex: 1
        }, {
            xtype: 'button',
            text: VIPSMobile.getString('Ok'),
            ui: 'action',
            style: 'margin: 1em 0',
            func: 'Action'
        }],
        layout: {
            type: 'vbox',
            align: 'stretch',
            pack: 'start'
        }

    }

});
