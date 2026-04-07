//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.settings.Overview', {
    extend: 'Ext.form.Panel',

    requires: ['VIPSMobile.ux.field.Image'],

    tbConfig: {
        title: VIPSMobile.getString('Settings')
    },

    config: {
        itemId: 'SettingsOverview',
        //margin: '0.5em',
        scrollable: true,
        cls: 'font90 clientbackground',
        panel: 'full',

        items: [{
            xtype: 'fieldset',
            title: VIPSMobile.getString('Application Settings'),
            items: [{
                xtype: 'togglefield',
                name: 'OnActionNext',
                labelWidth: '18em',
                label: VIPSMobile.getString('Auto advance data entry') + '<br /><span class="small">' + VIPSMobile.getString('Go to next question after answer') + '</span>',
                value: VIPSMobile.User.getOnActionNext()
            }, {
                xtype: 'togglefield',
                name: 'UseLocation',
                label: VIPSMobile.getString('Use Location') + '<br /><span class="small">' + VIPSMobile.getString('Sort options based on location') + '</span>',
                labelWidth: '18em',
                value: VIPSMobile.User.getUseLocation(),
                readOnly: true
            }, {
                xtype: 'togglefield',
                name: 'DebugInfo',
                label: VIPSMobile.getString('Debug Info') + '<br /><span class="small">' + VIPSMobile.getString('Show internal debug values') + '</span>',
                labelWidth: '18em',
                value: VIPSMobile.User.getDebug()
            }, {
                xtype: 'togglefield',
                name: 'ShowAsFullScreen',
                label: VIPSMobile.getString('Show as Full Screen App') + '<br /><span class="small">' + VIPSMobile.getString('Save a home screen link you with no browser bar') + '</span>',
                labelWidth: '18em',
                value: false
            }, {
                xtype: 'sliderfield',
                name: 'SyncFrequency',
                label: VIPSMobile.getString('Sync Freq'),
                labelWidth: '8em',
                minValue: 0,
                maxValue: 245,
                increment: 5
            }, {
                xtype: 'selectfield',
                name: 'FontSize',
                label: VIPSMobile.getString('Font Size'),
                labelWidth: '8em',
                value: VIPSMobile.User.getFontSize(),
                func: 'FontSize',
                options: [
                    { text: VIPSMobile.getString('Small'), value: 80 },
                    { text: VIPSMobile.getString('Medium'), value: 90 },
                    { text: VIPSMobile.getString('Large'), value: 110 },
                    { text: VIPSMobile.getString('X-Large'), value: 200 }
                ]
            }, {
                xtype: 'textfield',
                name: 'Build',
                value: VIPSMobile.Version.get(),
                label: VIPSMobile.getString('Build'),
                labelWidth: '8em',
                readOnly: true
            }, {
                xtype: 'textfield',
                name: 'OSVersion',
                value: iOSversion().join('.'),
                label: VIPSMobile.getString('OS Version'),
                labelWidth: '8em',
                readOnly: true
            }, {
                xtype: 'textfield',
                name: 'OSName',
                value: Ext.os.name,
                label: VIPSMobile.getString('OS Name'),
                labelWidth: '8em',
                readOnly: true
            }, {
                xtype: 'textfield',
                name: 'BrowserName',
                value: Ext.browser.name,
                label: VIPSMobile.getString('Browser Name'),
                labelWidth: '8em',
                readOnly: true
            }, {
                xtype: 'textfield',
                name: 'Transfers',
                label: VIPSMobile.getString('Transfers'),
                labelWidth: '8em',
                readOnly: true
            }, {
                xtype: 'selectfield',
                name: 'Profile',
                label: VIPSMobile.getString('Device') + '<br /><span class="small">' + Ext.os.name + '</span>',
                labelWidth: '8em',
                labelCls: 'testing-control',
                func: 'Profile',
                options: [
                    { text: VIPSMobile.getString('Automatic'), value: '' },
                    { text: VIPSMobile.getString('Phone'), value: 'Phone' },
                    { text: VIPSMobile.getString('Tablet'), value: 'Tablet' }
                ],
                cls: 'testing-control'
            }]
        }, {
            xtype: 'fieldset',
            title: VIPSMobile.getString('Profile'),
            items: [{
                xtype: 'textfield',
                name: 'Mailbox',
                label: VIPSMobile.getString('Mailbox'),
                labelWidth: '8em',
                readOnly: true
            }, {
                xtype: 'textfield',
                name: 'FirstName',
                label: VIPSMobile.getString('First Name'),
                labelWidth: '8em',
                readOnly: true
            }, {
                xtype: 'textfield',
                name: 'LastName',
                label: VIPSMobile.getString('Last Name'),
                labelWidth: '8em',
                readOnly: true
            }
                , {
                xtype: 'imagefield',
                itemId: 'ProfileUrl',
                name: 'ProfileUrl',
                label: VIPSMobile.getString('Picture'),
                labelWidth: '8em'
            }
                , {
                xtype: 'button',
                text: 'Change Password',
                ui: 'action',
                hidden: true,
                func: 'SetPassword'
            }]
        }, {
            xtype: 'fieldset',
            title: VIPSMobile.getString('Admin Actions'),
            defaults: {
                xtype: 'button',
                margin: '.5em',
                ui: 'action',
                controller: 'Settings'
            },
            items: [{
                text: VIPSMobile.getString('Check if Online'),
                func: 'Online'
            }, {
                text: VIPSMobile.getString('Location'),
                func: 'Location',
            }, {
                text: VIPSMobile.getString('Admin Tables'),
                func: 'ShowDBTables'
            }, {
                text: VIPSMobile.getString('Delete Database File'),
                func: 'DeleteDBFile',
                hidden: Ext.os.name === 'MacOS',
            }, {
                text: VIPSMobile.getString('Console Log'),
                func: 'ConsoleLog'
            }, {
                text: VIPSMobile.getString('Data Queue'),
                func: 'DataQueue'
            }, {
                text: VIPSMobile.getString('Change Log'),
                func: 'ChangeLog',
                cls: 'testing-button'
            }, {
                text: VIPSMobile.getString('Clear info'),
                func: 'ClearInfo'
            }]
        }]

    },

    onpainted: function () {

        console.log('Settings Overview Setup');


    }

});
