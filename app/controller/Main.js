//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.controller.Main', {
    extend: 'Ext.app.Controller',

    requires: [
        'VIPSMobile.CDR',
        'VIPSMobile.MsgQueue',
        'VIPSMobile.SQLTables',
        'VIPSMobile.util.Console',
        'VIPSMobile.util.DataFunc',
        'VIPSMobile.util.ChartFunc',
        'VIPSMobile.util.SyncObject',
        'VIPSMobile.Version'
    ],

    config: {

        routes: {
            'main': 'showMain'
        },

        views: [
            'Login',
            'Main',
            'Fullscreen'
        ],

        refs: {
            content: {
                selector: '#content'
            },
            contentDivider: {
                selector: '#contentDivider'
            },
            fullscreenButton: {
                selector: '#fsbutton'
            },
            fullscreenToggle: {
                selector: '#fstoggle'
            },
            help: {
                selector: '#helpContainer'
            },
            leftContent: {
                selector: '#leftcontent'
            },
            login: {
                selector: '#loginview'
            },
            main: {
                selector: '#mainview'
            },
            rightContent: {
                selector: '#rightcontent'
            },
            titlebar: {
                selector: '#headingtb'
            },
            titlebarLeft: {
                selector: '#leftcontenttb'
            },
            titlebarRight: {
                selector: '#rightcontenttb'
            },
            toolbar: {
                selector: '#sectionstb'
            }
        },

        currentSection: '',
        currentView: null,
        helpCategory: 'Junk',// set to something so that update function is called on startup
        geo: null,
        lastSectionHash: {},
        location: {
            lastUpdate: null
            , latitude: null
            , longitude: null
            , speed: null
            , accuracy: null
        },
        log: [],
        logIndex: -1,
        logLastTime: null,
        masks: {},
        Uri: '',
        usingMultiPanel: null,
        audioAlert: false,
        hasSetupAudioAlert: false

    },

    LOG_MAX_LENGTH: 100,

    // set some basic app info on startup
    init: function () {
        var me, href;

        // set reference to this on app
        VIPSMobile.Main = this;
        VIPSMobile.log = this.addLog;

        // check if logged in to beta or testing
        href = window.location.href.toLowerCase();
        if (href.indexOf('beta') > 0) {
            VIPSMobile.site = { code: 'B', name: VIPSMobile.getString('Beta'), lvl: 0.9 };
        } else if (href.indexOf('testing') > 0) {
            VIPSMobile.site = { code: 'A', name: VIPSMobile.getString('Testing'), lvl: 0.8 };
        } else if (href.indexOf('localhost') > 0) {
            VIPSMobile.site = { code: 'D', name: VIPSMobile.getString('Development'), lvl: 0.7 };
        } else {
            VIPSMobile.site = { code: 'L', name: VIPSMobile.getString('Live'), lvl: 1 };
        }

        // set minimum level for console if on dev or testing
        if (VIPSMobile.site.lvl < 0.9) {
            VIPSMobile.util.Console.setMinLevel(VIPSMobile.util.Console.levels.debug);
        }

        // listen for font size changes
        VIPSMobile.User.on('fontsizechanged', this.setOverallFontSize, this);

        // help links need to be able to call showHelp so make global
        me = this;
        window.showHelp = function (category) { me.showHelp(category); };

    },

    // Called when user successfully logs in
    setup: function (dontNavigate) {
        var i, tabs;

        // create the main view
        Ext.Viewport.add(Ext.create('VIPSMobile.view.Main'));
        this.setOverallFontSize();

        // listen for orientation changes
        Ext.Viewport.on('orientationchange', this.onOrientationChange, this);

        // hide the scrollers for toolbar
        this.getToolbar().getScrollable().getIndicators().x.setActive(false);
        this.getToolbar().getScrollable().useIndicators = { x: false, y: false };

        // listen for changes to the URL hash
        this.updateLandingPage();

        // add login CDR
        VIPSMobile.CDR.setSystemId(VIPSMobile.User.getSystemID());
        VIPSMobile.CDR.add(VIPSMobile.CDR.Types.Login, null, 'VIPSMobile Subscriber Access', 2);


        // add all the tabs allowed to mailbox in given order
        tabs = VIPSMobile.User.getTabs();
        for (i = 0; i < tabs.length; i++) {

            switch (tabs[i]) {
                case 'Z': this.addSection('Dashboard', 'pie-chart fa-solid'); break;
                case 'D': this.addSection('Data', 'compose'); break;
                case 'G': this.addSection('Groups', 'team'); break;
                case 'L': this.addSection('Library', 'bookmarks'); break;
                case 'M': this.addSection('Messages', 'chat'); break;
                case 'O': this.addSection('Orders', 'shop1'); break;
                case 'S': this.addSection('Settings', 'settings'); break;
                case 'X': this.addSection('Log Out', 'power_on'); break;
                default: console.log('Unknown tab "' + tabs[i] + '"');
            }

        }

        // sync messages if needed
        if (tabs.indexOf('M') >= 0) {

            // check for new messages on login
            this.getApplication().getController('Messages').doRefresh(false, true, function () {
                this.setMask('Messages', false);
            });

        }

        if (tabs.indexOf('L') >= 0) {
            // create the recent Files Table
            DataFunc.executeMany({
                statements: [
                    VIPSMobile.SQLTables.CreateTables.RecentFiles
                ]
            });

        }

        // adjust max position so can see whole log out button
        // commented out since it's a hack so probably need to do something to recalculate it properly when all the buttons are painted
        //this.getToolbar().getScrollable().getScroller().maxPosition = { x: 170, y: 1.28125 }

        // create the location object if user is allowed to use it
        this.createGeoObject();

        // listen for events
        this.getApplication().on('setBadgeText', this.setBadgeText, this);
        //this.getFullscreenToggle().on('tap', this.toggleFullscreen, this);
        this.getMain().down('#showhelp').on('tap', this.setupHelp, this);

        // populate the help
        this.populateHelp();

        // show the first tab
        if (!dontNavigate) {
            this.onSectionTap(this.getToolbar().getAt(0));
        }

        // start background tasks
        VIPSMobile.util.BackgroundVerCheck.start();
        VIPSMobile.util.Commands.start();

    },

    createGeoObject: function () {

        // based on the mailbox, set the default location
        switch (parseInt(VIPSMobile.User.getMailbox() / 100000, 10) % 100) {
            case 13: this.setPosition(-37.8136, 144.9631); break;
            case 17: this.setPosition(-27.4667, 153.0333); break;
            case 18: this.setPosition(-34.9290, 138.6010); break;
            case 19: this.setPosition(-31.9522, 115.8589); break;
            case 49: this.setPosition(-36.8406, 174.7400); break;
            default: this.setPosition(-33.8650, 151.2094); break; // default to Sydney
        }

        if (VIPSMobile.Conn.SQLPlugin) {
            var me = this;
            setInterval(function () {
                SQLPlugin.getCurrentPosition().then(function (position) {
                    var coords = position.coords;

                    me.setLocation({
                        lastUpdate: DataFunc.getdate(),
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        speed: coords.speed || 0,
                        accuracy: coords.accuracy || 999
                    });
                });
            }, 30000);
        } else {
            this.setGeo(Ext.create('Ext.util.Geolocation', {
                autoUpdate: true,
                frequency: 30000,
                timeout: 500,
                allowHighAccuracy: true,
                listeners: {
                    locationupdate: {
                        fn: function (geo) {
                            this.setPosition(geo.getLatitude(), geo.getLongitude(), geo.getSpeed(), geo.getAccuracy());
                        },
                        scope: this
                    }
                }
            }));
        }
    },

    setPosition: function (lat, lon, speed, accuracy) {
        console.debug('Got position', lat, lon);
        this.setLocation({
            lastUpdate: DataFunc.getdate(),
            latitude: lat,
            longitude: lon,
            speed: speed || 0,
            accuracy: accuracy || 999
        });
    },

    addLog: function () {
        var index, i, vals;

        index = (VIPSMobile.Main.getLogIndex() + 1) % VIPSMobile.Main.LOG_MAX_LENGTH;
        VIPSMobile.Main.setLogIndex(index);

        vals = [];

        if (VIPSMobile.Main.getLogLastTime()) {
            vals.push(new Date().getTime() - VIPSMobile.Main.getLogLastTime());
        }
        VIPSMobile.Main.setLogLastTime(new Date().getTime());

        for (i = 0; i < arguments.length; i++) {
            vals.push(arguments[i]);
        }

        VIPSMobile.Main.getLog()[index] = vals;

        console.warn('vipslog', vals);

    },

    getLogEntries: function () {
        var index, i, log, vals;

        vals = [];
        for (i = 0; i < VIPSMobile.Main.LOG_MAX_LENGTH; i++) {

            index = (VIPSMobile.Main.getLogIndex() + i + 1) % VIPSMobile.Main.LOG_MAX_LENGTH;
            log = VIPSMobile.Main.getLog()[index];

            if (log !== undefined) {
                vals.push(log);
            }

        }

        return vals;

    },

    // set the site label
    setSiteLabel: function () {
        var lblSite, width;

        lblSite = this.getMain().down('#siteLabel');

        if (lblSite && VIPSMobile.site.code !== 'L') {

            // get the length of the name to adjust top
            width = DataFunc.measureString(VIPSMobile.site.name, lblSite).width;

            // set the site label
            lblSite.setTop(width / 3 + 8);
            lblSite.setHtml(VIPSMobile.site.name);

        } else {

            // destroy the site label
            lblSite.destroy();

        }

    },

    onOrientationChange: function () {
        console.debug('onOrientationChange', Ext.Viewport.getOrientation());
        //this.getApplication().redirectTo(window.location.hash.substring(1));
    },

    useMultiPanels: function (section) {
        var deviceType = (VIPSMobile.User.getProfile() || Ext.os.deviceType).toLowerCase(),
            orientation = Ext.Viewport.getOrientation().toLowerCase(),
            isMulti;

        // get the device type, if desktop, report Tablet or Phone depending on aspect ratio
        if (deviceType === 'desktop') {
            deviceType = (window.innerWidth / window.innerHeight >= 1) ? 'tablet' : 'phone';
        }

        // only multi panel on tablets
        isMulti = (deviceType === 'tablet');

        // check if the orientation bit is set
        isMulti = isMulti && !!(VIPSMobile.User.getMultiPanels() & VIPSMobile.User.MultiPanel[orientation]);

        // check if the orientation bit is set
        section = (section || this.getCurrentSection()).toLowerCase();
        isMulti = isMulti && !!(VIPSMobile.User.getMultiPanels() & VIPSMobile.User.MultiPanel[section]);

        // clear the views if changed
        if (this.getUsingMultiPanel() !== null && this.getUsingMultiPanel() !== isMulti) {
            this.clearView('Left');
            this.clearView('Right');
        }

        // remember the setting
        this.setUsingMultiPanel(isMulti);

        return isMulti;

    },

    setOverallFontSize: function (newValue, oldValue) {

        // if values not passed in, use user values
        if (!newValue) { newValue = VIPSMobile.User.getFontSize(); }

        if (newValue !== oldValue) {

            // set the font size for the main view
            //this.getMain().setStyle('font-size: ' + newValue + '%');
            document.getElementsByClassName('x-body')[0].setAttribute('style', 'font-size: ' + newValue + '%');

        }

    },

    updateHelpCategory: function (newCategory, oldCategory) {
        var btnHelp, i;

        // called on started up so make sure view exists
        if (this.getMain()) {

            // get the help buttons
            btnHelp = this.getMain().query('button[iconCls="help_black"]');

            // show/hide the help buttons
            for (i = 0; i < btnHelp.length; i++) {
                btnHelp[i].setHidden(!newCategory);
            }

        }

    },

    addSection: function (name, icon) {
        var btn;

        // add a button to the toolbar
        btn = this.getToolbar().add({
            text: VIPSMobile.getString(name),
            labelCls: 'font60',
            iconCls: icon,
            iconMask: true,
            iconAlign: 'top',
            listeners: {
                tap: { fn: this.onSectionTap, scope: this }
            }
        });
        btn.section = name;

        return btn;

    },

    // remember the hash tag so that can go to it on loading
    updateLandingPage: function (newURL, oldURL) {

        if (newURL) {

            localStorage[VIPSMobile.Version.getLSPrefix() + 'lastURLHash'] = Ext.encode({
                hash: window.location.hash,
                time: DataFunc.getUTCdate()
            });

        } else {

            if (Ext.feature.has.History) {
                window.addEventListener('hashchange', Ext.bind(this.updateLandingPage, this));
            } else {
                setInterval(Ext.bind(function () {
                    this.updateLandingPage(true);
                }, this), 50);
            }

        }

    },

    // called by routes to make sure the app is setup when navigating from a link
    SetupApplication: function (controller, callback) {

        try {

            // check if have a mailbox
            if (VIPSMobile.User.getMailbox()) {

                // remember the hash for the controller
                this.getLastSectionHash()[controller.getSection()] = window.location.hash.substring(1);

                // if there isn't a main view, need to setup the app
                if (!this.getMain()) {

                    // check if the mailbox and password are still valid
                    this.CheckSavedMailboxLogin(function (valid) {

                        // destroy the loading indicator
                        Ext.fly('appLoadingIndicator').destroy();

                        // check if valid
                        if (valid) {

                            // call set up for main controller and calling controller
                            this.setup(true);

                            // set the current section
                            this.setCurrentSection(controller);

                            controller.vipsInitialized = true;

                            // check if the controller has a setup function
                            if (controller.setup) { controller.setup(); }

                            callback.apply(controller, [true]);

                        } else {

                            // login no longer valid so reload the app from start
                            this.LogOut();

                        }

                    });

                } else {

                    // set the current section
                    this.setCurrentSection(controller);

                    // already set up so just execute call back
                    callback.apply(controller, [false]);

                }

            } else {

                // trying to get to a path without having logged in, clear hash and refresh
                delete localStorage[VIPSMobile.Version.getLSPrefix() + 'lastURLHash'];
                window.location = window.location.origin + window.location.pathname;

            }

        } catch (ex) {

            console.error('Error in Main.SetupApplication()', ex.message);

        }

    },

    // check if the saved mailbox info is still valid
    CheckSavedMailboxLogin: function (callback) {
        var intLineNo;

        try {

            console.debug('Main.CheckSavedMailboxLogin()');

            intLineNo = 1;
            Ext.Ajax.request({
                url: VIPSMobile.ServiceURL + 'Login/ValidLogin',
                headers: { 'Content-Type': 'application/json' },
                jsonData: {
                    Mailbox: VIPSMobile.User.getMailbox(),
                    Password: VIPSMobile.User.getPassword(),
                    MobileID: VIPSMobile.User.getMobileID(),
                    ThemeCommunityNo: localStorage[VIPSMobile.Version.getLSPrefix() + 'themeCommNo'] || 0,
                    ThemeRowVer: localStorage[VIPSMobile.Version.getLSPrefix() + 'themeRowVer'] || '',
                    isReactNative: false,
                    isSenchaMobile: true
                },
                scope: this,
                success: function (response, opts) {

                    // set the user values from returned settings
                    intLineNo = 2;
                    VIPSMobile.User.UpdateLoginSettings(response.responseObject.settings);

                    // execute call back checking result
                    intLineNo = 3;
                    callback.apply(this, [response.responseObject.result === 1]);

                },
                failure: function (response, opts) {

                    // assume it's ok
                    intLineNo = 4;
                    console.log('Failure CheckSavedMailboxLogin()');
                    callback.apply(this, [true]);

                }
            });

        } catch (ex) {

            console.error('Error in Main.CheckSavedMailboxLogin():' + intLineNo, ex.message);

        }

    },

    onSectionTap: function (btn) {
        var controller;

        console.debug('Main.onSectionTap()', btn.section);

        switch (btn.section) {
            case 'Help': this.setupHelp(); break;
            case 'Log Out': this.LogOut(); break;
            default:

                // check if already in that section
                if (this.getCurrentSection() !== btn.section) {

                    // clear the content containers
                    this.getLeftContent().removeAll(true, true);
                    this.getRightContent().removeAll(true, true);

                    // setup controller if not initialized
                    controller = this.getApplication().getController(btn.section);
                    if (controller && !controller.vipsInitialized) {
                        if (controller.setup) { controller.setup(); }
                        controller.vipsInitialized = true;
                    }

                    // redirect to the section, restoring state from last time on tab
                    if (this.getLastSectionHash()[btn.section]) {
                        this.redirectTo(this.getLastSectionHash()[controller.getSection()]);
                    } else {
                        this.redirectTo(btn.section);
                    }

                    // remember the section
                    this.setCurrentSection(btn.section);

                }
                break;

        }

    },

    populateHelp: function () {
        var controller;

        console.debug('Main.populateHelp()');

        // sync the help tables
        VIPSMobile.Sync.doSync({
            tableName: SQLTables.Tables.Help,
            forceSync: true,
            scope: this,
            callback: function () {

                // reset the help section incase it's changed
                controller = this.getApplication().getController(this.getCurrentSection());

                // reset the help if controller found and has set help function
                if (controller && this.getCurrentView()) {
                    this.getControllerHelpCategory(controller, this.getCurrentView());
                }

            }
        });

    },

    setupHelp: function () {

        // reset the history
        this.getHelp().history = [];

        // show the help
        if (this.getHelpCategory()) {
            this.showHelp(this.getHelpCategory());
        }

    },

    showHelp: function (category) {
        var helpText, helpPanel;

        console.debug('Main.showHelp()', category);

        // get the help text for the category
        DataFunc.executeSQL({
            sql: 'SELECT HelpText FROM ' + SQLTables.Tables.Help + ' WHERE Category=\'' + category + '\'',
            scope: this,
            success: function (tx, results) {

                helpText = DataFunc.GetScalarValue(results);
                if (helpText) {

                    helpPanel = this.getHelp();
                    if (helpPanel) {

                        helpPanel.setHtml(helpText);
                        helpPanel.down('button[func="HelpBack"]').setHidden(helpPanel.history.length === 0);
                        helpPanel.history.push(category);

                        helpPanel.show();

                    }

                } else {

                    Ext.Msg.alert(VIPSMobile.getString('Help'), VIPSMobile.getString('No help set for category ' + category));

                }

            },
            failure: Ext.emptyFn
        });

    },

    onHelpBackTap: function () {
        var category;

        if (this.getHelp().history.length > 1) {

            // pop off the current category and the one to show
            this.getHelp().history.pop();
            category = this.getHelp().history.pop();

            // show the previous category
            this.showHelp(category);

        }

    },

    onHelpCloseTap: function (btn) {
        this.getHelp().hide();
    },

    // logout and go to login form
    LogOut: function () {

        console.debug('Main.LogOut()');

        // delete saved hash
        delete localStorage[VIPSMobile.Version.getLSPrefix() + 'lastURLHash'];

        // reload the app, disabling autologin
        window.location.hash = '#Login/';
        window.location.reload(true);

    },

    applyCurrentSection: function (newSection, oldSection) {
        var btn;

        try {

            console.debug('Main.applyCurrentSection()', newSection.id);

            // show the mask for the new section
            this.setMask(newSection);

            // update the toolbar sections
            if (this.getToolbar()) {

                // new section may be a controller
                if (Ext.isObject(newSection)) {
                    newSection = newSection.getSection();
                }

                // unhighlight old section if changed
                if (oldSection && oldSection !== newSection) {
                    btn = this.getToolbar().down('button[section="' + oldSection + '"]');
                    if (btn) { btn.removeCls('x-button-action'); }
                }

                // highlight new section and add cdr record
                btn = this.getToolbar().down('button[section="' + newSection + '"]');
                if (btn && !btn.element.hasCls('x-button-action')) {

                    // add cdr record
                    VIPSMobile.CDR.add(VIPSMobile.CDR.Types.GotoLocation, null, btn.section);

                    // add class to section button
                    btn.addCls('x-button-action');

                    // scroll to the button
                    //var x = btn.element.dom.offsetLeft + btn.element.dom.offsetWidth;
                    //this.getToolbar().getScrollable().getScroller().scrollTo(x, 0);
                    //this.getToolbar().refresh();

                }

            }

            // needs to return the new section for it to be set
            return newSection;

        } catch (ex) {
            console.error('Main.applyCurrentSection() Error', ex.message);
        }

    },

    showView: function (controller, view) {
        var container, containerOther, multiPanel, otherContentFunc, tb;

        // create the view if type passed in
        if (Ext.isString(view)) { view = Ext.create(view); }

        console.debug('Main.showView()', view.$className);

        // check if this should be displayed as multipanel
        multiPanel = this.useMultiPanels();

        // if view doesn't have panel specified, log it and default to full
        if (!view.getPanel || !view.getPanel()) {
            console.log('View missing panel setting', view);
            view.setPanel('full');
        }

        // SF do this
        // passing panel through atm to try and set up tablet interface of index on left, question detail on right for example
        if (view.getPanel() === 'right' && multiPanel) {
            container = this.getRightContent();
            containerOther = this.getLeftContent();
        } else {
            container = this.getLeftContent();
            containerOther = this.getRightContent();
        }

        // if panel is full or profile is always full, hide right and clear it's contents
        if (view.getPanel() === 'full' || !multiPanel) {
            this.getContentDivider().setHidden(true);
            this.getRightContent().setHidden(true);
            this.getRightContent().removeAll(true, true);
        } else {
            this.getContentDivider().setHidden(false);
            this.getRightContent().setHidden(false);
        }

        // clear the content container
        if (container.items.length > 0) {
            container.removeAll(true, true);
        }

        // add the view to the container
        container.add(view);

        // add a handler for all the components in the view
        this.applyHandlerToAllItems(controller, view);

        // apply the titlebar config
        this.getTitlebar().setHidden(multiPanel);
        if (multiPanel) {

            // add a toolbar to the view
            tb = container.add({
                xtype: 'titlebar',
                itemId: container.getItemId() + 'tb',
                docked: 'top',
                height: '2em',
                defaults: {
                    ui: 'action'
                }
            });
            this.setTitlebar(controller, tb, view);

        } else {
            this.setTitlebar(controller, this.getTitlebar(), view);
        }

        // add full screen button
        if (this.getFullscreenButton()) { this.getFullscreenButton().destroy(); }
        if (view.fsButton) {

            this.getMain().add({
                xtype: 'button',
                itemId: 'fsbutton',
                bottom: 0,
                left: 0,
                iconCls: view.fsButton.iconCls,
                iconMask: true,
                ui: 'plain',
                style: 'position:absolute',
                func: view.fsButton.func,
                hidden: !this.isFullScreen()
            });

            this.applyHandlerToAllItems(controller, this.getFullscreenButton());

        }

        // check if there is help for the view
        this.getControllerHelpCategory(controller, view);

        // remember the current view
        this.setCurrentView(view);

        // if multi view, check if other container is set up as well
        if (multiPanel) {

            switch (container.getItemId()) {
                case 'leftcontent':
                    otherContentFunc = 'showRightContent';
                    break;
                case 'rightcontent':
                    otherContentFunc = 'showLeftContent';
                    break;
                default:
                    otherContentFunc = null;
                    break;
            }

            // if other panel has no items, call it's function to show something
            if (otherContentFunc && containerOther.items.getCount() === 0 && controller[otherContentFunc]) {
                controller[otherContentFunc](view);
            }

        }

        var body = document.getElementsByTagName('body')[0]
        //if (body.className.indexOf('-ios') > -1 || body.className.indexOf('-macos') > -1 || body.className.indexOf('-other') > -1) {
        //    var hackForiOS18 = setInterval(function () {
        //        // hack to fix hidden panels in iOS 18
        //        body.classList.remove('x-webkit');
        //        setTimeout(() => {
        //            body.classList.add('x-webkit');
        //        }, 1);
        //    }, 3000);
        //}
        var hackForiOS18 = setTimeout(function () {
            // hack to fix hidden panels in iOS 18
            body.classList.remove('x-webkit');
            console.debug("Main.hackForiOS18");
            setTimeout(() => {
                body.classList.add('x-webkit');
            }, 1);
        }, 100);
        //}
        return view;

    },

    clearView: function (side) {
        var func, content;

        if (!side) { side = 'Left'; }

        func = 'get' + side + 'Content';

        if (this[func]) {
            content = this[func](side);
            if (content) { content.removeAll(true, true); }
        }

    },

    getControllerHelpCategory: function (controller, view) {
        var categories, strSQL, i;

        // get the help categories in order of priority
        categories = (controller.getHelpCategories && controller.getHelpCategories(view)) || [];

        // check if any categories are set
        if (categories.length > 0) {

            // set the base query
            strSQL = "SELECT Category as Category FROM (";

            // add query for each category
            for (i = 0; i < categories.length; i++) {

                if (i > 0) { strSQL += " UNION "; }
                strSQL += "SELECT " + i + " AS Priority, Category as Category FROM " + SQLTables.Tables.Help + " WHERE Category='" + categories[i] + "'";

            }

            // order by priority and only get top result
            strSQL += ") ORDER BY Priority LIMIT 1";

            // get the highest priority category
            DataFunc.executeSQL({
                sql: strSQL,
                scope: this,
                success: function (tx, results) {

                    if (results.rows.length > 0) {
                        VIPSMobile.Main.setHelpCategory(DataFunc.GetScalarValue(results));
                    } else {
                        VIPSMobile.Main.setHelpCategory(null);
                    }

                },
                failure: function (tx, error) {

                    // probably haven't sync'd the table yet so just don't show any help
                    VIPSMobile.Main.setHelpCategory(null);

                }
            });

        } else {

            // no categories set
            VIPSMobile.Main.setHelpCategory(null);

        }

    },

    setTitlebar: function (controller, titlebar, view) {
        var items, blnAddButton, btn, i;

        try {

            // set the title bar and get the toolbar items
            if (view.tbConfig) {

                if (view.tbConfig.title) {
                    titlebar.setTitle(view.tbConfig.title + ' - ' + VIPSMobile.User.get('FirstName') + ' ' + VIPSMobile.User.get('LastName'));
                }
                items = view.tbConfig.items || [];

            } else {

                titlebar.setTitle(null);
                items = [];
            }

            // remove any current titlebar buttons
            titlebar.removeAllButtons();

            // add all the titlebar buttons
            for (i = 0; i < items.length; i++) {

                // assume the button is to be added
                blnAddButton = true;

                // check if the button has an add function
                if (items[i].addFn) {

                    // call the button's add function to see if it should be added
                    blnAddButton = !!items[i].addFn.apply(this, [controller]);

                }

                if (blnAddButton) {

                    // add the button and handlers
                    btn = titlebar.add(items[i]);
                    this.applyHandlerToAllItems(controller, btn);

                    // if the button has an init function, call it
                    if (items[i].initFn) {
                        items[i].initFn.apply(btn, [controller, view, btn]);
                    }

                    // if the button has a disabled function, call it
                    if (items[i].disabledFn) {
                        items[i].disabledFn.apply(btn, [controller, view, btn]);
                    }

                }

            }

        } catch (ex) {

            console.error('Error in Main.setTitlebar(): ' + ex.message);

        }

    },

    applyHandlerToAllItems: function (controller, item) {
        var events, i;

        //console.debug('Main.applyHandlerToAllItems()', item.$className, item.getId());

        // sencha removes custom properties so add func back on if needed
        if (item.getInitialConfig().func) {
            item.func = item.getInitialConfig().func;
        }

        // get the events to listen for
        events = this.GetHandlersBasedOnXTypes(item);

        // add handlers for events
        for (i = 0; i < events.length; i++) {
            item.on(events[i], this[events[i] + 'Handler'], controller);
        }

        // recurse through all subitems
        if (item.getItems) {

            for (i = 0; i < item.getItems().length; i++) {
                this.applyHandlerToAllItems(controller, item.getAt(i));
            }

        }

        // listen for when more items are added to auto add handlers
        item.on('add', function (container, item, index) {
            this.applyHandlerToAllItems(controller, item);
        }, this);

    },

    GetHandlersBasedOnXTypes: function (item) {
        var xTypes, i, events;

        events = [];

        // get all the xtype's for the item
        xTypes = item.getXTypes().split('/');

        // add handlers based on the item's types
        for (i = 0; i < xTypes.length; i++) {

            switch (xTypes[i]) {
                case 'button': this.addEventForItem(events, ['tap']); break;
                case 'CalDay': this.addEventForItem(events, ['tap']); break;
                case 'checkboxfield': this.addEventForItem(events, ['tap']); break;
                case 'field': this.addEventForItem(events, ['keyup']); break;
                case 'formpanel': this.addEventForItem(events, ['action']); break;
                case 'list': this.addEventForItem(events, ['itemswipe', 'itemtap']); break;
                case 'dataview': this.addEventForItem(events, ['itemtap']); break;
                case 'DashboardMenu': this.addEventForItem(events, ['itemtap']); break;
                case 'picker': this.addEventForItem(events, ['change']); break;
                case 'radiofield': this.addEventForItem(events, ['change', 'check', 'tap', 'uncheck']); break;
                case 'selectfield': this.addEventForItem(events, ['change']); break;
                case 'sliderfield': this.addEventForItem(events, ['change']); break;
                case 'tab': this.addEventForItem(events, ['tap']); break;
                case 'tabbar': this.addEventForItem(events, ['tap']); break;
                case 'tabpanel': this.addEventForItem(events, ['tap']); break;
                case 'textfield': this.addEventForItem(events, ['action', 'change', 'focus', 'keyup']); break;
                case 'togglefield': this.addEventForItem(events, ['change']); break;
                case 'imagefield': this.addEventForItem(events, ['tap']); break;
                case 'spinnerfield': this.addEventForItem(events, ['tap']); break;
                // adding these in to supress console logs and there if ever need them
                case 'actionsheet':
                case 'audio':
                case 'component':
                case 'container':
                case 'dataitem':
                case 'DataMenu':
                case 'dataview':
                case 'fieldpicker':
                case 'fieldset':
                case 'hiddenfield':
                case 'image':
                case 'ImageInput':
                case 'img':
                case 'label':
                case 'listitem':
                case 'loadmask':
                case 'map':
                case 'mask':
                case 'media':
                case 'nestedlist':
                case 'numberfield':
                case 'OrdersDetail':
                case 'panel':
                case 'pickerslot':
                case 'simplelistitem':
                case 'sheet':
                case 'spacer':
                case 'textareafield':
                case 'title':
                case 'titlebar':
                case 'uomfield':
                case 'video':
                    break;
                default:
                    console.debug('No handlers added for xtype ' + xTypes[i]); break;
            }

        }

        return events;

    },

    addEventForItem: function (events, args) {
        var i;

        for (i = 0; i < args.length; i++) {

            if (events.indexOf(args[i]) < 0) {
                events.push(args[i]);
            }

        }

    },

    // need to add one of these whenever listening for new events
    actionHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'Action', arguments]);
    },
    blurHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'Blur', arguments]);
    },
    changeHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'Change', arguments]);
    },
    checkHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'Check', arguments]);
    },
    focusHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'Focus', arguments]);
    },
    itemswipeHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'ItemSwipe', arguments]);
    },
    itemtapHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'ItemTap', arguments]);
    },
    keyupHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'KeyUp', arguments]);
    },
    tapHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'Tap', arguments]);
    },
    uncheckHandler: function (e) {
        VIPSMobile.Main.execComponentHandlerFn.apply(this, [e, 'Uncheck', arguments]);
    },

    execComponentHandlerFn: function (item, defaultFn, args) {
        var func;

        // this is here becuase audio can only be played on a user interation,
        // So first interaction 
        if (!VIPSMobile.Main.getHasSetupAudioAlert()) {
            VIPSMobile.Main.PlayAudioAlert(false);
        };

        // check for func config
        if (item.func) {
            func = 'on' + Ext.String.capitalize(item.func) + defaultFn;
            if (!this[func]) { func = null; }
        }

        // check based on item id
        if (!func && item.getItemId()) {
            func = 'on' + Ext.String.capitalize(item.getItemId()) + defaultFn;
            if (!this[func]) { func = null; }
        }

        // check based on id
        if (!func && item.getId()) {
            func = 'on' + Ext.String.capitalize(item.getId()) + defaultFn;
            if (!this[func]) { func = null; }
        }

        // default based on xtype
        if (!func) {
            func = 'on' + Ext.String.capitalize(DataFunc.GetXtype(item)) + defaultFn;
            if (!this[func]) { func = null; }
        }

        // execute the function if set
        if (func) {
            this[func].apply(this, args);
        }

    },


    toggleFullscreen: function () {
        var fullscreen, multiPanel;

        // check if currently full screen
        fullscreen = !this.isFullScreen();

        multiPanel = VIPSMobile.Main.useMultiPanels();

        // show/hide the top toolbar(s)
        if (multiPanel) {
            if (this.getTitlebarLeft()) { this.getTitlebarLeft().setHidden(fullscreen); }
            if (this.getTitlebarRight()) { this.getTitlebarRight().setHidden(fullscreen); }
        } else {
            this.getTitlebar().setHidden(fullscreen);
        }

        // show/hide the bottom toolbar(s)
        this.getToolbar().setHidden(fullscreen);

        // hide/show the fs button
        if (this.getFullscreenButton()) {
            this.getFullscreenButton().setHidden(!fullscreen);
        }

    },

    // check if currently full screen
    isFullScreen: function () {
        return this.getToolbar().getHidden();
    },

    setBadgeText: function (query, text, disabled) {
        var btn;

        try {

            // if not a id query, assume it's a text query
            if (query[0] !== '#') {
                query = 'button[text="' + query + '"]';
            }

            // check toolbar and titlebar for the button
            btn = this.getToolbar().down(query);
            if (!btn) {

                if (this.useMultiPanels()) {

                    if (this.getTitlebarRight() !== undefined) {
                        btn = this.getTitlebarRight().down(query);
                    }

                    if (!btn) {
                        btn = this.getTitlebarLeft().down(query);
                    }

                } else {
                    btn = this.getTitlebar().down(query);
                }

            }

            // if button found, set it's badge
            if (btn) {
                btn.setBadgeText(text);
                if (Ext.isBoolean(disabled)) {
                    btn.setDisabled(disabled);
                }
            }

        } catch (ex) {
            console.error('Error in Main.setBadgeText()', ex.message);
        }

    },

    // called via events and when click a section button on toolbar
    setMask: function (section, msg) {
        var i, container, value, curMask;

        // convert section to an array if not already
        if (!Ext.isArray(section)) { section = [section]; }

        for (i = 0; i < section.length; i++) {

            // section can be the controller so get it's name
            if (Ext.isObject(section[i])) {
                section[i] = section[i].getSection();
            }

            // if no msg was passed in, use current value
            if (msg === undefined) {
                msg = this.getMasks()[section[i]];
            }

            // check if passed in a string
            if (Ext.isString(msg)) {

                // remember the mask for the section
                this.getMasks()[section[i]] = msg;
                value = { xtype: 'loadmask', message: msg };

            } else {

                // remove the mask for the section
                delete this.getMasks()[section[i]];
                value = false;

            }

            // get the container to apply the mask to, always main except during login
            if (section[i] === 'Login') {
                container = this.getLogin();
            } else {
                container = this.getMain();
            }

            // update the mask if currently active section
            if (this.getCurrentSection() === section[i] || section[i] === 'Login') {

                // get the current mask
                curMask = container.getMasked();

                if (value !== false) {

                    // disable the titlebar
                    this.disableTitlebar(true);

                    // update the mask
                    if (!curMask || curMask.getHidden()) {
                        container.setMasked(value);
                    } else {
                        curMask.setMessage(msg);
                    }

                } else {

                    // enable the title bar
                    this.disableTitlebar(false);

                    // check if the mask is set before clearing it
                    if (curMask && !curMask.isDestroyed) {
                        container.setMasked(false);
                    }

                }

            }

        }

    },


    PlayAudioAlert: function (beep) {
        "use strict";

        if (!this.getAudioAlert() && !this.getHasSetupAudioAlert()) {
            this.setAudioAlert(new Audio());
        }

        Ext.defer(function () {

            try {
                if (beep) {//beep
                    if (this.getAudioAlert().paused) {
                        this.getAudioAlert().src = 'resources/sounds/beep.mp3';
                    }
                } else {
                    this.getAudioAlert().src = 'resources/sounds/silent.mp3';
                    this.setHasSetupAudioAlert(true);
                }

            } catch (ex) {
                console.debug("Exception Playing Sound: " + ex.message);
            }

        }, 200, this);


    },

    // disable the titlebar and any subitems
    disableTitlebar: function (disabled, item) {
        var i;

        if (!item) { item = this.getTitlebar(); }
        if (!item) { return; }

        // disable the item
        item.setDisabled(disabled);

        // disable any sub items
        if (item.items) {
            for (i = 0; i < item.items.getCount(); i++) {
                this.disableTitlebar(disabled, item.items.getAt(i));
            }
        }

    }

});
