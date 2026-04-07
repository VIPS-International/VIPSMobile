//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.Commands', {
    singleton: true,

    config: {
        checkInterval: 5 * 60 * 1000, // reset after testing to 5 minutes
        logout: null,
        task: null
    },

    Types: {
        clearInfo: 1,
        showMsg: 2,
        dropTable: 3,
        syncTable: 4,
        logout: 5,
        sql: 6,
        js: 7
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    start: function () {

        this.CheckForCommands();

        if (!this.getTask()) {
            this.setTask(Ext.create('Ext.util.DelayedTask', this.CheckForCommands, this));
            this.getTask().delay(this.getCheckInterval());
        }

    },

    updateCheckInterval: function (newValue, oldValue) {
        if (this.getTask()) { // gets fired in constructor so ignore unless have a task
            if (this.getCheckInterval() > 0) {
                this.getTask().delay(this.getCheckInterval());
            } else {
                this.getTask().cancel();
            }
        }
    },

    CheckForCommands: function () {

        Ext.Ajax.request({
            timeout: 120000,
            url: VIPSMobile.ServiceURL + 'Commands/CheckForCommands',
            headers: { 'Content-Type': 'application/json' },
            jsonData: { MobileID: VIPSMobile.User.getMobileID(), Mailbox: VIPSMobile.User.getMailbox() },
            scope: this,
            success: function (response, opts) {
                this.RunCommand(response.responseObject, 0);
                this.getTask().delay(this.getCheckInterval());
            },
            failure: function (response, opts) {
                console.log('Failed to get commands. response: ' + response.responseText);
                this.getTask().delay(this.getCheckInterval());
            }
        });

    },

    RunCommand: function (commands, index) {
        var fn;

        if (index < commands.length) {

            console.debug('RunCommand', commands[index]);

            // it's possible the command has already run and response is waiting on message queue so might want to check

            // get the function to run based on the command
            switch (commands[index].type) {
                case this.Types.clearInfo: fn = this.ClearInfo; break;
                case this.Types.dropTable: fn = this.DropTable; break;
                case this.Types.js: fn = this.ExecuteJS; break;
                case this.Types.logout: fn = this.Logout; break;
                case this.Types.showMsg: fn = this.ShowMessage; break;
                case this.Types.sql: fn = this.ExecuteSQL; break;
                case this.Types.syncTable: fn = this.SyncTable; break;
                default:
                    console.warn('Unknown command type ' + commands[index].type, commands[index]);
                    fn = null; break;
            }

            if (fn) {

                try {

                    // first param has to be callback, rest are params from return
                    fn.apply(this, [function (res) {

                        // mark the command as complete
                        this.CommandComplete(commands, index, res);

                    }, commands[index].param1, commands[index].param2]);

                } catch (ex) {

                    // log the error and continue with next command
                    console.error('Error executing command', commands[index], ex);
                    this.CommandComplete(commands, index, ex);

                }

            } else {

                this.CommandComplete(commands, index);

            }

        } else if (this.getLogout() !== null) {

            // logout after all commands run
            VIPSMobile.Main.LogOut(this.getLogout());

        }

    },

    ClearInfo: function (callback) {
        DataFunc.ClearInfo(callback, this);
    },

    DropTable: function (callback, tablename) {

        tablename = tablename.replace('.dbo.', 'dbo');

        DataFunc.executeSQL({
            sql: 'DROP TABLE IF EXISTS ' + tablename,
            scope: this,
            success: function () {

                // delete the sql table object as well
                VIPSMobile.SQLTables.remove(tablename);

                callback.apply(this);

            },
            failure: function (tx, ex) {
                callback.apply(this, [ex]);
            }
        });

    },

    ExecuteJS: function (callback, js) {
        var res;

        try {
            res = eval('(' + js + ')');
        } catch (ex) {
            res = ex;
        }

        callback.apply(this, [res]);

    },

    ExecuteSQL: function (callback, command) {

        DataFunc.executeSQL({
            sql: command,
            scope: this,
            success: function (tx, results) {
                callback.apply(this, [true, results]);
            },
            failure: function (tx, ex) {
                callback.apply(this, [false, ex]);
            }
        });

    },

    Logout: function (callback) {

        // set flag to logout after all commands run
        this.setLogout(false);

        callback.apply(this);

    },

    ShowMessage: function (callback, message, heading) {

        // set default heading if not set
        if (!heading || heading.length === 0) {
            heading = 'VIPS Mobile';
        }

        Ext.Msg.alert(heading, message, function () {
            callback.apply(this);
        }, this);

    },

    SyncTable: function (callback, tableName) {

        VIPSMobile.Sync.doSync({
            tableName: tableName,
            forceSync: true,
            scope: this,
            callback: function () {
                callback.apply(this);
            }
        });

    },

    CommandComplete: function (commands, index, result) {

        // blank the result if don't need result
        if (!commands[index].saveResult) { result = undefined; }

        // tell server command executed
        VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.CmdResult, {
            mobileID: VIPSMobile.User.getMobileID(),
            commandID: commands[index].id,
            runAt: DataFunc.getUTCdate(),
            result: result
        });

        // execute the next command
        index++;
        this.RunCommand(commands, index);

    }

});
