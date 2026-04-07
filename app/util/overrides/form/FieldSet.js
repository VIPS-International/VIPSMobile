//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.form.FieldSet', {
    override: 'Ext.form.FieldSet',

    // apply any localization to displayed text
    applyTitle: function (newValue, oldValue) {
        newValue = VIPSMobile.getString(newValue);
        return this.callParent(arguments);
    }

});
