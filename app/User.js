//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.User', {
    mixins: ['Ext.mixin.Observable'],
    singleton: true,

    requires: ['VIPSMobile.Version'],

    MultiPanel: {
        landscape: 1,
        portrait: 2,
        data: 4,
        messages: 8,
        groups: 16,
        library: 32,
        settings: 64
    },

    MultiPanelOptions: {
        DataLeftPanel: 0
    },

    // leave the value as null if don't want to save the values to local storage
    config: {
        AllowAlphaSearch: false,
        AllowChat: false,
        AllowLocation: false,
        AllowMemoAttachments: false,
        AllowOfflineLibrary: false,
        CannotSendToSysList: false,
        Debug: false,
        Downloads: 0,
        FontSize: 90,
        FirstName: '',
        LastName: '',
        Mailbox: 0,
        MaxHashAge: 60,
        MessageSort: null,
        MobileID: 0,
        MultiPanels: 0,
        MultiPanelOptions: 'M',
        NumGroupList: 0,
        OnActionNext: false,
        Password: 0,
        Profile: '',
        ProfileUrl: '',
        setup: null,
        SavedReportsCount: 5,
        SyncFrequency: 240,
        SystemID: '',
        Tabs: 'SX',
        TestMode: false,
        Uploads: 0,
        UseLocation: false
    },

    _fields: [],

    constructor: function (config) {

        // set the fields to save from the config (don't save fields without a value)
        Ext.iterate(this.config, function (field, value) {

            if (value !== undefined) {
                this._fields.push(field);
            }

        }, this);

        // try to get the config from local storage
        if (localStorage[VIPSMobile.Version.getLSPrefix() + 'user']) {
            config = JSON.parse(localStorage[VIPSMobile.Version.getLSPrefix() + 'user']);
        }

        this.initConfig(config);

        this.setSetup(true);

    },

    // increment the up/download amounts
    IncrementUploads: function (bytes) {
        this.setUploads(this.getUploads() + bytes);
        this.fireEvent('uploadschanged');
    },
    IncrementDownloads: function (bytes) {
        this.setDownloads(this.getDownloads() + bytes);
        this.fireEvent('downloadschanged');
    },

    // convert data types as needed
    applyAllowAlphaSearch: function (newValue, oldValue) {
        return !!newValue;
    },
    applyAllowChat: function (newValue, oldValue) {
        return !!newValue;
    },
    applyAllowLocation: function (newValue, oldValue) {
        return !!newValue;
    },
    applyAllowMemoAttachments: function (newValue, oldValue) {
        return !!newValue;
    },
    applyAllowOfflineLibrary: function (newValue, oldValue) {
        return !!newValue;
    },
    applyCannotSendToSysList: function (newValue, oldValue) {
        return !!newValue;
    },
    applyDebug: function (newValue, oldValue) {
        return !!newValue;
    },
    applyOnActionNext: function (newValue, oldValue) {
        return !!newValue;
    },
    applyTestMode: function (newValue, oldValue) {
        return !!newValue;
    },
    applyUseLocation: function (newValue, oldValue) {
        return !!newValue;
    },

    // raise events when values change
    updateFontSize: function (newValue, oldValue) {
        this.fireEvent('fontsizechanged', newValue, oldValue);
    },
    updateOnActionNext: function (newValue, oldValue) {
        this.fireEvent('onactionnextchanged', newValue, oldValue);
    },
    updateProfileUrl: function (newValue, oldValue) {

        if (oldValue) {

            // send the pic to web service
            var objInfo = {
                "startNodeID": 0,
                "keys": {
                    "Mailbox": VIPSMobile.User.getMailbox()
                },
                "tables": [
                    {
                        "tablename": "MyVips.dbo.Mailboxes",
                        "fields": {
                            "ProfileUrl": newValue,
                            "InputMethod": 3,
                            "CallDate": '20010101000000'
                        }
                    }]
            };
            VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.DataEntry, objInfo);

            // update the local db
            DataFunc.executeSQL({
                sql: 'UPDATE ' + VIPSMobile.SQLTables.Tables.MyVIPSMailboxes + ' SET ProfileUrl=? WHERE Mailbox=?',
                params: [newValue, VIPSMobile.User.getMailbox()],
                success: function () {

                    // update the profile class
                    VIPSMobile.util.ProfilePics.getClass(VIPSMobile.User.getMailbox(), true);

                }
            });

        }

    },
    updateSyncFrequency: function () {
        this.fireEvent('syncfrequencychanged', this, this.getSyncFrequency());
    },

    // update the user settings from login response
    UpdateLoginSettings: function (vUserSettings) {

        // set all the values for the user
        Ext.iterate(vUserSettings, function (field, value) {

            // check if a set exists for the field
            if (typeof this['set' + field] === "function") { this['set' + field](value); }

        }, this);

        this.save();

        if (localStorage.getItem('DeviceId') != null && this.getMailbox() > 0) {
            Ext.Ajax.request({
                url: VIPSMobile.ServiceURL + 'Login/SetDeviceToken',
                headers: { 'Content-Type': 'application/json' },
                jsonData: {
                    Mailbox: this.getMailbox(),
                    DeviceToken: localStorage.getItem('DeviceId')
                },
                scope: this,
                success: function (response, opts) {
                    window.DeviceTokenSet = true;
                    console.log("setDeviceToken success", response, opts);
                },
                failure: function (response, opts) {
                    console.error("setDeviceToken failure", response, opts);
                }
            });
        } 
    },

    // get all the settings as an object
    getAllSettings: function () {
        var settings;

        settings = {};

        Ext.iterate(VIPSMobile.User._fields, function (field) {
            if (typeof this['get' + field] === "function") {
                settings[field] = this['get' + field]();
            }
        }, this);

        return settings;

    },

    // set the value and save the whole user
    save: function () {
        var i, objSave;

        // set the save info
        objSave = {};
        for (i = 0; i < this._fields.length; i++) {
            if (typeof this['get' + this._fields[i]] === "function") {
                objSave[this._fields[i]] = this['get' + this._fields[i]]();
            }
        }

        // save the object to local storage
        localStorage[VIPSMobile.Version.getLSPrefix() + 'user'] = Ext.encode(objSave);

    }

});
