//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.BackgroundVerCheck', {
    singleton: true,

    config: {
        checkFreq: 30 * 60 * 1000, // 30 minutes
        id: null,
        notifiedAt: null,
        notifyInterval: 720, // how many minutes between notifying user of a new version (defaulted to 12 hours atm)
        started: false
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    start: function () {
        var me;

        me = this;
        this.setId(setInterval(function () {
            me.DoCheck(me);
        }, this.getCheckFreq()));

        this.setStarted(true);

    },

    stop: function () {
        if (this.getId()) { clearInterval(this.getId()); }
    },

    updateCheckFreq: function (newValue, oldValue) {
        if (this.getStarted()) {
            this.stop();
            this.start();
        }
    },

    // check if app is out of date
    DoCheck: function () {
        var strLatest;

        // don't check if already notified them recently
        if (!this.getNotifiedAt() || DataFunc.datediff('mi', this.getNotifiedAt(), DataFunc.getdate()) > this.getNotifyInterval()) {

            console.debug('BackgroundVerCheck');

            Ext.Ajax.request({
                timeout: 120000,
                url: VIPSMobile.ServiceURL + 'Data/GetVersion',
                headers: { 'Content-Type': 'application/json' },
                jsonData: { item: 'a' },
                scope: this,
                success: function (response, opts) {

                    // get the latest version response
                    strLatest = response.responseObject;

                    // check if the web service had an error
                    if (strLatest.indexOf('error') === -1) {

                        // check if the versions match
                        if (VIPSMobile.Version.get() !== strLatest) {

                            // set the time they were notified at
                            this.setNotifiedAt(DataFunc.getdate());

                            // can't get the updating of cache to work so just notifying them for now
                            Ext.Msg.alert(VIPSMobile.getString('New Version'), VIPSMobile.getString('A new version has been released.') + '<br />' + VIPSMobile.getString('Please log out and back in to update at your earliest convenience.'));

                        }

                    }

                }

            });

        }

    }

});
