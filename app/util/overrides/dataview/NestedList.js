//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.dataview.NestedList', {
    override: 'Ext.dataview.NestedList',   

    getList: function (node) {
        var list = this.callParent(arguments);

        list.grouped = this.grouped;

        if (list.grouped && this.getStore().config.grouper) {
            list.store.setGrouper(this.getStore().config.grouper);
        }

        return list;
    }

});
