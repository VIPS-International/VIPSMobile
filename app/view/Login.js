//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.Login', {
    extend: 'Ext.Container',

    config: {
        itemId: 'loginview',
        layout: {
            type: 'vbox'
        },
        defaults: {
            defaults: {
                labelWidth: '8em'
            }
        },
        padding: '0.5em',
        items: [{
            cls: 'login_logo',
            html: VIPSMobile.getString('Login')
        }, {
            xtype: 'fieldset',
            cls: 'logininfo',
            instructions: VIPSMobile.getString('Enter your mailbox details to access'),
            items: [{
                xtype: 'textfield',
                id: 'mailbox',
                label: VIPSMobile.getString('Mailbox'),
                inputType: 'tel',
                maxLength: 10
            }, {
                xtype: 'textfield',
                id: 'password',
                label: VIPSMobile.getString('Password'),
                inputType: 'tel',
                maxLength: 20,
                cls: 'password'
            }]
        }, {
            xtype: 'button',
            text: VIPSMobile.getString('Login'),
            func: 'Login',
            ui: 'action'
        }, {
            xtype: 'spacer'
        }, {
            xtype: 'button',
            text: VIPSMobile.getString('Reset'),
            func: 'Reset'
            }, {
                cls: 'x-form-fieldset-instructions',
                html: VIPSMobile.Version.get()
            }, {
            cls: 'x-form-fieldset-instructions',
            html: window.location.toString().replace('https://', '').replace('/index.html', '') + ' <a href="https://secure.vips.com.au/">Help</a>'
        }]
    }

});
