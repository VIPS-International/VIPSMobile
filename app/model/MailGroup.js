//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.MailGroup', {
    extend: 'Ext.data.Model',

    config: {

        idProperty: 'ListMember',

        fields: [
            { name: 'Email', type: 'string' },
            { name: 'FirstName', type: 'string' },
            { name: 'LastName', type: 'string' },
            { name: 'ListMember', type: 'integer' },
            { name: 'Mobile', type: 'string' }
        ]
    }

});
