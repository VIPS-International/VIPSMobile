//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.field.Select', {
    override: 'Ext.field.Select',

    // apply any localization to displayed text
    applyOptions: function (newValue, oldValue) {

        Ext.iterate(newValue, function (item) {
            item.text = VIPSMobile.getString(item.text);
        });

        return newValue;
    }

});
