//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.store.OrdersCart', {
    extend: 'Ext.data.Store',

    config: {
        model: 'VIPSMobile.model.CartItem',

        sorters: [{
            sorterFn: function (r1, r2) {
                return DataFunc.SorterFunction('ProductName', r1, r2);
            }
        }],
        grouper: {
            sorterFn: function (r1, r2) {
                return DataFunc.SorterFunction('GroupName', r1, r2);
            },

            groupFn: function (record) {
                return record.get('GroupName') || '';
            }

        },
        filters: [{
            filterFn: function (prod) {
                return prod.get('Quantity') > 0;
            }
        }]

    },

    getActiveCount: function () {
        var i, intCount, arData;

        // count the Visible (non zero) products
        arData = this.getRange();
        intCount = 0;

        for (i = 0; i < arData.length; i++) {
            intCount++;
        }

        return intCount;

    }

});
