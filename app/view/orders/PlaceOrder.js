//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.orders.PlaceOrder', {
    extend: 'Ext.form.Panel',

    config: {

        items: [{
            xtype: 'titlebar',
            title: 'Place Order',
            docked: 'top',
            items: [{
                func: 'placeBack',
                text: 'Back',
                ui: 'back action'
            }]
        }, {
            xtype: 'fieldset',
            margin: '.5em',
            items: [{
                xtype: 'container',
                items: [{
                    xtype: 'textfield',
                    label: 'Patron',
                    name: 'Patron',
                    disabled: true
                }, {
                    xtype: 'textfield',
                    label: 'Patron',
                    name: 'PatronId',
                    hidden: true
                }, {
                    docked: 'right',
                    xtype: 'button',
                    iconCls: 'team',
                    iconMask: true,
                    func: 'PickPatron',
                    cls: 'reset',
                    pressedCls: ''
                }]
            }, {
                xtype: 'datepickerfield',
                label: 'Order Date',
                name: 'OrderDate',
                value: new Date(),
                picker: {
                    slotOrder: ['day', 'month', 'year'],
                    yearFrom: 2012,
                    yearTo: 2013
                }
            }, {
                xtype: 'selectfield',
                label: 'Ship To',
                name: 'ShipTo'
            }, {
                xtype: 'textareafield',
                label: 'Notes',
                name: 'Notes'
            }
            //,            {
            //    xtype: 'signaturefield',
            //    label: 'Sign',
            //    //name: 'Signature',  // name isn't supported?
            //    sigWidth: 350,
            //    sigHeight: 120
            //}
            ]
        }, {
            xtype: 'button',
            text: 'Submit',
            func: 'submitOrder',
            ui: 'confirm',
            margin: '1em .5em 0 .5em'
        }]
    }

});
