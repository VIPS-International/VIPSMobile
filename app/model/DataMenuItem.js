//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.DataMenuItem', {
    extend: 'Ext.data.Model',

    config: {

        idProperty: 'CallFlowID',

        fields: [
            { name: 'CallFlowID', type: 'integer' },

            { name: 'Badge', type: 'string' },
            { name: 'Colour', type: 'string' },
            { name: 'CustNo', type: 'integer' },
            { name: 'DCNo', type: 'integer' },
            { name: 'InputMethod', type: 'integer' },
            { name: 'Description', type: 'string' },
            { name: 'Draft', type: 'boolean' },
            { name: 'SecondaryDescription', type: 'string' },
            { name: 'Thumbnail', type: 'string' }
        ]
    }

});
