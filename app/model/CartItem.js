//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.CartItem', {
    extend: 'Ext.data.Model',

    config: {

        idProperty: 'id',

        fields: [
            { name: "id", type: "string" },
            { name: "Barcode", defaultValue: null, type: "string" },
            { name: "CallDate", type: "string" },
            { name: "Discount", defaultValue: null, type: "float" },
            { name: "GroupName", type: "string" },
            { name: "Mailbox", defaultValue: null, type: "string" },
            { name: "Name", type: "string" },
            { name: "Notes", defaultValue: null, type: "string" },
            { name: "OverridePrice", defaultValue: null, type: "float" },
            { name: "Price", type: "float" },
            { name: "ProductID", type: "integer" },
            { name: "ProductName", type: "string" },
            { name: "ProductNo", type: "integer" },
            { name: "UOM", type: "string" },
            { name: "Quantity", type: "integer" },
            { name: "Stock", type: "integer" },
            { name: "Tag", defaultValue: null },
            { name: "TotalPrice", defaultValue: null, type: "float" },
            { name: "Value", type: "string" },
            { name: "WholesalerNo", defaultValue: null, type: "string" },
        ]
    }

});

