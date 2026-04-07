//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.settings.Profile', {
    extend: 'Ext.form.Panel',

    tbConfig: {
        title: VIPSMobile.getString('Profile'),
        items: [{
            text: VIPSMobile.getString('Back'),
            ui: 'back action',
            func: 'Back'
        }]
    },

    config: {

        layout: 'vbox',
        panel: 'full',
        itemId: 'SettingsProfile',
        items: [{
            xtype: 'ImageInput',
            itemId: 'field',
            maxThumbSize: 0,
            maxValueSize: 1024,
            imageNode: 'thumbnail',
            showCropBotton: true
        }, {
            xtype: 'image',
            itemId: 'thumbnail',
            cls: 'imagenodeimg',
            width: '100%',
            flex: 1,
            margin: '0.5em 0 0 0',
            mode: 'img'
        }, {
            xtype: 'button',
            itemId: 'saveBtn',
            text: 'Save Profile',
            height: '1.5em',
            func:'saveProfile',
            ui: 'action'
        }],       
        
        value: null

    },

    setup: function (controller) {

        var imgInput = this.down('#field');

        // listen for change event incase image is cleared
        imgInput.on('change', this.setThumbnail, this);

    },

    setThumbnail: function (imgInput, value) {
        var thumb, objValue;

        if (typeof value === "string" && value !== '' && value.substring(0, 1) === "{") {
            objValue = Ext.JSON.decode(value);
            if (objValue) {
                value = objValue.data;
            }
        }
        if (typeof value === "string" && value !== '' && value.substring(0, 1) === "<") {
            objValue = XML.parse(value);
            if (objValue) {
                value = objValue.data;
            }
        } else if (value && value.data) {
            value = value.data;
        }

        thumb = this.down('#thumbnail');
        thumb.setHidden(!value);

        this.down('#field').setImageNode(thumb.id);

        if (value) {
            thumb.setSrc(value);
        }

        this.setScrollable(false);       
        
        this.value = value;

    }

});
