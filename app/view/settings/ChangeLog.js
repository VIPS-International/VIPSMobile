//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.settings.ChangeLog', {
    extend: 'Ext.dataview.List',

    tbConfig: {
        title: VIPSMobile.getString('Change Log'),
        items: [{
            text: 'Back',
            ui: 'back action',
            func: 'Back'
        }]
    },

    fsButton: {
        iconCls: 'left2',
        func: 'Back'
    },

    config: {
        itemId: 'ChangeLog',
        itemTpl: '{Change}',
        store: 'ChangeLog',
        loadingText: '',
        selectedCls: '',
        grouped: true,
        style: 'font-size:90%',
        panel: 'full'
    },

    initialize: function () {
        var i;

        this.callParent(arguments);

        // check if the store is populate
        if (this.getStore().getCount() === 0) {

            Ext.iterate(VIPSMobile.ChangeLog.get(), function (ver) {

                // changes
                if (ver.changes) {
                    for (i = 0; i < ver.changes.length; i++) {
                        this.getStore().add({
                            Version: ver.ver,
                            Section: 'Changes',
                            Change: ver.changes[i]
                        });
                    }
                }
                // new features
                if (ver.newFeatures) {
                    for (i = 0; i < ver.newFeatures.length; i++) {
                        this.getStore().add({
                            Version: ver.ver,
                            Section: 'New Features',
                            Change: ver.newFeatures[i]
                        });
                    }
                }
                // bug fixes
                if (ver.bugFixes) {
                    for (i = 0; i < ver.bugFixes.length; i++) {
                        this.getStore().add({
                            Version: ver.ver,
                            Section: 'Bug Fixes',
                            Change: ver.bugFixes[i]
                        });
                    }
                }
                // known issues
                if (ver.issues) {
                    for (i = 0; i < ver.issues.length; i++) {
                        this.getStore().add({
                            Version: ver.ver,
                            Section: 'Known Issues',
                            Change: ver.issues[i]
                        });
                    }
                }

            }, this);

        }

    }

});
