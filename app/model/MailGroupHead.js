//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.MailGroupHead', {
    extend: 'Ext.data.Model',

    config: {

        idProperty: 'ID',

        fields: [
            { name: 'ID', type: 'integer' },
            { name: 'ListNo', type: 'integer' },
            { name: 'ListDesc', type: 'string' },
            { name: 'Owner', type: 'integer' },
            { name: 'SysKey', type: 'integer' }
        ]

    }

});
