//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.LibraryItem', {
    extend: 'Ext.data.Model',

    config: {
       
        fields: [
            { name: 'MetaID', type: 'integer' },
            { name: 'text', type: 'string' },
            { name: 'path', type: 'string' },
            { name: 'csClass', type: 'string' },
            { name: 'group', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'filename', type: 'string' },
            { name: 'contents', type: 'string' },
            { name: 'sortorder', type: 'integer' },
            { name: 'new', type: 'boolean' },
            { name: 'displayDownload', type: 'boolean' },
            { name: 'allowShare', type: 'boolean' },            
            { name: 'thumbnail', type: 'string' }
        ]
    }
});
