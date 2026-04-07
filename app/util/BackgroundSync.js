//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.BackgroundSync', {
    singleton: true,

    config: {
        syncFreq: 5 * 60 * 1000,
        task: null
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    start: function () {

        // disable checker for now
        return;

        //if (!this.getTask()) {
        //    this.setTask(Ext.create('Ext.util.DelayedTask', this.DoSync, this));
        //    this.getTask().delay(this.getSyncFreq());
        //}

    },

    updateSyncFreq: function (newValue, oldValue) {
        if (this.getTask()) { // gets fired in constructor so ignore unless have a task
            if (this.getSyncFreq() > 0) {
                this.getTask().delay(this.getSyncFreq());
            } else {
                this.getTask().cancel();
            }
        }
    },

    // sync most used tables in background to limit time on sync when used
    DoSync: function () {
        var lstSQL, lstIgnore, i, j, strTableName;

        try {

            // loop through all the open call flows
            lstSQL = [];
            Ext.iterate(VIPSMobile.CallFlows.getCurrentBySection(), function (section, id) {
                lstSQL.push('SELECT DISTINCT TableName FROM ' + SQLTables.Tables.SQLStatements
                        + ' WHERE StartNodeID=' + id);
            });

            // check if there are any open call flows
            if (lstSQL.length > 0) {

                // get all the tables for all the open call flows
                DataFunc.executeMany({
                    statements: lstSQL,
                    scope: this,
                    callback: function (statements) {

                        lstIgnore = [];

                        // loop through all the results
                        for (i = 0; i < statements.length; i++) {

                            // loop through all the tables
                            for (j = 0; j < statements[i].results.rows.length; j++) {

                                // add the table if not already in the list
                                strTableName = VIPSMobile.SQLTables.LocalTableName(statements[i].results.rows.item(j).TableName);
                                if (lstIgnore.indexOf(strTableName) < 0) {
                                    lstIgnore.push(strTableName);
                                }

                            }

                        }

                        // do sync
                        this.SyncTable(lstIgnore);

                    }
                });

            } else {

                // no open call flows so do sync
                this.SyncTable();

            }

        } catch (ex) {

            console.error('BackgroundSync.DoSync() Error: ' + ex);

        }

    },

    SyncTable: function (ignoreTables) {
        var strSyncTable;

        // get the table to sync
        strSyncTable = this.GetTableToSync(ignoreTables);

        // check if have a table to sync
        if (strSyncTable !== '') {

            VIPSMobile.Sync.doSync({
                tableName: strSyncTable,
                forceSync: true,
                scope: this,
                callback: function (tableName, params, records) {
                    console.debug('BGS ' + tableName + ' done. ' + records.length + ' records');
                    this.getTask().delay(this.getSyncFreq());
                }
            });

        }

    },

    // get the table to sync, estimate which has the most records and which isn't being used in call flow atm
    GetTableToSync: function (ignoreTables) {
        var sngMaxEstimate, intDays, intTotal, sngEstimate, strSyncTable;

        if (!ignoreTables) { ignoreTables = []; }

        // loop through all the tables to find one with highest estimated records
        sngMaxEstimate = 0.0;
        Ext.iterate(VIPSMobile.SQLTables.getTables(), function (name, table) {

            // check if should ignore this table
            if (ignoreTables.indexOf(name) < 0) {

                // get total days and count
                intDays = 0; intTotal = 0;
                Ext.iterate(table.getDailyRecords(), function (day, count) {
                    intDays++;
                    intTotal += count;
                });

                // average records per day by the time since last sync (rough guess of how many records there will be to sync)
                if (intDays > 0) {
                    sngEstimate = intTotal / intDays * DataFunc.datediff('dd', table.getLastSync(), DataFunc.getUTCdate());
                } else {
                    sngEstimate = 1.0;
                }

                // remember table name if has highest estimate and not already syncing
                if (sngEstimate > sngMaxEstimate && !VIPSMobile.Sync.SyncingTable(strSyncTable)) {
                    sngMaxEstimate = sngEstimate;
                    strSyncTable = name;
                }

            }

        });

        return strSyncTable;

    }

});
