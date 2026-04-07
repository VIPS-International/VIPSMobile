//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define("VIPSMobile.util.Yardstick", {
    alias: "Yardstick",

    config: {
        available: 0,
        dummyData: "",
        mB: 1024 * 1024,
        db: null
    },

    constructor: function (config) {
        this.config.db = config.db;
        this.initConfig(this.config);
    },

    errorHandler: function (txn, e) {
        //console.log("errored " + e.message + " (Code " + e.code + ")");
        return true;
    },

    buildMB: function (callback) {
        // need a MB of stuff to jam into the DB,
        // so let"s create it dynamically
        var limit = this.getMB();

        while (limit > 0) {
            this.setDummyData(this.getDummyData() + "0");
            --limit;
        }
        callback && callback();
    },

    measure: function (targetSize, callback) {
        //console.time("measure");

        var self = this,
            complete = function (e) {
                // will probably move this to triggering an event later
                //      console.log(self.getAvailable());
                callback && callback(self.getAvailable(), e);
                self.cleanup();
                //    console.timeEnd("measure");
            };
        // reset the counter every time we measure
        this.setAvailable(0);
        this.reset(null, function () {

            self.buildMB(function () {
                // call complete on both success or error of the transation
                // so that we"ll know when YS.getAvailable() is ready
                self.insert((+targetSize), null, null, complete, complete);
            });
        });

    },

    insert: function (targetSize, tableName, content, success, error) {
        var self = this,
            table = tableName || "ys",
            data = content || this.getDummyData(),
            batchSQL = [],
            i = 0;

        // inserts 1MB per loop
        for (i = 0; i < targetSize; i += 1) {
            //transaction.executeSql("INSERT INTO " + table + " (content) VALUES (?)", [data], successHandler, self.errorHandler);
            batchSQL.push({
                sql: "INSERT INTO " + table + " (content) VALUES (?)",
                params: [data]
            });
        }

        this.executeMany({
            statements: batchSQL,
            scope: this
        }, success, error);


    },

    executeMany: function (args, success, error) {
        var intIndex = 0, i, loopFn, self = this;

        this.getDb().transaction(function (tx) {
            loopFn = function (tx, results) {

                args.statements[intIndex].results = results;
                self.setAvailable(results.insertId);
                intIndex += 1;

            };

            for (i = 0; i < args.statements.length; i += 1) {

                // convert the statement to an object if needed
                if (!Ext.isObject(args.statements[i])) {
                    args.statements[i] = {
                        sql: args.statements[i],
                        params: []
                    };
                }

                // if params set and not an array, make it an array
                if (args.statements[i].params && !Ext.isArray(args.statements[i].params)) {
                    args.statements[i].params = [args.statements[i].params];
                }


                tx.executeSql(args.statements[i].sql, args.statements[i].params, loopFn);

            }

        },
        function (e) {
            //console.log("error: ", e.message);
            error && error(e);
        },
        function () {
            //console.log("insert succeeded!");
            success && success();
        });

    },

    reset: function (tableName, callback) {
        var table = tableName || "ys";
        this.getDb().transaction(
            function (transaction) {
                transaction.executeSql("DROP TABLE IF EXISTS " + table, [], function () { }, this.errorHandler);
                transaction.executeSql("CREATE TABLE " + table + " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, content TEXT);", [], function () {
                    callback && callback();
                }, this.errorHandler);
            }
        );
    },

    deleteAll: function () {
        this.getDb().transaction(
            function (transaction) {
                transaction.executeSql("DROP TABLE IF EXISTS ys", [], function () { }, this.errorHandler);
            }
        );
    },

    cleanup: function () {
        this.setDummyData("");
        this.deleteAll();
    }

});
