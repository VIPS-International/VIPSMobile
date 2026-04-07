//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.Shop', {
    extend: 'Ext.data.Model',

    config: {

        idProperty: 'ShopID',

        fields: [
              { name: 'CustNo', type: 'integer' },
              { name: 'Draft', type: 'boolean' },
              { name: 'Name', type: 'string' },
              { name: 'ShopID', type: 'integer' },
              { name: 'SortOrder', type: 'integer' }
        ]
    }

});
