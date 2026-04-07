//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

// Since this probably looks a bit strange, here's an overview of the logic.
// The <input> element can't be styled in browsers.  To get around this, add the element with an opacity of 0 so it's there, but invisible.
// Then add a button which covers the same area as the input field but behind it.  When the user goes to click the button, they are actually
// clicking the invisible input element so works as it should.
Ext.define('VIPSMobile.ux.FileInput', {
    extend: 'Ext.Container',
    alias: 'widget.FileInput',
        
    config: {

        layout: {
            type: 'hbox'
        },

        items: [{
            xtype: 'container',
            html: '<input type="file" style="width: 6.3em; vertical-align: top;"/>',
            style: 'opacity: 0.0;'
        }, {
            xtype: 'button',
            text: VIPSMobile.getString('Add Attachment'),
            minWidth: '6.1em',
            height: '1.5em',
            ui: 'confirm',
            left: 0,
            top: 0,
            zIndex: 0
        }, {
            xtype: 'button',
            itemId: 'clrBtn',
            text: VIPSMobile.getString('Clear'),
            height: '1.5em',
            hidden: true,
            ui: 'decline'
        }],

        acceptedAttachmentTypes: ['*/*'],
        value: null        
    },

    initialize: function () {
        var me;

        me = this;

        this.getInput().onchange = function () {
            me.HandleFileAttachment.apply(me, arguments);
            me.down('#clrBtn').setHidden(false);
        };

        // listen for clear tap
        this.down('#clrBtn').on('tap', this.clearFile, this);
        
    },

    // get the html controls
    getInput: function () {
        try {
            return this.element.dom.querySelector('input');
        } catch (ex) {
            console.error('FileInput.getInput() Error', ex.message);
        }
    },
    
    updateAcceptedAttachmentTypes: function () {
    },
    updateValue: function () {
        this.fireEvent('change', this, this.getValue());
    },

    HandleFileAttachment: function (event) {
        var file;

        // Only call the handler if 1 or more files was dropped.
        if (event.target.files.length > 0) {

            file = event.target.files[0];

            // check if the file type is in accept list
            this.fireEvent('beginload');
            var sOutput, nBytes;
            nBytes = file.size;

            for (var aMultiples = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
                sOutput = nApprox.toFixed(1) + " " + aMultiples[nMultiple];
            }

            this.setHtml(" Name: " + file.name + " size: " + sOutput);

            this.attachmentLoaded(file);
        
        }

    },

    attachmentLoaded: function (vFile) {
        var value,
            reader = new FileReader(),
            file = vFile,
            me = this;    

        reader.onload = function (evt) {
            var objReturn = {
                fileName: file.name,
                data: reader.result,
                dateCreated: file.lastModifiedDate
            };

            me.setValue(objReturn);

        };
        reader.readAsDataURL(file);

        // show the clear button if needed
        this.down('#clrBtn').setHidden(false);       

        this.fireEvent('load', this);

    },

    clearFile: function () {

        // clear the value
        this.setValue('');
        this.setHtml('');
                
        // hide the clear button
        this.down('#clrBtn').setHidden(true);
                
    },
        
    hideClearButton: function () {
        this.down('#clrBtn').setHidden(true);
    }

});

