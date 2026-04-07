//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.controller.Settings', {
    extend: 'Ext.app.Controller',

    config: {

        models: ['ChangeLogItem', 'ConsoleLogItem', 'DataQueueItem', 'DBTableItem'],
        stores: ['ChangeLog', 'ConsoleLogItems', 'DataQueueItems', 'DBTableItems'],

        views: [
            'settings.ChangeLog',
            'settings.ConsoleLog',
            'settings.DataQueue',
            'settings.DBTables',
            'settings.Location',
            'settings.Overview',
            'settings.Profile'
        ],

        routes: {
            'Settings': 'route',
            'Settings/:page': 'route'
        },

        refs: {
            overview: {
                selector: '#SettingsOverview'
            },
            consoleLog: {
                selector: '#SettingsConsole'
            },
            dbTables: {
                selector: '#SettingsDBTables'
            },
            dataQueue: {
                selector: '#SettingsQueue'
            },
            location: {
                selector: '#SettingsLocation'
            },
            profile: {
                selector: '#SettingsProfile'
            }
        }

    },

    setup: function () {

        VIPSMobile.User.on('uploadschanged', this.onUpDownloadsChange, this);
        VIPSMobile.User.on('downloadschanged', this.onUpDownloadsChange, this);

    },

    route: function (page) {

        // setup app if needed
        VIPSMobile.Main.SetupApplication(this, function () {

            switch (page) {
                case 'ChangeLog': VIPSMobile.Main.showView(this, 'VIPSMobile.view.settings.ChangeLog'); break;
                case 'Console': VIPSMobile.Main.showView(this, 'VIPSMobile.view.settings.ConsoleLog'); break;
                case 'DBTables': this.showAdminTables(); break;
                case 'Location': this.showLocation(); break;
                case 'Profile': this.showProfile(); break;
                case 'Queue': this.showDataQueue(); break;
                default: this.showOverview(); page = ''; break;
            }

        });

    },

    showOverview: function () {
        var view, values;

        // show the overview
        view = VIPSMobile.Main.showView(this, 'VIPSMobile.view.settings.Overview');

        // get all the user settings
        values = VIPSMobile.User.getAllSettings();

        // set the calculated values for the view
        if (VIPSMobile.User.getTestMode()) { values.Mailbox += ' (test mode)'; }
        if (values.SyncFrequency < 0) {
            values.SyncFrequency = view.down('sliderfield[name="SyncFrequency"]').getMaxValue();
        }
        view.setValues(values);

        // set value for up/download
        this.onUpDownloadsChange();

        // hide data options if no data tab
        if (VIPSMobile.User.getTabs().indexOf('D') < 0) {
            view.down('field[name="OnActionNext"]').destroy();
        }

        // destroy testing controls if not on testing or development
        if (VIPSMobile.site.lvl > 0.8) {
            view.down('button[func="ChangeLog"]').destroy();
            view.down('field[name="DebugInfo"]').destroy();
            //view.down('field[name="Profile"]').destroy();
        }

        this.onSliderfieldChange(view.down('field[name="SyncFrequency"]'));

    },

    onFontSizeChange: function (selectField, newValue, oldValue) {

        // ignore any events until it's painted since gets fired during setup
        if (selectField.isPainted()) {

            // remember the size
            VIPSMobile.User.setFontSize(newValue);
            VIPSMobile.User.save();

        }

    },

    onProfileChange: function (selectField, newValue, oldValue) {

        // ignore any events until it's painted since gets fired during setup
        if (selectField.isPainted() && VIPSMobile.User.getProfile() !== newValue) {

            // remember the selected profile
            VIPSMobile.User.setProfile(newValue);
            VIPSMobile.User.save();

            // ask user if want to reload
            Ext.Msg.confirm('Change Profile', 'Application needs to be reloaded to apply the new profile.<br />Reload?', function (btn) {
                if (btn === 'yes') { window.location.reload(); }
            });

        }

    },

    onSliderfieldChange: function (slider) {
        var strSyncText, value;

        value = slider.getValue();

        // god they need to make up their mind if returning a value or an array
        if (Ext.isArray(value)) { value = value[0]; }

        if (value === slider.getMaxValue()) {
            value = -1;
        }

        VIPSMobile.User.setSyncFrequency(value);
        VIPSMobile.User.save();

        if (value < 0) {
            strSyncText = 'never';
        } else if (value > 0) {
            strSyncText = parseInt(value, 10) + ' min';
        } else {
            strSyncText = 'always';
        }

        slider.setLabel('Sync Freq<br /><span class="small">' + strSyncText + '</span>');

    },

    onTogglefieldChange: function (toggle) {

        switch (toggle.getName()) {
            case 'OnActionNext': VIPSMobile.User.setOnActionNext(toggle.getValue()); break;
            case 'DebugInfo': VIPSMobile.User.setDebug(toggle.getValue()); break;
            case 'UseLocation': VIPSMobile.User.setUseLocation(toggle.getValue()); break;
            case 'ShowAsFullScreen': this.showAsFullScreen(toggle.getValue()); break;
            default: console.log('Unhandled toggle field ' + toggle.getName(), toggle); break;
        }

        // save the user
        VIPSMobile.User.save();

    },

    onUpDownloadsChange: function () {
        var transfers;

        // check if overview is displayed
        if (this.getOverview()) {

            transfers = 'U ' + DataFunc.getSizeString(VIPSMobile.User.getUploads()) + ' / D '
                + DataFunc.getSizeString(VIPSMobile.User.getDownloads());

            this.getOverview().setValues({
                Transfers: transfers
            });

        }

    },

    onSetPasswordTap: function () {
        Ext.Msg.prompt('Set Password', 'Enter your new password', this.setPasswordCallback, this, false, '', {
            xtype: 'textfield', inputType: 'tel', cls: 'password', maxLength: 8
        });
    },
    setPasswordCallback: function (btn, value) {
        var params;

        value = (value || '').trim();
        if (btn === 'ok' && value.length > 0) {

            if (Ext.isNumeric(value)) {

                // send request to server
                params = {
                    MobileID: VIPSMobile.User.getMobileID(),
                    Mailbox: VIPSMobile.User.getMailbox(),
                    OldPassword: VIPSMobile.User.getPassword(),
                    NewPassword: value
                };

                Ext.Ajax.request({
                    timeout: 120000,
                    url: VIPSMobile.ServiceURL + 'Login/SetPassword',
                    headers: { 'Content-Type': 'application/json' },
                    jsonData: params,
                    scope: this,
                    success: function (response, opts) {

                        // check if changed on server
                        if (response.responseObject.success) {

                            // update local password
                            VIPSMobile.User.setPassword(response.responseObject.encoded);
                            VIPSMobile.User.save();

                            Ext.Msg.alert('Set Password', 'Password changed successfully');

                        } else {

                            Ext.Msg.alert('Set Password', response.responseObject.reason);

                        }

                    },
                    failure: function (response, opts) {

                        // tell user must be online since most likely error
                        Ext.Msg.alert('Set Password', 'You must be online to change your password.');

                    }
                });

            } else {
                Ext.Msg.alert('Set Password', 'Password must be numeric.');
            }

        }

    },

    onOnlineTap: function () {
        var dteStart, duration, strMsg;

        VIPSMobile.Main.setMask(this, 'Connecting...');

        dteStart = new Date();

        Ext.Ajax.request({
            url: VIPSMobile.ServiceURL + 'Data/HeartBeat',
            headers: { 'Content-Type': 'application/json' },
            jsonData: { Mailbox: VIPSMobile.User.getMailbox() },
            scope: this,
            success: function (response, opts) {

                // calculate the time to get a response in ms
                duration = new Date() - dteStart;

                // set text description based on duration
                if (duration < 1000) {
                    strMsg = VIPSMobile.getString('Communication successful.');
                } else if (duration < 2000) {
                    strMsg = VIPSMobile.getString('Communication slow.');
                } else {
                    strMsg = VIPSMobile.getString('Communication very slow.');
                }

                // add the duration to end of message
                strMsg += '<br />' + duration.toFixed(0) + 'ms';

                VIPSMobile.Main.setMask(this, false);
                Ext.Msg.alert(VIPSMobile.getString('Online Check'), strMsg);

            },
            failure: function (response, opts) {

                VIPSMobile.Main.setMask(this, false);
                Ext.Msg.alert(VIPSMobile.getString('Not Online'), VIPSMobile.getString('Cannot communicate with VIPS'));

            }
        });

    },

    onBackTap: function () {
        this.redirectTo('Settings');
    },

    showLocation: function () {
        var view;

        view = VIPSMobile.Main.showView(this, 'VIPSMobile.view.settings.Location');
        view.setup();

    },

    onProfileUrlTap: function () {
        var view;

        view = VIPSMobile.Main.showView(this, 'VIPSMobile.view.settings.Profile');
        view.setup(this);

    },

    onMarkersTap: function () {

        // create the sort sheet
        this.setSortSheet(Ext.Viewport.add({
            xtype: 'actionsheet',
            defaults: {
                ui: 'action',
                scope: this,
                handler: this.setSort
            },
            items: [{
                text: 'Stores',
                value: 'Stores'
            }]

        }));

        // show the sort sheet
        this.getSortSheet().show();

    },

    onUpdateLocationTap: function () {
        var viewLocation = this.getLocation();

        viewLocation.SetUserPosition();

    },

    onShowDBTablesTap: function () {
        this.redirectTo('Settings/DBTables');
    },

    onDeleteDBFileTap: function () {
        var fn = async function (btn) {
            if (btn === 'yes') {
                const opfsRoot = await navigator.storage.getDirectory();
                const fileHandle = await opfsRoot.getFileHandle("mydb.sqlite3", { create: true });
                const file = await fileHandle.getFile();

                let size;
                // The current size of the file, initially `0`.
                size = file.size;
                const humanFileSize = function(size) {
                    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
                    return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
                }
                console.error('Deleting DB File Size: ', humanFileSize(size));
                                    
                VIPSMobile.CDR.add(VIPSMobile.CDR.Types.ClearInfo);

                // send the current id to clear out all the sync info
                if (VIPSMobile.User.getMobileID()) {
                    VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.Clear, { mobileid: VIPSMobile.User.getMobileID() });
                }

                // clear local storage
                localStorage.clear();
                await fileHandle.remove();

                window.location.reload(true);                
            }
        }
        Ext.Msg.confirm('Delete DB', 'Are you sure you want to delete the local DB file, this will reset all data?', fn)
    },

    showAsFullScreen: function (blnShowFullScreen) {
        var meta,
            addMeta,
            removeMeta,
            head = document.head,
            listFullScreenMetas = ["apple-touch-fullscreen", "mobile-web-app-capable", "apple-mobile-web-app-capable"],
            metas = head.getElementsByTagName('meta');

        addMeta = function (name) {
            if (!metas[name]) {
                meta = document.createElement("meta");

                meta.setAttribute("name", name);
                meta.setAttribute("content", "yes");
                head.appendChild(meta);
            }
        };

        removeMeta = function (name) {
            metas[name].remove();
        }

        // add fullscreen back in for android devices
        if (blnShowFullScreen) {
            listFullScreenMetas.map(addMeta);
        } else {
            listFullScreenMetas.map(removeMeta);
        }

    },

    showAdminTables: function () {
        var strSQL, strSQLs, i;

        VIPSMobile.Main.setMask(this, 'Preparing...');

        DataFunc.executeSQL({
            sql: "SELECT DISTINCT tbl_name as tbl_name FROM SQLITE_MASTER WHERE tbl_name not like '/_%' ESCAPE '/' AND tbl_name NOT IN ('sqlite_sequence', 'SavedReports')",
            scope: this,
            success: function (tx, results) {

                strSQLs = [];
                for (i = 0; i < results.rows.length; i++) {
                    strSQL = 'SELECT \'' + results.rows.item(i).tbl_name + '\' AS TableName, COUNT(*) AS Count ' + 'FROM ' + results.rows.item(i).tbl_name;
                    strSQLs.push(strSQL);
                }

                DataFunc.executeMany({
                    statements: strSQLs,
                    scope: this,
                    callback: this.setTablesStore
                });

            },
            failure: function () {
                VIPSMobile.Main.setMask(this, false);
            }
        });

    },

    setTablesStore: function (statements) {
        var i, intCount, strFullName, strDBName, strTableName;

        this.getDBTableItemsStore().removeAll();

        for (i = 0; i < statements.length; i++) {

            intCount = statements[i].results.rows.item(0).Count;
            strFullName = statements[i].results.rows.item(0).TableName;

            // check if the table is in sql tables (unsynced tables aren't, such as drafts and message queue)
            if (VIPSMobile.SQLTables.exists(strFullName)) {

                // split the tablename up into database name and table name
                strDBName = strFullName.substring(0, strFullName.indexOf('dbo'));
                strTableName = this.formatTableName(strFullName);

                this.getDBTableItemsStore().add({
                    dbName: strDBName,
                    tableName: strTableName,
                    count: intCount,
                    lastSync: this.GetTableLastSync(strFullName)
                });

            }

        }

        this.getDBTableItemsStore().sort();

        VIPSMobile.Main.showView(this, 'VIPSMobile.view.settings.DBTables');

        VIPSMobile.Main.setMask(this, false);

    },

    formatTableName: function (tableName) {
        var intIndex;

        intIndex = tableName.indexOf('dbo');
        if (intIndex > 0) {

            intIndex += 3;

        } else {

            // sometimes pass in sql as table name
            intIndex = tableName.indexOf('FROM');
            if (intIndex > 0) {
                intIndex += 5;
            } else {
                intIndex = 0;
            }

        }

        return tableName.substring(intIndex);

    },

    onDBTablesItemTap: function (list, index) {
        var item, tableName;

        // get the call flow item
        item = list.getStore().getAt(index);
        tableName = item.get('dbName') + '.dbo.' + item.get('tableName');

        Ext.Msg.confirm('Sync Table', 'Would you like to sync this table?', function (btn) {

            if (btn === 'yes') {

                VIPSMobile.Sync.doSync({
                    tableName: tableName,
                    forceSync: true,
                    scope: this,
                    callback: function (vTableName, vParams, vSyncRecords) {

                        // update the list item
                        DataFunc.executeSQL({
                            sql: 'SELECT COUNT(*) AS Count FROM ' + vTableName,
                            scope: this,
                            success: function (tx, results) {

                                item.set({
                                    count: DataFunc.GetScalarValue(results),
                                    lastSync: this.GetTableLastSync(tableName)
                                });

                            }
                        });

                        // show message of records count
                        Ext.Msg.alert('Sync Table', 'Updated ' + vSyncRecords.length + ' records.');

                    }

                });

            }

        }, this);

    },

    GetTableLastSync: function (tableName) {
        var lastSync, datLast, strReturn;

        // Get the last sync time
        lastSync = VIPSMobile.SQLTables.get(tableName).getLastSync();

        if (lastSync !== 0) {

            // convert the integer representation to a date
            datLast = Ext.Date.parseDate(lastSync, DataFunc.DATE_FORMAT);

            // convert UTC date to local time
            datLast.setHours(datLast.getHours() - datLast.getTimezoneOffset() / 60);

            // format the date
            strReturn = Ext.Date.format(datLast, 'j M G:i');

        } else {

            strReturn = 'never';

        }

        return strReturn;

    },

    onChangeLogTap: function () {
        this.redirectTo('Settings/ChangeLog');
    },

    onClearInfoTap: function () {

        Ext.Msg.confirm('Clear Info', 'This will reset the entire application.  Continue?', function (btn) {

            if (btn === 'yes') {
                DataFunc.ClearInfo();
            }

        }, this);

    },

    onConsoleLogTap: function () {
        this.redirectTo('Settings/Console');
    },

    onFilterTap: function (field) {
        var store;

        // create the filter options sheet if needed
        if (!this.getConsoleLog().sortSheet) {

            this.getConsoleLog().sortSheet = Ext.Viewport.add({
                xtype: 'actionsheet',
                defaults: {
                    scope: this,
                    handler: this.onFilterTap
                },
                items: [{
                    text: 'Debug',
                    ui: 'confirm',
                    value: VIPSMobile.util.Console.levels.debug
                }, {
                    text: 'Log',
                    value: VIPSMobile.util.Console.levels.log
                }, {
                    text: 'Warn',
                    ui: 'action',
                    value: VIPSMobile.util.Console.levels.warn
                }, {
                    text: 'Error',
                    ui: 'decline',
                    value: VIPSMobile.util.Console.levels.error
                }]
            });

        }

        if (!field.config.value) {

            this.getConsoleLog().sortSheet.show();

        } else {

            VIPSMobile.util.Console.setMinLevel(field.config.value);

            store = this.getConsoleLogItemsStore(); // Ext.getStore('ConsoleLogItems');
            store.clearFilter();
            store.filterBy(function (msg) {
                return msg.get('level') >= field.config.value;
            });

            //this.getContainer().setActiveItem(this.getMenu());
            this.getConsoleLog().sortSheet.hide();

        }

    },

    onSubmitLogTap: function () {
        var log;

        // confirm the submit
        Ext.Msg.confirm('Submit Log', 'This will send a copy of your log file to VIPS.  Proceed?', function (btn) {

            if (btn === 'yes') {

                // put all the unsubmitted messages into an array
                log = [];
                Ext.iterate(this.getConsoleLogItemsStore().getData().all, function (msg) {

                    if (!msg.get('submitted')) {
                        log.push(msg.data);
                        msg.set('submitted', true);
                    }

                }, this);

                if (log.length > 0) {
                    VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.Console, log);
                    Ext.Msg.alert('Submit Log', 'Sent log to VIPS');
                } else {
                    Ext.Msg.alert('Submit Log', 'No new messages to send.');
                }

            }

        }, this);

    },

    onDataQueueTap: function () {
        this.redirectTo('Settings/Queue');
    },

    showDataQueue: function () {
        var i, cf, item, strText, store;

        store = this.getDataQueueItemsStore();
        store.removeAll();

        // Queue is Async now
        VIPSMobile.MsgQueue.getItems(function (items) {

            // loop through each item in the queue
            for (i = 0; i < items.length; i++) {

                //item = VIPSMobile.MsgQueue.getAt(i);
                item = JSON.parse(items[i].JSON);

                strText = '';
                switch (item.type) {
                    case VIPSMobile.MsgQueue.Types.CDR:
                        break;
                    case VIPSMobile.MsgQueue.Types.Clear:
                        break;
                    case VIPSMobile.MsgQueue.Types.LibPathVisited:
                        break;
                    case VIPSMobile.MsgQueue.Types.Console:
                        if (item.params.method === 'error' || VIPSMobile.User.getDebug()) {
                            strText = "[" + item.params.method + "] " + item.params.arguments;
                        }
                        break;
                    case VIPSMobile.MsgQueue.Types.DataEntry:
                        cf = VIPSMobile.CallFlows.get([item.params.startNodeID]);
                        if (cf) {
                            strText = cf.getDescription();
                        } else {
                            strText = item.params.startNodeID;
                        }

                        strText += ': ' + this.GetDataEntryDate(item);

                        break;
                    case VIPSMobile.MsgQueue.Types.MsgStatus:
                        strText = 'Message Status: ' + item.params.newStatus;
                        break;
                    case VIPSMobile.MsgQueue.Types.NewMessage:
                        strText = item.params.subject;
                        break;
                    default:
                        strText = item.id;
                        break;
                }

                if (strText !== '') {
                    store.add({
                        text: strText,
                        type: VIPSMobile.MsgQueue.Types[item.type],
                        id: item.id
                    });
                }
            }

            if (store.getCount() === 0) {

                store.add({
                    text: 'No items in queue',
                    type: ''
                });

            }

            VIPSMobile.Main.showView(this, 'VIPSMobile.view.settings.DataQueue');
        }, this);


    },

    // when a queue item is selected ask if it should be removed from the Queue
    onRemoveFromQueueItemTap: function (list, index, ctn, record) {

        // deslect the record so the select event will fire again if the record is not removed.
        list.deselect(record);

        Ext.Msg.confirm('Delete', 'Remove ' + record.get('text') + ' from queue',
            function (btn) {

                if (btn === 'yes') {

                    console.log('removed', record);

                    VIPSMobile.MsgQueue.remove(record.data.id);
                    list.getStore().remove(record);

                }

            });

    },

    // Get the entry date or save time for the data entry
    GetDataEntryDate: function (item) {
        var saveDate, txtReturn;

        // always have saveDate is in UTC timezone
        // so neet to parse it as such
        var textDate = item.saveDate.toString();
        saveDate = new Date(Date.UTC(textDate.substring(0, 4), textDate.substring(4, 6) - 1, textDate.substring(6, 8), textDate.substring(8, 10), textDate.substring(10, 12), textDate.substring(12, 14)))
        //saveDate = Ext.Date.parseDate(item.saveDate, DataFunc.DATE_FORMAT);
        txtReturn = 'Saved ' + Ext.Date.format(saveDate, 'y/m/d G:i:s');

        return txtReturn;

    },

    onClearQueueTap: function () {

        // show the message
        Ext.Msg.confirm(
            'Clear Queue',
            'Are you sure, this will delete any unsubmitted entries?',
            function (btn) {

                if (btn === 'yes') {
                    VIPSMobile.MsgQueue.clear();
                    this.onDataQueueTap();
                }

            },
            this
        );

    },

    onSendQueueTap: function () {

        VIPSMobile.Main.setMask(this, 'Loading...');

        VIPSMobile.MsgQueue.clearNonDataEntry(function () {

            console.error("Manually Submitting Queue");

            DataFunc.executeSQL({
                sql: "UPDATE MessageQueue SET Status=" + VIPSMobile.MsgQueue.Statuses.New + " WHERE Type=5 OR Status=2",
                scope: this,
                success: function () {
                    VIPSMobile.MsgQueue.setShowProgress(this);
                },
                failure: function (tx, ex) {
                    console.error('Error setting message status', ex.message);
                }
            });

        }, this);

    },

    onLocationTap: function () {
        this.redirectTo('Settings/Location');
    },

    onShowMarkerTap: function (btn) {
        var markers, row, mapBounds, anim, i;

        if (this.getLocation().HasMarkers(btn.table)) {

            this.getLocation().ClearMarkers(btn.table);

        } else {

            if (btn.table === 'me') {

                this.getLocation().SetUserPosition();

            } else {

                // get the position for all the markers
                DataFunc.executeSQL({
                    sql: 'SELECT * FROM VIPSdboStores',
                    scope: this,
                    success: function (tx, results) {

                        mapBounds = this.getLocation().map.getMap().getBounds();

                        // put all the markers into an array
                        markers = [];
                        for (i = 0; i < results.rows.length; i++) {

                            row = results.rows.item(i);

                            // drop the pin if in bounds
                            if (mapBounds.contains({ lat: row.Latitude, lng: row.Longitude })) {
                                anim = 'drop';
                            } else {
                                anim = null;
                            }

                            markers.push({
                                title: row.Name,
                                colour: 'red',
                                anim: anim,
                                info: row.Name + '<br />' + row.Address1 + '<br />' + row.Suburb + '<br />' + row.State,
                                location: {
                                    lat: row.Latitude,
                                    lon: row.Longitude
                                }
                            });

                        }

                        this.getLocation().SetMarkers(btn.table, markers);

                    }

                });

            }

        }

    },

    onSaveProfileTap: function () {
        var ImageSrc = this.getProfile().value,
            img, c, c2, ctx, ctx2, strSrc,
            me = this;

        img = document.createElement('img');
        img.onload = function (e) {
            c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;

            c2 = document.createElement('canvas');
            c2.width = 128;
            c2.height = 128;

            ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);

            ctx2 = c2.getContext('2d');
            ctx2.drawImage(c, 0, 0, c.width, c.height, 0, 0, c2.width, c2.height);

            strSrc = c2.toDataURL("image/jpeg", 0.8);

            console.log(strSrc);

            VIPSMobile.User.setProfileUrl(strSrc);

            me.onBackTap();

        };
        img.src = ImageSrc;

    },

    CalculateRoute: function (origin, destination, waypoints) {
        var me, i, service, request;

        me = this;

        // dummy test data
        origin = { lat: -37.91621, lon: 145.0597 };
        destination = { lat: -37.92621, lon: 145.1196 };
        waypoints = [
            { lat: -38.00452, lon: 145.136 },
            { lat: -37.99932, lon: 145.1056 },
            { lat: -37.9139, lon: 145.1219 },
            { lat: -37.93768, lon: 145.1024 },
            { lat: -37.87536, lon: 145.1578 },
            { lat: -37.91186, lon: 145.1093 },
            { lat: -37.99635, lon: 145.1057 },
            { lat: -37.97434, lon: 145.1123 }
        ];

        // convert the waypoints to LatLong objects
        for (i = 0; i < waypoints.length; i++) {
            waypoints[i] = { location: { lat: waypoints[i].lat, lng: waypoints[i].lon }, stopover: true };
        }
        origin = { lat: origin.lat, lng: origin.lon };
        destination = { lat: destination.lat, lng: destination.lon };

        request = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING, //google.maps.TravelMode.BICYCLING, google.maps.TravelMode.WALKING, google.maps.TravelMode.TRANSIT
            //transitOptions: TransitOptions,
            unitSystem: google.maps.UnitSystem.METRIC,
            waypoints: waypoints,
            optimizeWaypoints: true,
            //  provideRouteAlternatives: true,
            //  avoidHighways: false,
            //  avoidTolls: false
            region: 'Australia'
        };

        // send request and render on response
        service = new google.maps.DirectionsService();
        service.route(request, function (results, status) {

            if (status === 'OK') {
                me.getLocation().mapRenderer.setDirections(results);
            } else {
                console.log("Couldn't render route: " + status);
            }

        });

    },

    getHelpCategories: function (view) {
        var categories, viewClass;

        categories = [];

        // add the view name
        viewClass = Ext.getClassName(view);
        viewClass = viewClass.substring(viewClass.indexOf('view') + 5);
        categories.push(viewClass);

        // add the default controller category
        categories.push('Settings');

        return categories;

    }

});
