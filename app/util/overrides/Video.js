//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.Video', {
    override: 'Ext.Video',

    // apply any localization to displayed text
    onPlay: function() {
        this.callParent(arguments);
        this.media.show();
        // Bug Fixed this.media.setTop(0);
    }
});
