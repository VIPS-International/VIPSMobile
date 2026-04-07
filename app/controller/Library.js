//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.controller.Library', {
    extend: 'Ext.app.Controller',

    requires: ['VIPSMobile.SQLTables'],

    config: {

        models: ['LibraryItem'],
        stores: ['LibraryItems'],

        views: [
            'library.Detail',
            'library.Menu'
        ],

        routes: {
            'Library': 'showLibrary',
            'Library/:path': { action: 'showLibrary' },
            'Library/:path/:itemId': { action: 'showItem', conditions: { ':itemId': '[0-9]+' } }
            //,'Library/:path/:itemId/:pageNo': { action: 'showItem', conditions: { ':path': '[0-9a-zA-Z_]+', ':itemId': '[0-9]+', ':pageNo': '[0-9]+' } }
        },

        refs: {
            detail: {
                selector: '#librarydetail'
            },
            main: {
                selector: '#mainview'
            },
            menu: {
                selector: '#libraryMenu'
            }
        },

        PDFjsLoaded: null,

        RecentFiles: [],
        NewFiles: []

    },

    setup: function () {

    },

    onRefreshTap: function (btn) {
        var me = this,
            store = Ext.getStore("LibraryItems");

        VIPSMobile.Main.setMask(this, "Loading...");

        if (store) {
            store.suspendEvents();
            store.data.clear();
            store.resumeEvents();
        }

        Ext.defer(function () {

            if (me.getMenu().getStore().getCount() === 0) {
                me.getMenu().getStore().setProxy({
                    type: 'ajax',
                    url: VIPSMobile.ServiceURL + 'Library/GetLibrary/?Mailbox=' + VIPSMobile.User.getMailbox()
                });
            }

            me.getMenu().getStore().load({
                callback: function () {

                    // AM - UPDATED iframe in VIPSMobile App, after the linking overide stopped working
                    var fnLoop = function (item) {
                        Ext.iterate(item.childNodes, fnLoop);

                        if (item.data.contents && item.data.contents.indexOf("<iframe") !== -1 && Ext.browser.name !== "Chrome") {
                            var x = item.data.contents
                            var regEx = new RegExp("[0-9a-zA-Z]+\\?", "gi");                            
                            if (x.match(regEx)) {
                                var strContents = x.replace(/<iframe .*<\/iframe>/, `<a target="_blank" href="https://youtu.be/` + x.match(regEx) + `"><h1 style="font-size: 72px"><i class="fab fa-youtube-square"></i></h1> View in device browser</a>`);
                                item.data.contents = strContents;
                            } else {
                                item.data.contents = x.replace("<iframe", `<a target="_blank"`).replace(`src="`, `href="`).replace('</iframe', '<h1 style="font-size: 72px"><i class="fab fa-youtube-square"></i></h1> View in device browser</a');
                            }
                            console.debug(item.data.contents);                            
                        }

                    }; 

                    Ext.iterate(me.getMenu().getStore().getRange(), fnLoop);

                    me.getMenu().getStore().sort([{
                        property: 'group',
                        direction: 'ASC'
                    }, {
                        property: 'sortorder',
                        direction: 'ASC'
                    }, {
                        property: 'text',
                        direction: 'ASC'
                    }]);

                    VIPSMobile.Main.setMask(me, false);
                }
            });

        }, 20, this);

    },

    onMenuBackTap: function (btn) {
        var me = this,
            nestedList = this.getMenu()

        nestedList.onBackTap();

        setTimeout(function () {
            console.log(nestedList, nestedList.getBackButton()._hidden);
            me.getMain().down('#MenuBack').setHidden(nestedList.getBackButton()._hidden);
        }, 200);

    },

    getCurrentPath: function () {
        var path;

        path = window.location.hash;
        if (path.indexOf('/') > 0) {
            path = path.substring(path.indexOf('/') + 1);
        } else {
            path = '';
        }

        return path;

    },

    showLibrary: function () {

        // setup app if needed
        VIPSMobile.Main.SetupApplication(this, function () {

            var menu = VIPSMobile.Main.showView(this, 'VIPSMobile.view.library.Menu');
            menu.setup(this);

            //// refresh the library
            this.onRefreshTap();

        }); //calls this.setup      

    },

    GetLibraryItems: function (path, callback) {

        callback.apply(this);

    },

    SetLibrary: function (path, results) {
        console.error('SetLibrary');
    },

    convertSqlItemToLibraryItem: function (item) {
        console.error('convertSqlItemToLibraryItem');

    },

    checkForNewItems: function (item) {
        console.error('checkForNewItems');

    },

    markPathAsVisited: function (obj, list, index, target, item, e, eOpts) {
        var href, data, path;

        if (item.get) {
            data = item.data;
        }

        path = data.path;

        if (data.filename) {
            path = data.filename;
        }

        // send message to server
        VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.LibPathVisited, {
            path: path,
            visitedAt: DataFunc.getUTCdate()
        });

    },

    getRecentFileIds: function () {
        console.error('getRecentFileIds');

    },

    getNewFileIds: function () {
        console.error('getNewFileIds');

    },

    onRecentFilesButtonTap: function () {
        var lstIds;

        // get the ids for the saved reports
        lstIds = this.getRecentFiles();

        if (lstIds.length > 0) {

            this.ShowSheet(lstIds, this.ShowRecentFile);

        } else {

            // no saved reports
            Ext.Msg.alert(VIPSMobile.getString('Recent Files'), VIPSMobile.getString('No files have been viewed.'));

        }

    },

    onNewFilesButtonTap: function () {
        var lstIds;

        // get the ids for the saved reports
        lstIds = this.getNewFiles();

        if (lstIds.length > 0) {

            this.ShowSheet(lstIds, function (btn) {
                this.ShowRecentFile(btn);
                // add item to recent items list
                if (btn.item) {
                    btn.item.id = btn.item.ID;
                    this.SaveRecentFile({ data: btn.item });
                }
            });

        } else {

            // no saved reports
            Ext.Msg.alert(VIPSMobile.getString('Recent Files'), VIPSMobile.getString('No files have been viewed.'));

        }

    },


    ShowSheet: function (lstIds, handler) {
        var i, button, item;

        // create the sheet if needed
        if (!this.getMenu().sortSheet) {

            this.getMenu().sortSheet = Ext.Viewport.add({
                xtype: 'actionsheet',
                hidden: true,
                defaults: {
                    ui: 'action',
                    scope: this,
                    handler: handler
                }
            });

        } else {
            this.getMenu().sortSheet.removeAll();
        }

        // loop through all the files
        for (i = 0; i < lstIds.length; i++) {

            try {
                item = JSON.parse(lstIds[i].item);
            } catch (e) {
                item = lstIds[i];
            }

            // add button to sheet
            button = this.getMenu().sortSheet.add({
                text: item.Filename,
                ui: 'confirm'
            });
            button.item = item;

        }

        // add button to sheet
        this.getMenu().sortSheet.add({
            text: 'Cancel',
            ui: 'decline'
        });

        this.getMenu().sortSheet.show();
    },

    // show the saved report clicked on from action sheet
    ShowRecentFile: function (btn) {

        this.getMenu().sortSheet.hide();

        // show the report if not Cancel
        if (btn.item) {
            this.DisplayItem(btn.item);
        }

    },

    onLibraryMenuItemTap: function (list, index) {
        console.error('onLibraryMenuItemTap');

    },

    DisplayItem: function (obj, list, index, target, item, e, eOpts) {
        var href, data;

        if (item.get) {
            data = item.data;
        }

        obj.setDetailCard(false);

        if (data.contents) {

            obj.setDetailCard({
                xtype: 'LibraryDetail'
            });

            obj.getDetailCard().setHtml(data.contents);

        } else {

            VIPSMobile.Main.setMask(this, 'Loading...');

            href = data.path + '\\' + data.filename;
            href = VIPSMobile.ServiceURL + 'Files/' + VIPSMobile.User.getMailbox() + '/10/' + data.MetaID;

            this.DoClickEvent(href, true);

            VIPSMobile.Main.setMask(this, false);

        }
    },

    DoClickEvent: function (href, inBlank) {
        var link, clickevent;

        VIPSMobile.Main.setMask(this, 'Loading...');
        Ext.defer(function () { VIPSMobile.Main.setMask(this, false); }, 2000, this);

        link = Ext.getDom('hidden_link');
        clickevent = new MouseEvent('click');

        link.target = (inBlank) ? "_blank" : "";
        link.href = href;

        console.log("link", link);
        clickevent.initEvent('click', true, false);
        link.dispatchEvent(clickevent);

    },

    OnDownloadClick: function (item) {
        var link = Ext.getDom('hidden_link'),
            clickevent = new MouseEvent('click');

        console.log(arguments);

        //if (Ext.os.is('ios')) {
        //    link.href = "file.html#" + item.Contents;
        //} else {
        link.href = item.Contents;
        //}

        link.download = item.Filename;

        clickevent.initEvent('click', true, false);
        link.dispatchEvent(clickevent);

    },

    SaveRecentFile: function (item) {
        var lstSQL, strItem, fileId;

        if (item.get) {
            item = item.data;
        }

        lstSQL = [];
        fileId = item.id || item.ID;
        strItem = JSON.stringify(item);

        // delete any reports above maximum number
        lstSQL.push({
            sql: 'DELETE FROM RecentFiles WHERE ROWID NOT IN (SELECT ROWID FROM RecentFiles ORDER BY VisitTime DESC LIMIT 10) OR item=?',
            params: [strItem]
        });

        // add this report to the table
        lstSQL.push({
            sql: 'INSERT INTO RecentFiles (item, fileId , VisitTime) VALUES (?, ?, ?)',
            params: [strItem, fileId, DataFunc.getdate()]
        });

        DataFunc.executeMany({
            statements: lstSQL,
            scope: this,
            callback: function () {
                this.getRecentFileIds();
                this.getNewFileIds();
            }
        });
    },

    gotoFolder: function (folder) {
        console.log('gotoFolder');

    },

    showItem: function (path, itemId) {
        console.log('showItem');

    },

    onDetailBackTap: function () {
        console.log('onDetailBackTap');

    },

    onPrevPageTap: function () {
        console.log('onPrevPageTap');


    },

    onNextPageTap: function () {
        console.log('onNextPageTap');

    },

    getHelpCategories: function (view) {
        var categories, viewClass;

        categories = [];

        // add the view name
        viewClass = Ext.getClassName(view);
        viewClass = viewClass.substring(viewClass.indexOf('view') + 5);
        categories.push(viewClass);

        // add the default controller category
        categories.push('Library');

        return categories;

    }

});
