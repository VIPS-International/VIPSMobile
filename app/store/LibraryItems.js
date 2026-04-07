//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.store.LibraryItems', {
    extend: 'Ext.data.TreeStore',

    config: {

        model: 'VIPSMobile.model.LibraryItem',
        defaultRootProperty: 'items'

        , grouper: {
            sorterFn: function () {
                return null;
            },
            groupFn: function (record) {
                return record.get('group');
            }
        }

    }

});

