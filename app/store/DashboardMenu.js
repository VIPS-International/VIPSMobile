//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.store.DashboardMenu', {
    extend: 'Ext.data.Store',

    config: {

        model: 'VIPSMobile.model.DashboardMenuItem',

        sorters: [{
            property: 'SecondaryDescription',
            direction: 'ASC'
        }, {
            property: 'Description',
            direction: 'ASC'
        }],

        grouper: {
            sorterFn: function () {
                return null;
            },
            groupFn: function (record) {
                return record.get('SecondaryDescription');
            }
        },
        filters: [
            {
                property: "InputMethod",
                value: /6/
            }
        ]
    }

});
