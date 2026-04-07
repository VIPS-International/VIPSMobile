//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.field.Image', {
    extend: 'Ext.field.Field',
    xtype: 'imagefield',

    config: {
        ui: 'image',
        component: {
            xtype: 'container',
            layout: 'hbox',
            height: '10em',
            items: [{
                xtype: 'image',
                flex: 2
            }, {
                xtype: 'button',
                text: VIPSMobile.getString('Change Picture'),
                margin: '1em',
                flex: 1
            }]
        },

        imgComponent: null,
        butComponent: null
    },

    initialize: function () {

        this.callParent();

        this.setButComponent(this.getComponent().down('button'));
        this.setImgComponent(this.getComponent().down('image'));

        this.getButComponent().on('tap', this.setButtonTap, this);

    },

    getValue: function () {
        return this.getImgComponent().getSrc();
    },

    setValue: function (value) {
        this.getImgComponent().setSrc(value);
    },

    setButtonTap: function () {
        this.fireEvent('tap', this);
    }

});
