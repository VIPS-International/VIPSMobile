//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.MsgQueue', {
    singleton: true,

    requires: ['VIPSMobile.util.DataFunc','VIPSMobile.SQLTables', 'VIPSMobile.Version'],

    Types: {
        CDR: 1, 1: 'CDR',
        Clear: 2, 2: 'Clear',
        CmdResult: 3, 3: 'CmdResult',
        Console: 4, 4: 'Console',
        DataEntry: 5, 5: 'Data Entry',
        MsgStatus: 6, 6: 'Msg Status',
        NewMessage: 7, 7: 'New Message',
        LibPathVisited: 8, 8: 'Library Path Visited',
        NewComment: 9, 9: 'New Comment'
    },

    Statuses: {
        New: 0,
        Submitting: 1,
        Nonresponsive: 2,
        Errored: 3
    },

    config: {
        newDelay: 300,
        oldDelay: 1 * 60 * 1000,
        showProgress: false
    },

    constructor: function (config) {

        this.initConfig(config);

        // this is just used for upgrade to convert old ls queue to new sql queue
        this.lsVar = VIPSMobile.Version.getLSPrefix() + 'queue';

        // create the Message queue table
        DataFunc.executeMany({
            statements: [
                VIPSMobile.SQLTables.CreateTables.MessageQueue,
                'UPDATE MessageQueue SET Status=' + this.Statuses.New
            ],
            scope: this,
            callback: function (statements) {

                // check if there was an error
                if (!statements[0].error) {

                    this.checkForOldQueue();

                    // create the delayed task to send any messages
                    this.SendMessagesToServer = Ext.create('Ext.util.DelayedTask', this.submitNextMessage, this);
                    this.DelayTaskBasedOnItems();

                }

            }
        });

    },

    // Not sure why this is here, maybe sencha needs it
    applyNextId: function (newValue) {

        return this.getNextId();

    },

    checkForOldQueue: function () {      

    },

    getItems: function (callback, scope) {

        // Get the next highest status message (new > nonresponive > error)
        DataFunc.executeSQL({
            sql: 'SELECT * FROM MessageQueue WHERE Status<>' + this.Statuses.Submitting,
            scope: this,
            success: function (tx, results) {
                var items = [], i;

                // check if any messages were found
                for (i = 0; i < results.rows.length; i++) {

                    items.push(results.rows.item(i));

                }

                if (callback) {
                    callback.apply(scope || this, [items]);
                }
            }
        });

    },

    submitNextMessage: function () {
        var item;

        // Get the next highest status message (new > nonresponive > error)
        DataFunc.executeSQL({
            sql: 'SELECT * FROM MessageQueue WHERE Status<>' + this.Statuses.Submitting + ' ORDER BY Status, Type DESC, Id LIMIT 1',
            scope: this,
            success: function (tx, results) {

                // check if any messages were found
                if (results.rows.length > 0) {

                    item = results.rows.item(0);

                    // mark item as being submitted
                    this.SetItemsStatus(item.Id, this.Statuses.Submitting, function () {

                        this.sendMessageToServer(item);

                    });

                }

            },
            failure: function (tx, ex) {

                console.error('Error getting next message to submit', ex);

            }
        });

    },

    sendMessageToServer: function (item) {
        var objResponse, intCountRemaining, fnCantSend, me=this;

        console.debug('Sending MsgQueue', item);

        if (this.getShowProgress()) {
            intCountRemaining = 0;
            DataFunc.executeSQL({
                sql: "SELECT COUNT(*) as Count FROM MessageQueue",
                scope: this,
                success: function (tx, results) {
                    intCountRemaining = results.rows.item(0).Count;
                    if (intCountRemaining > 1) {
                        VIPSMobile.Main.setMask(this.getShowProgress(), 'Remaining: ' + intCountRemaining);
                    } else {
                        VIPSMobile.Main.setMask(this.getShowProgress(), false);
                        this.setShowProgress(false);
                    }
                },

                failure: function (tx, ex) {
                    console.error('Error setting message status', ex.message);
                }
            });

        }
        fnCantSend = function (response, opts) {

            if (response && response.responseText) {
                console.error('Failed to send messages. response: ' + response.responseText);
            }
            if (item.Type === me.Types.DataEntry) {
                me.SetItemsStatus(item.Id, me.Statuses.New, me.DelayTaskBasedOnItems);
            } else {
                me.SetItemsStatus(item.Id, me.Statuses.Nonresponsive, me.DelayTaskBasedOnItems);
            }

        };

        if (navigator.onLine) {

            Ext.Ajax.request({
                timeout: 4 * 60 * 1000,
                url: VIPSMobile.ServiceURL + 'Queue/ProcessQueue',
                headers: { 'Content-Type': 'application/json' },
                jsonData: { QueueJSON: '[' + item.JSON + ']' },
                scope: this,
                success: function (response, opts) {

                    objResponse = response.responseObject;

                    if (objResponse.success) {

                        // if successful, remove else mark as errored
                        if (objResponse.ids.indexOf(item.Id) >= 0) {
                            this.remove(item.Id, this.DelayTaskBasedOnItems, this);
                        } else {
                            this.SetItemsStatus(item.Id, this.Statuses.Errored, this.DelayTaskBasedOnItems);
                        }

                    } else {

                        console.error("Unable to Process Response object", objResponse.trace);

                        // assume they all errored since successful ones will be removed
                        this.SetItemsStatus(item.Id, this.Statuses.Errored, this.DelayTaskBasedOnItems);

                    }

                },
                failure: fnCantSend
            });

        } else {
            fnCantSend();
        }

    },

    SetItemsStatus: function (msgId, status, callback) {

        DataFunc.executeSQL({
            sql: "UPDATE MessageQueue SET Status=" + status + " WHERE Id='" + msgId + "'",
            scope: this,
            success: function () {
                if (callback) { callback.apply(this); }
            },
            failure: function (tx, ex) {
                console.error('Error setting message status', ex.message);
                if (callback) { callback.apply(this); }
            }
        });

    },

    DelayTaskBasedOnItems: function () {
        var counts, intDelay;

        // check if have the send task (won't if error creating table in constructor
        if (this.SendMessagesToServer) {

            DataFunc.executeSQL({
                sql: 'SELECT SUM(New) AS TotalNew, COUNT(*) AS Total FROM (SELECT CASE WHEN Status=' + this.Statuses.New
                + ' THEN 1 ELSE 0 END AS New FROM MessageQueue)',
                scope: this,
                success: function (tx, results) {

                    counts = results.rows.item(0);

                    // check if there are any messages
                    if (counts.Total > 0) {

                        // get the delay based on if any new messages
                        intDelay = (counts.TotalNew) ? this.getNewDelay() : this.getOldDelay();

                        // send the messages with delay
                        this.SendMessagesToServer.delay(intDelay);

                    }

                },
                failure: function (tx, ex) {

                    // Default to sending more often
                    console.error('DelayTaskBasedOnItems() Error: ', ex.message);
                    this.SendMessagesToServer.delay(this.getNewDelay());

                }
            });

        }

    },

    getCount: function (callback, scope, type) {
        var strSQL, count;

        if (!type) {
            strSQL = 'SELECT COUNT(*) FROM MessageQueue';
        } else {
            strSQL = 'SELECT COUNT(*) FROM MessageQueue WHERE Type=' + type;
        }

        DataFunc.executeSQL({
            sql: strSQL,
            scope: this,
            success: function (tx, results) {

                count = DataFunc.GetScalarValue(results);

                // if getting the number of data entries, update the badge
                if (type === this.Types.DataEntry) {
                    VIPSMobile.Main.getApplication().fireEvent('setBadgeText', 'Data', count);

                    if (count >= 5) {
                        Ext.Msg.alert(VIPSMobile.getString('Queue Warning'), 'Your queue might be close to full, it has ' + count + ' data entry items on it \n please go online and sync these entries before saving more entries or contact VIPS customer support.');
                    }

                }

                if (callback) { callback.apply(scope || this, [count]); }

            },
            failure: function () {
                if (callback) { callback.apply(scope || this, [null]); }
            }
        });

    },

    add: function (type, params, isFailTry) {
        var id, lngMailbox, json;

        this.getCount(function (count) {

            // get the next id and increment the counter
            id = this.getNextMessageId();

            // for errors, might not have a user yet
            if (VIPSMobile.User && VIPSMobile.User.getMailbox()) {
                lngMailbox = VIPSMobile.User.getMailbox();
            } else {
                lngMailbox = 61355555; // use admin box to use it's test mode setting
            }

            // get the json message string
            json = JSON.stringify({
                id: id,
                isApp: !!(VIPSMobile.Conn.SQLPlugin),
                mailbox: lngMailbox,
                params: params,
                saveDate: DataFunc.getUTCdate(),
                type: type,
                version: VIPSMobile.Version.get(),
                os: iOSversion().join('')
            });

            // add the message to the db
            DataFunc.executeSQL({
                sql: 'INSERT INTO MessageQueue (Id, Type, JSON, Status) VALUES (?, ?, ?, ?); SELECT last_insert_rowid();',
                params: [id, type, json, this.Statuses.New],
                scope: this,
                success: function (a, res) {

                    if(!res.insertId && !isFailTry) {
                        this.add(type, params, true);
                    } else {
                        // update the data badge
                        this.getCount(null, null, this.Types.DataEntry);
    
                        // submit the next message
                        this.DelayTaskBasedOnItems();
                    }
                },
                failure: function (tx, ex) {

                    if (!isFailTry) {
                        // clear the non Data and try to save again
                        this.clearNonDataEntry(function () {
                            this.add(type, params, true);
                        }, this);

                        console.error('Error adding item to message queue, items on queue ' + count, ex.message);

                    } else {
                        Ext.Msg.alert(VIPSMobile.getString('Queue Error'), 'Error sending Entry to VIPS, your queue might be full items on queue ' + count + ', \n this entry has not been saved\n\n\n' + ex.message);
                    }

                }
            });

        }, this);

    },

    getNextMessageId: function () {

        // prepend the mobile id and return
        return VIPSMobile.User.getMobileID() + '-' + new Date().getTime();

    },

    clear: function () {

        DataFunc.executeSQL({
            sql: 'DELETE FROM MessageQueue',
            scope: this,
            success: function () {

                // update the data badge
                this.getCount(null, null, this.Types.DataEntry);

            },
            failure: function (tx, ex) {
                console.error('Error clearing message queue', ex.message);
            }
        });

    },

    clearNonDataEntry: function (callback, scope) {

        DataFunc.executeSQL({
            sql: "DELETE FROM MessageQueue WHERE Type != 5",
            scope: this,
            success: function () {

                // update the data badge
                this.getCount(null, null, this.Types.DataEntry);

                if (callback) {
                    callback.apply(scope || this);
                }

            }
        });

    },

    remove: function (vId, callback, scope) {

        DataFunc.executeSQL({
            sql: "DELETE FROM MessageQueue WHERE Id='" + vId + "'",
            scope: this,
            success: function () {

                // update the data badge
                this.getCount(null, null, this.Types.DataEntry);

                if (callback) { callback.apply(scope || this); }

            },
            failure: function (tx, ex) {
                console.error('Error removing message from queue', ex.message);
                if (callback) { callback.apply(scope || this); }
            }
        });

    }   

});
