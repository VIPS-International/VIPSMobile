//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.ImageNode', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        layout: 'vbox',
        items: [{
            xtype: 'ImageInput',
            itemId: 'field',
            maxThumbSize: 0,
            maxValueSize: 640
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
            itemId: 'loadfromserver',
            func: 'LoadFromServer',
            hidden: true,
            ui: 'action',
            text: 'Load From Server',
            margin: '0.5em 0 0 0',
            docked: 'bottom'
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            margin: '0.5em 0 0 0',
            docked: 'bottom'
        }]
    },

    statics: {

        getFormattedValue: function (node) {
            var strValue, objValue;

            strValue = node.get('Value') || null;
            if (typeof strValue === "string" && strValue.substring(0, 1) === "<") {
                objValue = XML.parse(strValue);
                if (objValue && objValue.fileName !== "clearimage.jpg") {
                    strValue = '<img src="' + objValue.thumb + '" height="64px" />';
                } else {
                    strValue = '';
                }
            } else if (typeof strValue === "string") {
                strValue = '<img src="' + strValue + '" height="64px" />';
                node.set('Value', null);
            } else {
                strValue = null;
            }

            return strValue;

        }
    },

    setup: function (controller, node) {
        var blobInfo, maxWidth, options, value, field, cameraOnly,
            btnLoadFromServer = this.down('#loadfromserver');

        // call parent setup
        this.callParent(arguments);

        field = this.getField();
        value = node.get('Value');

        btnLoadFromServer.setHidden(!(value === null && node.get('PreviousRecordId') > 0))

        // Added Default MaxWidth 640px
        maxWidth = node.get('Width') || 640;
        cameraOnly = false;

        // if the ListSQL (options) contains a 'Format' then use that value for max width instead
        // the task can control the width, rather than the node
        options = node.get('Options');
        if (options && typeof options !== "string") {

            // get the max width from the calculatedSQL
            for (var i = 0; i < options.length; i++) {
                if (options[i].text !== "" && options[i].value !== "") {
                    var optText = options[i].text.toString().toLowerCase(),
                        optValue = options[i].value.toString().toLowerCase();

                    if (optText === "width" || optValue === "width") {
                        maxWidth = parseInt((Ext.isNumeric(optValue) ? optValue : optText) || 640, 10);
                    }
                    if (optText === "cameraonly" || optValue === "cameraonly") {
                        cameraOnly = (Ext.isNumeric(optValue) ? !!optValue : !!optText) || false;
                    }
                }
            }
        }

        // set the max size from node settings
        field.setMaxValueSize(maxWidth);
        field.ForceCameraOnly(cameraOnly);

        // listen for change event incase image is cleared
        field.on('change', this.setThumbnail, this);

        if (value) {
            this.setThumbnail('', value);
        }

    },

    setThumbnail: function (imgInput, value) {
        var thumb, objValue;

        if (typeof value === "string" && value !== '' && value.substring(0, 1) === "{") {
            objValue = Ext.JSON.decode(value);
            if (objValue) {
                value = objValue.data;
            }
        }

        if (typeof value === "string" && value === "CLEAR") {
            value = false;
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

        if (value) {
            thumb.setSrc(value);
        }

    },

    getValue: function () {
        var strValue;

        strValue = this.getField().getValue();

        if (typeof strValue === "object") {
            strValue = XML.stringify(strValue);
        }

        if (strValue === "") {
            strValue = null;
        }

        return strValue;

    },

    setValue: function (value) {
        this.getField().setValue(value);

        if (value) {
            this.down('#thumbnail').setSrc(value.data);
        }
    }

});
