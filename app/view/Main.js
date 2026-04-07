//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.Main', {
    extend: 'Ext.Container',

    config: {
        itemId: 'mainview',
        fullscreen: true,
        layout: 'card',

        items: [{
            xtype: 'titlebar',
            itemId: 'headingtb',
            height: '2em',
            docked: 'top',
            defaults: {
                ui: 'action'
            }
        }, {
            xtype: 'button',
            itemId: 'showhelp',
            top: 0,
            right: 0,
            iconCls: 'help_black',
            iconMask: true,
            ui: 'plain'
        }, {
            xtype: 'container',
            itemId: 'siteLabel',
            cls: 'sitelabel',
            top: 0,
            right: 0
        }, {
            xtype: 'container',
            itemId: 'content',
            layout: 'hbox',
            //cls: 'clientbackground',
            items: [{
                xtype: 'container',
                itemId: 'leftcontent',
                layout: 'fit',
                flex: 1
            }, {
                xtype: 'container',
                itemId: 'contentDivider',
                cls: 'contentDivider',
                hidden: true
            }, {
                xtype: 'container',
                itemId: 'rightcontent',
                layout: 'fit',
                flex: 3,
                hidden: true
            }]
        }, {
            xtype: 'toolbar',
            itemId: 'sectionstb',
            docked: 'bottom',
            cls: 'x-tabbar',
            scrollable: 'horizontal',
            layout: {
                pack: 'center'
            }
        }, {
            xtype: 'panel',
            itemId: 'helpContainer',
            hidden: true,
            modal: true,
            hideOnMaskTap: true,
            showAnimation: {
                type: 'popIn',
                duration: 250,
                easing: 'ease-out'
            },
            hideAnimation: {
                type: 'popOut',
                duration: 250,
                easing: 'ease-out'
            },
            centered: true,
            width: '90%',
            height: '90%',
            styleHtmlContent: true,
            scrollable: true,
            items: [{
                xtype: 'titlebar',
                title: VIPSMobile.getString('Help'),
                docked: 'top',
                items: [{
                    xtype: 'button',
                    text: VIPSMobile.getString('Back'),
                    ui: 'back action',
                    func: 'HelpBack'
                }, {
                    xtype: 'button',
                    text: VIPSMobile.getString('Close'),
                    ui: 'action',
                    align: 'right',
                    func: 'HelpClose'
                }]
            }]
        }]

    }

});
