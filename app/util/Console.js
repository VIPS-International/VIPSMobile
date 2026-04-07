//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.Console', {
    singleton: true,

    levels: {
        debug: 1,
        log: 2,
        warn: 3,
        error: 4
    },

    requires: ['VIPSMobile.MsgQueue', 'VIPSMobile.store.ConsoleLogItems'],

    config: {
        logQueue: [],
        logQueueIndex: 0,
        maxEntries: 20,
        minLevel: 2,
        origs: {},
        store: null
    },

    constructor: function (config) {
        var origs;

        this.initConfig(config);

        try {

            // set the original console functions
            origs = {};
            origs[this.levels.debug] = console.debug;
            origs[this.levels.error] = console.error;
            origs[this.levels.log] = console.log;
            origs[this.levels.warn] = console.warn;
            this.setOrigs(origs);

            // reset the console functions to call our code if not dev machine
            if (window.location.href.toLowerCase().indexOf('localhost') < 0) {
                console.debug = function () {
                    VIPSMobile.util.Console.addToLog(VIPSMobile.util.Console.levels.debug, arguments);
                };
                console.error = function () {
                    VIPSMobile.util.Console.addToLog(VIPSMobile.util.Console.levels.error, arguments);
                };
                console.log = function () {
                    VIPSMobile.util.Console.addToLog(VIPSMobile.util.Console.levels.log, arguments);
                };
                console.warn = function () {
                    VIPSMobile.util.Console.addToLog(VIPSMobile.util.Console.levels.warn, arguments);
                };
            }

            // trap all unhandled errors
            window.onerror = function (event, filename, lineno) {
                console.error(event, 'source:window.onerror');
            };

        }
        catch (ex) {

            alert('Console error.js');

        }

    },

    addToLog: function (level, args) {
        var origFn, objMsg;

        // remember last debug entry
        if (level === VIPSMobile.util.Console.levels.debug) {
            VIPSMobile.lastDebug = this.convertArgsToArray(args).join(',');
        }

        // check if high enough level
        if (level >= this.getMinLevel()) {

            // call the original browser function
            origFn = this.getOrigs()[level];
            if (Ext.isFunction(origFn)) {
                origFn.apply(console, args);
            }

            // Set the message object
            objMsg = {
                level: level,
                saveDate: DataFunc.getdate(),
                arguments: this.convertArgsToArray(args).join(',')
            };

            // add the item to the console store
            if (!this.getStore()) {
                this.setStore(Ext.getStore('ConsoleLogItems'));
            }
            this.getStore().add(objMsg);

            // limit the entries to max size, removing oldest first
            while (this.getStore().getCount() > this.getMaxEntries()) {
                this.getStore().removeAt(0);
            }

            // check if it's an error
            if (level === VIPSMobile.util.Console.levels.error) {

                // add the last debug message
                objMsg.lastDebug = VIPSMobile.lastDebug;
                objMsg.log = VIPSMobile.Main.getLogEntries();

                // send the error via queue if not on development
                if (VIPSMobile.MsgQueue && VIPSMobile.site.code !== 'A') {
                    VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.Console, objMsg);
                }

                // show the error
                if (VIPSMobile.User && VIPSMobile.User.getDebug()) {
                    Ext.Msg.alert('<span class="error">Console Error</span>', objMsg.arguments);
                }

            }

        }

    },

    convertArgsToArray: function (args) {
        var strArgs = [], i, fnStringify, cache = [];

        for (i = 0; i < args.length; i++) {

            if (Ext.isArray(args[i])) {
                strArgs = strArgs.concat(this.convertArgsToArray(args[i]));
            } else {
                if (args[i]) {
                    strArgs.push(args[i].toString());
                }
            }

        }
        cache = null; // Enable garbage collection

        return strArgs;

    }

});
