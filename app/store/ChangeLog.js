//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.store.ChangeLog', {
    extend: 'Ext.data.Store',

    config: {

        model: 'VIPSMobile.model.ChangeLogItem',

        grouper: {
            sorterFn: function (r1, r2) {
                return r1.getId() - r2.getId();
            },
            groupFn: function (record) {
                return record.get('Version') + ' ' + record.get('Section');
            }
        }
    }

});
