//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.field.Field', {
    override: 'Ext.field.Field',

    // apply any localization to displayed text
    applyLabel: function (newValue, oldValue) {
        return VIPSMobile.getString(newValue);
    }

});
