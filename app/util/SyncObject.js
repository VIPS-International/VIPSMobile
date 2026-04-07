//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.SyncObject', {
    alias: 'SyncObject',

    config: {
        batchID: 0,
        batchSQL: null,
        callbacks: [],
        forceSync: false,
        scope: this,
        sections: [],
        SQLTable: null,
        syncRecords: [],
        tableName: null,
        totalRows: -1
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    getSQLTableName: function() {
        var tn = this.getTableName(),
            io = tn.indexOf("(");        

        if(io !== -1){
            tn = tn.substring(0, io);
        }

        return tn;

    },
    
    go: function () {

        // add the table to sync log 
        if (!VIPSMobile.Sync.getLog()[this.getTableName()]) {
            VIPSMobile.Sync.getLog()[this.getTableName()] = [];
        }

        // Get the table info
        if (VIPSMobile.SQLTables.exists(this.getTableName())) {
            this.setSQLTable(VIPSMobile.SQLTables.get(this.getTableName()));
        }

        // check if force sync set, time since last sync has
        // elapsed and not already syncing the table
        if (this.getForceSync() || this.ShouldSyncTable()) {
            this.CallSyncService();
        } else {
            this.SyncDone();
        }

    },

    ShouldSyncTable: function () {
        var blnSync, dblSpan;

        // check if sync is enabled and have sync'd the table before
        if (VIPSMobile.User.getSyncFrequency() >= 0 && this.getSQLTable()) {

            // check if last sync was cleared
            if (this.getSQLTable().getLastSync() === 0) {

                // last sync cleared so force sync
                blnSync = true;

            } else {

                // calculate minutes since last sync
                dblSpan = DataFunc.datediff('mi', this.getSQLTable().getLastSync(), DataFunc.getUTCdate());

                // check if enough time has elapsed since last sync
                if (dblSpan > VIPSMobile.User.getSyncFrequency()) {
                    blnSync = true;
                } else {
                    blnSync = false;
                }

            }

        } else {

            // if never got the table, sync it
            blnSync = (!this.getSQLTable());

        }

        return blnSync;

    },

    CallSyncService: function () {
        var params, startTime;

        VIPSMobile.log('SyncObject.CallSyncService()', this.getTableName());

        // reset the batch sql list
        this.setBatchSQL([]);

        // show the loading mask
        this.UpdateSectionMasks();

        params = {
            MobileID: VIPSMobile.User.getMobileID(),
            Mailbox: VIPSMobile.User.getMailbox(),
            BatchID: this.getBatchID(),
            TableName: this.getTableName() // make sure . are right
        };

        startTime = new Date();

        Ext.Ajax.request({
            timeout: 120000,
            url: VIPSMobile.ServiceURL + 'Data/GetTable',
            headers: { 'Content-Type': 'application/json' },
            jsonData: params,
            scope: this,
            success: function (response, opts) {

                params.startTime = startTime;
                console.debug('Sync ' + this.getTableName() + ' web call time', (new Date() - startTime) / 1000);

                this.UpdateSyncTables(params, response, opts);

            },
            failure: function (response, opts) {

                this.UpdateSyncTables(params, response, opts);

            }
        });

    },

    UpdateSectionMasks: function () {
        var i, intCount, intFetching, intTotal, strContID, strMask, intContainer, objContainer, loopFn;

        loopFn = function (tableNme, objTable) {

            // get tables contains a count ignore it
            if (typeof objTable === 'object') {

                // loop through each section for the table                     
                for (intContainer = 0; intContainer < objTable.getSections().length; intContainer++) {

                    objContainer = objTable.getSections()[intContainer];

                    // check if the table is used for this section
                    if (objContainer === strContID) {

                        intCount++;

                        // check if first sync for table
                        if (objTable.getTotalRows() === -1) {
                            intFetching++;
                        } else {
                            intTotal += objTable.getTotalRows();
                        }

                    }

                }
            }
        };

        // loop through each section
        for (i = 0; i < this.getSections().length; i++) {

            // get the section
            strContID = this.getSections()[i];

            intCount = 0;
            intTotal = 0;
            intFetching = 0;

            // loop through each table
            Ext.iterate(VIPSMobile.Sync.getTables(), loopFn);

            // set the mask message
            if (intCount > 0) {
                strMask = 'Tables: ' + intCount.toString();
                if (intFetching > 0) { strMask += '<br />Fetching: ' + intFetching.toString(); }
                if (intTotal > 0) { strMask += '<br />Records: ' + intTotal.toString(); }
            } else {
                strMask = false;
            }

            // update the mask 
            VIPSMobile.Main.setMask(this.getSections()[i], strMask);

        }

    },

    UpdateSyncTables: function (vParams, response, opts) {
        var objResponse;

        try {

            vParams.responseTime = new Date();

            // create the sql table if needed
            if (!this.getSQLTable()) {
                this.setSQLTable(VIPSMobile.SQLTables.add(this.getTableName()));
            }
            this.getSQLTable().setLastSyncError(true);
            this.getSQLTable().save();

            if (response && response.status === 200) {

                try {
                    objResponse = response.responseObject;
                } catch (ex) {
                    console.error("Couldn't eval response for table '" + this.getTableName() + "'.");
                    objResponse = {
                        success: false
                    };
                }

                if (objResponse.success) {

                    if (!objResponse.duplicate) {

                        this.getSQLTable().setLastSyncError(false);
                        this.getSQLTable().save();

                        // remember the total rows needed to fetch
                        this.setTotalRows(objResponse.totalrows);

                        // delete the phantom records inserted from call flows
                        this.DeletePhantomRecords();

                        // save the table info
                        this.SaveTable(objResponse.table, objResponse.batch, vParams);

                    } else {

                        console.log('Duplicate request for ' + this.getTableName() + ' so ignoring');

                    }

                } else {

                    this.getSQLTable().setLastSyncError(objResponse.trace);

                    if (objResponse.trace && objResponse.trace.match(/^Timeout/i)) {

                        console.log("Sync timed out for table '" + this.getTableName(), objResponse);
                        this.CallSyncService();

                    } else if (objResponse.trace && objResponse.trace.match(/^Provision/i)) {

                        console.error("Need to provision table '" + this.getTableName(), objResponse);

                    } else {

                        console.error("Sync unsuccessful response for table '" + this.getTableName(), objResponse);
                        vParams.trace = objResponse.trace;
                        this.UpdateSyncTables(vParams);

                    }

                }

            } else if (response && response.status !== undefined) {

                console.log(vParams.TableName + " Sync Failed " + ": " + response.statusText);

                this.SyncDone(vParams);

            } else {
                this.SyncDone(vParams);
            }

        } catch (exx) {
            console.error("UpdateSyncTables(" + this.getTableName() + ") error: " + exx.message);
        }

    },

    DeletePhantomRecords: function () {
        var lstIDs, i;

        lstIDs = this.getSQLTable().getPhantomIds() || [];
        
        if (lstIDs.length > 0){
            console.debug("DeletePhantomRecords", lstIDs);
            this.getBatchSQL().push({
                sql: 'DELETE FROM ' + this.getTableName() + ' WHERE ' + this.getSQLTable().getKeyId() + ' in (' + lstIDs.join(',') + ')',                
            });
        }
    },

    SaveTable: function (vTable, vBatchID, vParams) {

        if (vTable && vTable.records) {

            // update any table statistics
            this.getSQLTable().UpdateDailyRecords(vTable.records.length);

        }

        // check if the table is associated with a store with sql proxy
        this.UpdateTable(vTable, vBatchID, vParams);

    },

    // update the websql table directly
    UpdateTable: function (vTable, vBatchID, vParams) {
        var strCreate, strInsert, strParams, intRow, intField, objParams, value, dicFieldIndex, objRow;
                
        // check if just need to drop the table
        if (vTable && vTable !== 'drop') {

            // the table has been changed its schema, drop and load
            // all records
            if (vTable.allRecords) {

                this.getBatchSQL().push({ sql: 'DROP TABLE IF EXISTS ' + this.getSQLTableName() });

                // set the SQL to create table if needed
                strCreate = "CREATE TABLE IF NOT EXISTS " + this.getSQLTableName() + " (";

                // loop through each field to build the statements
                for (intField = 0; intField < vTable.schema.length; intField++) {

                    if (intField > 0) { strCreate += ","; }
                    strCreate += vTable.schema[intField][intField] + " " + vTable.schema[intField].type;

                }

                if (vTable.keyID !== "") {
                    strCreate += ", PRIMARY KEY(" + vTable.keyID + " asc)";
                }

                strCreate += ")";

                this.getBatchSQL().push({ sql: strCreate });

            }

            this.CreateIndexes(vTable.indexes);

            if (vTable.records && vTable.records.length > 0) {

                // build the insert command
                strInsert = "INSERT OR REPLACE INTO " + this.getSQLTableName() + " (";
                strParams = "";
                dicFieldIndex = {};

                // loop through each field to build the statements
                for (intField = 0; intField < vTable.recordsSchema.length; intField++) {

                    dicFieldIndex[vTable.recordsSchema[intField][intField]] = intField;

                    if (intField > 0) {
                        strInsert += ",";
                        strParams += ",";
                    }

                    strInsert += vTable.recordsSchema[intField][intField];
                    strParams += "?";

                }
                strInsert += ") VALUES (" + strParams + ")";

                // insert all the new records
                for (intRow = 0; intRow < vTable.records.length; intRow++) {

                    objRow = {};
                    for (intField = 0; intField < vTable.recordsSchema.length; intField++) {
                        objRow[vTable.recordsSchema[intField][intField]] = vTable.records[intRow][intField];
                    }
                    this.getSyncRecords().push(objRow);

                    // build the params array
                    objParams = [];
                    for (intField = 0; intField < vTable.recordsSchema.length; intField++) {

                        value = vTable.records[intRow][intField];

                        // JSON Converter is returning string boolean
                        if (value === false) {
                            value = 0;
                        } else if (value === true) {
                            value = 1;
                        }

                        //}
                        objParams.push(value);

                    }

                    // insert or replace the record
                    this.getBatchSQL().push({
                        sql: strInsert,
                        params: objParams
                    });

                }

            }

            if (vTable.deletes && vTable.deletes.length > 0) {

                // delete all the marked records
                while(vTable.deletes.length) {

                    // delete the record
                    this.getBatchSQL().push({
                        sql: 'DELETE FROM ' + this.getSQLTableName() + ' WHERE ' + vTable.keyID + ' in (' + vTable.deletes.splice(0, 50).join(',') + ')'
                    });
                
                }

            }

            // save the table info
            this.getSQLTable().setKeyId(vTable.keyID);
            this.getSQLTable().save();

        } else if (vTable === 'drop') {

            // just drop the table
            this.getBatchSQL().push({ sql: 'DROP TABLE IF EXISTS ' + this.getSQLTableName() });

        }
                
        // execute all the sql
        DataFunc.executeMany({
            statements: this.getBatchSQL(),
            scope: this,
            callback: function () {
                this.BatchDone(vTable, vBatchID, vParams);
            }
        });

    },

    CreateIndexes: function (indexes) {
        var strCreate, intField;

        // create any indexes
        Ext.iterate(indexes, function (name, fields) {

            // prepend the database name to the index's name
            name = this.getSQLTableName().substring(0, this.getTableName().indexOf('dbo') + 3) + name;

            // remove any spaces and illegal char from the name
            name = name.replace(/\ /gi, '').replace(new RegExp('/\\</gi'), "").replace(/\>/gi, "").replace(/\_/gi, "").replace(/\,/gi, "");

            strCreate = 'CREATE INDEX IF NOT EXISTS ' + name + ' ON ' + this.getSQLTableName() + ' (';
            for (intField = 0; intField < fields.length; intField++) {
                if (intField > 0) { strCreate += ','; }
                strCreate += fields[intField];
            }
            strCreate += ')';

            this.getBatchSQL().push({
                sql: strCreate
            });

        }, this);

    },

    BatchDone: function (vTable, vBatchID, vParams) {

        // update the table's last sync time
        this.getSQLTable().setLastSync(DataFunc.getUTCdate());
        this.getSQLTable().setPhantomIds(null);
        this.getSQLTable().save();

        // update the sync log object
        VIPSMobile.Sync.getLog()[this.getTableName()].push({
            table: this.getTableName(),
            syncTime: new Date(),
            duration: +(new Date()) - +(vParams.startTime) + ' ms',
            records: (vTable && vTable.records) ? vTable.records.length : 0,
            info: vTable
        });

        // set the batch id if successful
        this.setBatchID(vBatchID);

        // check if any records were returned
        if (vTable && vTable.records && vTable.records.length > 0) {

            // update the section masks
            this.UpdateSectionMasks();

            // send the request again
            this.CallSyncService();

        } else {

            this.SyncDone(vParams);

        }

    },

    SyncDone: function (vParams) {
        var i, callback;

        // call sync done from main sync class
        VIPSMobile.Sync.SyncDone(this, vParams);

        // update the mask
        this.UpdateSectionMasks();

        // execute all the call backs
        for (i = 0; i < this.getCallbacks().length; i++) {

            callback = this.getCallbacks()[i];

            DataFunc.ExecuteDelayedCallback(
                callback.func,
                [this.getTableName(), vParams, this.getSyncRecords()],
                callback.scope || this
            );

        }

    }

});
