//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.SQLTable', {
    alias: 'SQLTable',

    config: {
        dailyRecords: {},
        keyId: null,
        lastSync: 0,
        lastSyncError: null,
        name: '',
        saveTask: null,
        phantomIds: null
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    UpdateDailyRecords: function (count) {
        var objDaily, key;

        if (count > 0) {

            objDaily = this.getDailyRecords();
            key = Ext.Date.format(new Date(), 'Ymd');

            if (!objDaily[key]) { objDaily[key] = 0; }
            objDaily[key] = objDaily[key] + count;

            this.setDailyRecords(objDaily);

            this.save();

        }

    },

    save: function () {
        var info;

        info = {};
        Ext.iterate(this, function (key, value) {

            if (key && key[0] === '_') {
                info[key.substring(1)] = value;
            }

        });

        localStorage[VIPSMobile.SQLTables.getTableKey(this.getName())] = Ext.encode(info);

    }

});
