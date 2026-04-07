//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.group.Detail', {
    extend: 'Ext.form.Panel',

    tbConfig: {
        title: VIPSMobile.getString('Member'),
        items: [{
            func: 'DetailBack',
            ui: 'back action',
            text: VIPSMobile.getString('Back')
        }]
    },

    config: {
        itemId: 'groupDetail',
        margin: '0.5em',
        panel: 'right',
        cls: 'rightpanel',

        items: [{
            xtype: 'fieldset',
            title: VIPSMobile.getString('Group Member'),
            items: [{
                xtype: 'textfield',
                label: VIPSMobile.getString('Name'),
                readOnly: true,
                name: 'Name'
            }, {
                xtype: 'numberfield',
                label: VIPSMobile.getString('Mailbox'),
                readOnly: true,
                name: 'ListMember'
            }]
        }, {
            xtype: 'fieldset',
            title: VIPSMobile.getString('Contact Details'),
            items: [{
                xtype: 'textfield',
                label: VIPSMobile.getString('Email'),
                readOnly: true,
                name: 'Email',
                placeHolder: 'not set'
            }, {
                xtype: 'textfield',
                label: VIPSMobile.getString('Mobile'),
                readOnly: true,
                name: 'Mobile',
                placeHolder: 'not set'
            }]
        }, {
            xtype: 'container',
            layout: 'hbox',
            defaults: {
                xtype: 'button',
                flex: 1,
                iconMask: true
            },
            items: [
                { text: VIPSMobile.getString('New'), func: 'Compose', iconCls: 'doc_send' },
                { text: VIPSMobile.getString('Email'), func: 'Email', iconCls: 'mail1' },
                { text: VIPSMobile.getString('Call'), func: 'Call', iconCls: 'phone_ring1' }
            ]
        }],

        member: null

    },

    setup: function (member) {
        var values;

        this.setMember(member);

        values = member.data;

        values.Name = values.FirstName + ' ' + values.LastName;

        // check if email and mobile are set
        if (!values.Email) {
            values.Email = 'not set';
            this.down('button[text="Email"]').setDisabled(true);
        }
        if (!values.Mobile) {
            values.Mobile = 'not set';
            this.down('button[text="Call"]').setDisabled(true);
        }

        this.setValues(values);

    }

});

