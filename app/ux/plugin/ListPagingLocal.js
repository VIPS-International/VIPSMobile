//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.plugin.ListPagingLocal', {
    extend: 'Ext.plugin.ListPaging',

    alias: 'plugin.listpaginglocal',

    config: {
        nextPageCallback: null
    },

    bindStore: function (newStore, oldStore) {
        this.callParent(arguments);
        var me = this,
            store = this.getList().getStore(), total;
        if (store && newStore) {
            total = store.getTotalCount();
            newStore.loadPage = function (page, options, scope) {
                var callback = me.getNextPageCallback(),
                    pageSize = store.getPageSize();

                if (callback) {
                    callback(pageSize, page, function (data, totalCount, sorter) { //callback2 
                        if (!page || page <= 1) {
                            store.removeAll();
                            if (sorter) {
                                store.setSorters([sorter]);
                            } else {
                                store.setSorters([]);
                            }
                        }
                        store.setTotalCount(totalCount);
                        store.currentPage = page;
                        store.addData(data);
                        store.fireEvent('load', store);
                    }
                    );
                }
            };
        }
    }
});  
