//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.ProfilePics', {
    singleton: true,

    requires: ['VIPSMobile.SQLTables', 'VIPSMobile.util.DataFunc'],

    config: {
        lastFetchTime: {}
    },
    constructor: function (config) {

        this.initConfig(config);
        if(!VIPSMobile.ProfileFetchTime){
            VIPSMobile.ProfileFetchTime = {};
        }

    },

    getClass: function (mailbox, force) {
        var start, end, src, style, profilePicClass = 'ppc' + mailbox,
            lastFetchTime = VIPSMobile.ProfileFetchTime[mailbox],
            syncTable = VIPSMobile.SQLTables.get(VIPSMobile.SQLTables.Tables.MyVIPSMailboxes);

        if (mailbox > 0 && (force || !lastFetchTime || syncTable.getLastSync() > lastFetchTime)) {

            VIPSMobile.ProfileFetchTime[mailbox] = DataFunc.getdate();

            DataFunc.executeSQL({
                sql: 'SELECT ProfileUrl FROM ' + VIPSMobile.SQLTables.Tables.MyVIPSMailboxes + ' WHERE Mailbox=?',
                params: mailbox || [0],
                scope: this,
                success: function (tx, results) {

                    console.debug('Getting profile pic for ' + mailbox);

                    src = DataFunc.GetScalarValue(results);

                    if (src) {

                        // create the profile pics style element if needed
                        style = document.getElementById('profilepics');
                        if (!style) {

                            style = document.createElement('style');
                            style.id = 'profilepics';
                            style.type = 'text/css';

                            document.head.appendChild(style);

                        }

                        // cut out current class if exists
                        start = style.innerHTML.indexOf('.' + profilePicClass);
                        if (start >= 0) {
                            end = style.innerHTML.indexOf('\n', start);
                            style.innerHTML = style.innerHTML.substring(0, start) + style.innerHTML.substring(end);
                        }

                        // add the mailbox's class to the style
                        style.innerHTML += '.' + profilePicClass + ' { background-image: url(' + src + '); }\n';

                    }

                }
            });

        }

        return "profilepic " + profilePicClass;

    }

});
