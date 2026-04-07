//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.Sync', {
    mixins: ['Ext.mixin.Observable'],
    singleton: true,

    requires: 'VIPSMobile.util.SyncObject',

    config: {
        afterSync: {},
        log: {},
        tables: { count: 0 }
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    // check if currently syncing the given table
    SyncingTable: function (tableName) {
        return (!!this.getTables()[tableName]);
    },

    // add a function to run after the table syncs
    addAfterSync: function (tableName, fn, scope) {
        var i;

        // table name can be an array so convert if not
        if (!Ext.isArray(tableName)) { tableName = [tableName]; }

        // add call backs
        for (i = 0; i < tableName.length; i++) {

            if (!this.getAfterSync()[tableName[i]]) {
                this.getAfterSync()[tableName[i]] = [];
            }

            this.getAfterSync()[tableName[i]].push({
                fn: fn,
                scope: scope
            });

        }

    },

    //removeAfterSync:function(tableName,fn,scope) {
    //},

    doMany: function (config) {
        var intIndex, i, funcCallback, syncTables;

        // check for common errors
        if (!config) { throw 'no arguments set'; }
        if (!config.tableNames) { throw 'tableNames not set'; }

        syncTables = {};
        intIndex = config.tableNames.length;

        funcCallback = function (vTableName, vParams, vSyncRecords) {

            syncTables[vTableName] = { params: vParams, records: vSyncRecords };

            // run call back after all syncs done
            intIndex--;
            if (intIndex === 0 && config.callback) {
                config.callback.apply(config.scope || this, [syncTables]);
            }

        };

        for (i = 0; i < config.tableNames.length; i++) {

            // callbacks for all tables are the same so need to add key to function
            // to check if it's already been added in AddCallback
            if (config.callback) {
                funcCallback.key = config.callback.toString();
            } else {
                funcCallback = null;
            }

            this.doSync({
                forceSync: config.forceSync,
                scope: config.scope,
                tableName: config.tableNames[i],
                callback: funcCallback
            });

        }

    },

    // do a sync with the given values
    doSync: function (config) {
        var objSync, strSection;

        // check for common errors
        if (!config) { throw 'no arguments not set'; }
        if (!config.tableName) { throw 'tableName not set'; }

        // replace .dbo.
        config.tableName = config.tableName.replace('.dbo.', 'dbo');

        // create the sync object if needed
        if (!this.SyncingTable(config.tableName)) {
            objSync = Ext.create('VIPSMobile.util.SyncObject', config);
        } else {
            objSync = this.getTables()[config.tableName];
        }

        // add this callback 
        if (config.callback) {
            this.AddCallback(objSync, { func: config.callback, scope: config.scope });
        }

        // add the section if set
        if (config.scope && config.scope.getSection) {
            strSection = config.scope.getSection();
            if (objSync.getSections().indexOf(strSection) === -1) {
                objSync.getSections().push(strSection);
            }
        }

        // do the sync if new
        if (!this.SyncingTable(config.tableName)) {
            this.getTables()[config.tableName] = objSync;
            this.getTables().count = this.getTables().count + 1;
            objSync.go();
        }

    },

    SyncDone: function (syncObject, vParams) {
        var after, i, results;

        // delete the sync object
        delete this.getTables()[syncObject.getTableName()];
        this.getTables().count = this.getTables().count - 1;

        // run all the after functions
        after = this.getAfterSync()[syncObject.getTableName()];
        if (after) {

            // set the results object
            results = {
                tableName: syncObject.getTableName(),
                params: vParams,
                records: syncObject.getSyncRecords()
            };

            // execute each after function
            for (i = 0; i < after.length; i++) {

                try {
                    after[i].fn.apply(after[i].scope || this, [results]);
                } catch (ex) {
                    console.error('Error executing after sync function for table ' + syncObject.getTableName(), after[i]);
                }

            }

        }

        // fire sync done event
        //this.fireEvent('syncdone', syncObject.getTableName(), vParams, syncObject.getSyncRecords());

    },

    AddCallback: function (vSync, vCallback) {
        var blnAddCallback, i, strKey1, strKey2;

        blnAddCallback = true;

        // compare the functions, for doManys, call back is always the same so 
        // need to compare lower level callback
        for (i = 0; i < vSync.getCallbacks().length; i++) {

            // check if added callback has a key
            if (vSync.getCallbacks()[i].key) {
                strKey1 = vSync.getCallbacks()[i].key;
            } else {
                strKey1 = vSync.getCallbacks()[i].func.toString();
            }

            // check if new callback has a key
            if (vCallback.func.key) {
                strKey2 = vCallback.func.key;
            } else {
                strKey2 = vCallback.func.toString();
            }

            // don't add the callback if already added
            if (strKey1 === strKey2) {
                blnAddCallback = false;
            }

        }

        if (blnAddCallback) {
            vSync.getCallbacks().push(vCallback);
        }

    }

});
