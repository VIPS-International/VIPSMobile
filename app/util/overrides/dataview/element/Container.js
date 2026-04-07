//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.dataview.element.Container', {
    override: 'Ext.dataview.element.Container',

    getViewItems: function () {

        if (this.element) {
            return Array.prototype.slice.call(this.element.dom.childNodes);
        } 

        return [];
        
    }

});
