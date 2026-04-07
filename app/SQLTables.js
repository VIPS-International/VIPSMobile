//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.SQLTables', {
    alternateClassName: ['SQLTables'],
    singleton: true,

    requires: ['VIPSMobile.util.SQLTable', 'VIPSMobile.Version'],

    config: {
        tables: {}
    },

    // constants to alias the ugly huge table names
    Tables: {
        CallFlowDef: 'VIPSMobileDatadboCallFlowDef',
        Help: 'VIPSMobileDatadboMobileHelp',
        Library: 'VIPSMobileDatadbovwLibraryItems',
        LibraryVisited: 'MyVipsdboLibraryFolderVisitedLog',
        MyVIPSMailboxes: 'MyVipsdboMailboxes',
        Messages: 'VIPSMobileDatadbovwAllMessages',
        MemoComments: 'MyVipsdboMemoComments',
        SQLStatements: 'VIPSMobileDatadboMobileSQLStatements',
        SentMessages: 'MyVipsdbofnGetSentMessages',
        SentMessageRecipients: 'VIPSMobileDatadbovwSentMessageRecipients',
        Mailbox: "VPSdbdboMailbox",
        MailGroupHead: "VPSdbdboMailGroupHead",
        MailGroup: "VPSdbdboMailGroup",
        ColourPallet: "VIPSMobileDatadboColourPallet"
    },

    CreateTables: {
        DataDrafts: 'CREATE TABLE IF NOT EXISTS DataDrafts (CallFlowID INTEGER, StartNodeID INTEGER, SavedAt INTEGER, Nodes TEXT, Cart TEXT, PRIMARY KEY (CallFlowID asc))',
        MessageQueue: 'CREATE TABLE IF NOT EXISTS MessageQueue (Id TEXT, Type INTEGER, JSON TEXT, Status INTEGER, PRIMARY KEY (Id asc))',
        RecentFiles: 'CREATE TABLE IF NOT EXISTS RecentFiles (item TEXT, fileId INTEGER, VisitTime INTEGER)'
    },

    constructor: function (config) {
        var i;

        this.initConfig(config);

        // load any tables from local storage
        for (i = 0; i < localStorage.length; i++) {

            if (localStorage.key(i).indexOf(VIPSMobile.Version.getLSPrefix() + 'table_') === 0) {

                config = JSON.parse(localStorage[localStorage.key(i)]);

                this.getTables()[config.name] = Ext.create('VIPSMobile.util.SQLTable', config);

            }

        }

    },

    get: function (vTableName) {
        vTableName = this.LocalTableName(vTableName);
        return this.getTables()[vTableName];
    },

    exists: function (vTableName) {
        vTableName = this.LocalTableName(vTableName);
        return !!this.getTables()[vTableName];
    },

    add: function (vTableName) {

        vTableName = this.LocalTableName(vTableName);

        if (!this.exists(vTableName)) {
            this.getTables()[vTableName] = Ext.create('VIPSMobile.util.SQLTable', { name: vTableName });
        }

        return this.get(vTableName);

    },

    remove: function (vTableName) {

        vTableName = this.LocalTableName(vTableName);

        delete this.getTables().vTableName;
        delete localStorage[VIPSMobile.Version.getLSPrefix() + 'table_' + vTableName];

    },

    // convert the SQL Server name to local name if needed
    LocalTableName: function (tableName) {
        
        if (tableName) {
            if (tableName.indexOf("(") > 0) {
                tableName = tableName.substring(0, tableName.indexOf("("));
            }
            tableName = tableName.replace(/\.dbo\./gi, "dbo");            
            return tableName;
        }
        console.log('tablename is null');

    },

    clear: function () {

        console.debug('SQLTables.clear()');

        Ext.iterate(this.getTables(), function (table) {
            delete localStorage[this.getTableKey(table)];
        }, this);

        this.setTables({});

    },

    clearAllLastSyncs: function () {

        console.debug('SQLTables.clearAllLastSyncs()');

        // loop through all the tables
        Ext.iterate(this.getTables(), function (tableName, item) {

            // clear last sync and save
            item.setLastSync(0);
            item.save();

        });

    },

    getTableKey: function (tableName) {
        return VIPSMobile.Version.getLSPrefix() + 'table_' + tableName;
    },

    MaxLastSync: function () {
        var maxLastSync;

        maxLastSync = 0;

        Ext.iterate(this.getTables(), function (key, table) {

            if (table.getLastSync() > maxLastSync) {
                maxLastSync = table.getLastSync();
            }

        });

        return maxLastSync;

    }

});
