//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.DataQueueItem', {
    extend: 'Ext.data.Model',

    config: {

        identifier: 'sequential',

        fields: [
            { name: 'id', type: 'integer' },
            { name: 'text', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'params', type: 'string' }
        ]

    }

});
