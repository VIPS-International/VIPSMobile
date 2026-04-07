//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.Version', {
    singleton: true,

    // this is automatically updated by SetVersion.exe whenever publish.bat is run
    get: function () {
        return "B 260312.155647";
    },

    // parse the version string to get values
    getElement: function () {
        var ver = this.get();
        return ver.substring(0, ver.indexOf(' '));
    },
    getNumber: function () {
        var ver = this.get();
        return parseFloat(ver.substring(ver.indexOf(' ') + 1));
    },
    getDate: function () {
        var ver, year, month, day, hour, minute, second;

        // split the version up into date parts
        ver = this.get();
        year = 2000 + parseInt(ver.substring(3, 5), 10);
        month = parseInt(ver.substring(5, 7), 10) - 1;
        day = parseInt(ver.substring(7, 9), 10);
        hour = parseInt(ver.substring(10, 12), 10);
        minute = parseInt(ver.substring(12, 14), 10);
        second = parseInt(ver.substring(14, 16), 10);

        // return the date
        return new Date(year, month, day, hour, minute, second, 0);

    },

    // get the prefix to use for all local storage keys
    getLSPrefix: function () {
        return 'VIPS_' + this.getElement() + '_';
    },
    getDbName: function () {
        return 'VIPSMobile_' + this.getElement();
    }

});
