//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.controller.Login', {
    extend: 'Ext.app.Controller',

    requires: ['VIPSMobile.User', 'VIPSMobile.Version'],

    config: {

        routes: {
            '': 'setup',
            'Login': 'setup',
            'Login/': 'setup',
            'Login/:junk': { action: 'setup', conditions: { ':mailbox': '[0-9]+' } },
            'Login/:mailbox/:pw': { action: 'setup', conditions: { ':mailbox': '[0-9]+', ':pw': '[0-9]+' } }
        },

        refs: {
            login: {
                selector: '#loginview'
            },
            mailbox: {
                selector: '#mailbox'
            },
            password: {
                selector: '#password'
            }
        }

    },

    setup: function (mailbox, password) {
        var loadingIndicator, view;

        // destroy the loading indicator
        loadingIndicator = Ext.fly('appLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.destroy();
        } else {
            return; // this happens when it sets the hash before reloading on log out
        }

        // show the login view
        view = Ext.create('VIPSMobile.view.Login');
        Ext.Viewport.add(view);

        // add a no autocomplete value to the password field
        var input = this.getPassword().element.query('input')[0];
        input.setAttribute("autocomplete", "off");

        // apply the login class to the
        VIPSMobile.Main.applyHandlerToAllItems(this, view);

        // set the mailbox
        if (mailbox === undefined) { mailbox = this.getLoginValue('Mailbox'); }
        if (mailbox && parseInt(mailbox, 10) > 0) { this.getMailbox().setValue(mailbox); }

        // set the password
        if (password === undefined) { password = this.getLoginValue('Password'); }
        if (password) { this.getPassword().setValue(password); }

        // check if the auto login flag is set
        if (localStorage.autoLogin) {

            // set values
            this.getMailbox().setValue(VIPSMobile.User.getMailbox());
            this.getPassword().setValue(VIPSMobile.User.getPassword());
            delete localStorage.autoLogin;

            // call login click
            Ext.defer(this.onLoginTap, 500, this);

        }

    },

    getLoginValue: function (property) {
        var value;

        // check current user
        value = VIPSMobile.User['get' + property]();

        // check Berillium ls value
        if (!value && localStorage.VIPS_Be_user) {
            value = JSON.parse(localStorage.VIPS_Be_user)[property];
        }

        // return the value
        return value;

    },

    onRecentTap: function (btn) {

        // set the values
        this.getMailbox().setValue(btn.getText());
        this.getPassword().setValue(btn.pw);

        // call login tap
        this.onLoginTap();

    },

    onResetTap: function () {

        Ext.Msg.confirm('Reset', 'You are about to reset VIPS Mobile. This will remove your VIPS Profile and data mailbox from this device. Do you wish to continue?', function (btn) {

            if (btn === 'yes') {
                VIPSMobile.Main.setMask(this, 'Reseting...');
                DataFunc.ClearInfo();
            }

        }, this);

    },

    onMailboxAction: function () {
        this.onLoginTap();
    },

    onPasswordAction: function () {
        this.onLoginTap();
    },

    onLoginTap: function () {
        var entered, objResponse, intCurrentBox;

        // exit if already logging in to stop double taps
        if (this.loggingIn) { return; }

        // filter button spam
        if (this.getPassword().getValue().trim() !== '' && this.getMailbox().getValue().trim() !== '') {

            // set the logging in flag
            this.loggingIn = true;

            VIPSMobile.Main.setMask(this, 'Logging in...');

            // get the entered values converting to numbers
            entered = this.GetEnteredValues();

            Ext.Ajax.request({
                url: VIPSMobile.ServiceURL + 'Login/ValidLogin',
                headers: { 'Content-Type': 'application/json' },
                jsonData: {
                    Mailbox: entered.mailbox,
                    Password: entered.password,
                    MobileID: entered.mobileId,
                    Version: VIPSMobile.Version.getLSPrefix(),
                    ThemeCommunityNo: localStorage[VIPSMobile.Version.getLSPrefix() + 'themeCommNo'] || 0,
                    ThemeRowVer: localStorage[VIPSMobile.Version.getLSPrefix() + 'themeRowVer'] || '',
                    isReactNative: false,
                    isSenchaMobile: true
                },
                scope: this,
                success: function (response, opts) {

                    objResponse = response.responseObject;

                    // only remove the mask if not successful
                    if (objResponse.result < 1) {
                        VIPSMobile.Main.setMask(this, false);
                    }

                    switch (objResponse.result) {
                        case -2:
                            Ext.Msg.alert(VIPSMobile.getString('Not Valid'), VIPSMobile.getString('Your mailbox is not enabled to log in via this service'), Ext.emptyFn);
                            break;
                        case -1:
                            Ext.Msg.alert(VIPSMobile.getString('Not Valid'), VIPSMobile.getString('You are locked out please wait 30 min before trying again'), Ext.emptyFn);
                            break;
                        case 0:
                            Ext.Msg.alert(VIPSMobile.getString('Not Valid'), VIPSMobile.getString('Your mailbox or password is incorrect, please try again'), Ext.emptyFn);

                            if (entered.mailbox) { // only add cdr event if mailbox entered

                                // need to temporarily set mailbox for message queue
                                intCurrentBox = VIPSMobile.User.getMailbox();
                                VIPSMobile.User.setMailbox(entered.mailbox);
                                VIPSMobile.CDR.add(VIPSMobile.CDR.Types.InvalidPasswordEntered, null, null, entered.password);
                                VIPSMobile.User.setMailbox(intCurrentBox);

                            }
                            break;

                        case 1:

                            // if successful, response would have encoded password so updated entered password
                            // Removed to stop "too many dots" confusion
                            // entered.password = objResponse.encPW;

                            // update the theme if needed
                            if (objResponse.theme) {
                                this.updateTheme(objResponse.theme);
                            }

                            // login
                            this.onSuccessLogin(entered, objResponse.settings);

                            break;
                    }

                    this.loggingIn = false;

                },
                failure: function (response, opts) {

                    this.loggingIn = false;

                    VIPSMobile.Main.setMask(this, false);

                    // allow ofline login if mailbox details havent changed
                    if (entered.mailbox === VIPSMobile.User.getMailbox() && entered.password === VIPSMobile.User.getPassword()) {
                        Ext.Msg.alert(VIPSMobile.getString("Offline"), VIPSMobile.getString("Some features may be unavailable while offline"));
                        this.onSuccessLogin(entered);
                    } else {
                        if (VIPSMobile.User.getMailbox()) {
                            Ext.Msg.alert(VIPSMobile.getString("Offline"), VIPSMobile.getString("Unable to change mailbox while offline"));
                        } else {
                            Ext.Msg.alert(VIPSMobile.getString("Offline"), VIPSMobile.getString("Unable to log in for first time while offline"));
                        }
                    }

                }
            });

        } else {

            // tell user to enter mailbox and password
            Ext.Msg.alert(VIPSMobile.getString('Not Valid'), VIPSMobile.getString("You must enter a mailbox and password."));

        }

    },

    GetEnteredValues: function () {
        var lngMailbox, lngPassword, lngMobileID;

        // convert the mailbox to a number
        lngMailbox = parseInt(this.getMailbox().getValue(), 10);
        if (isNaN(lngMailbox)) { lngMailbox = 0; }

        // convert the password to digits
        lngPassword = this.getPassword().getValue();
        if (lngPassword === "") { lngPassword = 0; }

        // if mailbox number has changed, don't send current mobile id
        if (VIPSMobile.User.getMailbox() === lngMailbox) {
            lngMobileID = VIPSMobile.User.getMobileID();
        } else {
            lngMobileID = 0;
        }

        return {
            mailbox: lngMailbox,
            password: lngPassword,
            mobileId: lngMobileID
        };

    },

    updateTheme: function (theme) {
        var StyleSheetReplaced = false;
        try {

            switch (theme.result) {
                case "update":
                    localStorage[VIPSMobile.Version.getLSPrefix() + 'themeCommNo'] = theme.Community;
                    localStorage[VIPSMobile.Version.getLSPrefix() + 'themeRowVer'] = theme.RowVer;
                    /// find the default css and delete from local storage
                    for (var j = 0; j < localStorage.length; j++) {
                        var key = localStorage.key(j);
                        if (key.indexOf("resources/css/app.css") > 0) {
                            localStorage[key] = theme.CSS;
                            StyleSheetReplaced = true;
                        }
                    }
                    if (!StyleSheetReplaced) {
                        localStorage[VIPSMobile.Version.getLSPrefix() + 'themeCSS'] = theme.CSS;
                    }

                    VIPSMobile.app.SetStyleSheet();

                    break;

                case "nochange":
                    // already set so do nothing
                    break;

                case "default":
                    delete localStorage[VIPSMobile.Version.getLSPrefix() + 'themeCommNo'];
                    delete localStorage[VIPSMobile.Version.getLSPrefix() + 'themeRowVer'];
                    delete localStorage[VIPSMobile.Version.getLSPrefix() + 'themeCSS'];
                    VIPSMobile.app.SetStyleSheet();
                    break;

                case "error":
                    console.log('Error getting theme');
                    break;

            }
        } catch (ex) {
            console.log(ex.message);
        }

    },

    onSuccessLogin: function (entered, vUserSettings) {
        var mailboxChanged, recent;

        // check if the mailbox has changed
        mailboxChanged = (VIPSMobile.User.getMailbox() && VIPSMobile.User.getMailbox() !== entered.mailbox);

        // set the user values from form
        VIPSMobile.User.setMailbox(entered.mailbox);
        VIPSMobile.User.setPassword(entered.password);

        // set the user values
        VIPSMobile.User.UpdateLoginSettings(vUserSettings);

        if (!mailboxChanged) {

            this.getApplication().getController('Main').setup();

            VIPSMobile.Main.setMask(this, false);
            this.getLogin().destroy();

        } else {

            // clear the info and reload
            DataFunc.ClearInfo(function () {

                // reset the user info
                VIPSMobile.User.setMailbox(entered.mailbox);
                VIPSMobile.User.setPassword(entered.password);
                VIPSMobile.User.save();

                // set flag to enable auto login
                localStorage.autoLogin = true;

                // relog in
                VIPSMobile.Main.LogOut(true);

            });

        }

    }

});
