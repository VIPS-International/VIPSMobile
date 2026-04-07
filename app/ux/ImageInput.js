//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

// Since this probably looks a bit strange, here's an overview of the logic.
// The <input> element can't be styled in browsers.  To get around this, add the element with an opacity of 0 so it's there, but invisible.
// Then add a button which covers the same area as the input field but behind it.  When the user goes to click the button, they are actually
// clicking the invisible input element so works as it should.
Ext.define('VIPSMobile.ux.ImageInput', {
    extend: 'Ext.Container',
    alias: 'widget.ImageInput',

    requires: ['VIPSMobile.util.MegaPixImage'],

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
            text: VIPSMobile.getString('Get Photo'),
            minWidth: '6.1em',
            height: '1.5em',
            ui: 'confirm',
            left: 0,
            top: 0,
            zIndex: 0
        }, {
            xtype: 'button',
            itemId: 'rotateBtn',
            text: VIPSMobile.getString('Rotate'),
            hidden: true,
            height: '1.5em',
            ui: 'action'
        }, {
            xtype: 'button',
            itemId: 'cropBtn',
            text: VIPSMobile.getString('Crop'),
            hidden: true,
            height: '1.5em',
            ui: 'action'
        }, {
            xtype: 'button',
            itemId: 'clrBtn',
            text: VIPSMobile.getString('Clear'),
            height: '1.5em',
            hidden: true,
            ui: 'decline'
        }],

        acceptedAttachmentTypes: ['image/gif', 'image/jpeg', 'image/png'],
        jpegQuality: 0.7,
        maxThumbSize: 128,
        maxValueSize: 640,
        mpiImage: null,
        value: null,
        cropValue: null,
        showCropBotton: false,
        imageNode: null,
        cameraOnly: false,
        clearImage: "<item><fileName>clearimage.jpg</fileName><data>data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=</data>" + 
                "<thumb>data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=</thumb></item>"
    },

    initialize: function () {
        var me;

        me = this;

        // add the thumb image element
        this.addImageElement();

        // add the handler to the File Attachment button;
        this.getInput().onchange = function () {
            me.HandleFileAttachment.apply(me, arguments);
            me.down('#clrBtn').setHidden(false);
            me.down('#rotateBtn').setHidden(false);
            me.down('#cropBtn').setHidden(!me.getShowCropBotton());
        };

        // listen for clear tap
        this.down('#clrBtn').on('tap', this.clearImage, this);
        this.down('#cropBtn').on('tap', this.cropImage, this);
        this.down('#rotateBtn').on('tap', this.rotateImage, this);

    },
    
    ForceCameraOnly: function (cameraOnly){
        var input = this.getInput();  
        
        if(cameraOnly) input.setAttribute("capture", "capture");
    },

    // get the html controls
    getInput: function () {
        try {
            return this.element.dom.querySelector('input');
        } catch (ex) {
            console.error('ImageInput.getInput() Error', ex.message);
        }
    },
    getThumb: function () {
        try {
            return this.element.dom.querySelector('img');
        } catch (ex) {
            console.error('ImageInput.getThumb() Error', ex.message);
        }
    },

    updateAcceptedAttachmentTypes: function () {
        //this.getInput().accept = this.getAcceptedAttachmentTypes().join(',');
    },
    updateValue: function () {
        this.down('#clrBtn').setHidden(false);
        this.down('#rotateBtn').setHidden(false);
        this.down('#cropBtn').setHidden(!this.getShowCropBotton());

        this.fireEvent('change', this, this.getValue());
    },

    HandleFileAttachment: function (event) {
        var file;

        // Only call the handler if 1 or more files was dropped.
        if (event.target.files.length > 0) {

            file = event.target.files[0];

            // check if the file type is in accept list
            if (this.getAcceptedAttachmentTypes().indexOf(file.type) > 0) {

                this.fireEvent('beginload');

                // load the image
                this.setMpiImage(Ext.create('MegaPixImage', {
                    fileName: file.name,
                    srcImage: file,
                    listeners: {
                        load: {
                            fn: this.attachmentLoaded,
                            scope: this
                        }
                    }
                }));

            }

        }

    },

    attachmentLoaded: function (mpImg) {
        var value;

        // render the thumbnail
        if (this.getMaxThumbSize() > 0) {
            mpImg.render(this.getThumb(), {
                maxWidth: this.getMaxThumbSize(),
                maxHeight: this.getMaxThumbSize()
            });
        }

        // get the resized image as data url
        value = mpImg.getImageInfo({
            maxWidth: this.getMaxValueSize(),
            maxHeight: this.getMaxValueSize(),
            quality: this.getJpegQuality()
        });
        this.setValue(value);

        // show the clear button if needed
        //this.down('#clrBtn').setHidden(false);       

        this.fireEvent('load', this);

    },

    showFullSizeImage: function () {
        var height, width, ratio, cntImage;

        // check if image is larger than document size
        if (this.getValue().height > window.document.height || this.getValue().width > window.document.width) {

            // adjust width
            ratio = window.document.width / this.getValue().width;
            width = window.document.width;
            height = this.getValue().height * ratio;

            // adjust height if needed
            if (height > window.document.height) {
                ratio = window.document.height / height;
                height = window.document.height;
                width = width * ratio;
            }

        } else {

            // show full size
            height = this.getValue().height;
            width = this.getValue().width;

        }

        // image needs to be in a container for modal
        cntImage = Ext.create('Ext.Container', {
            modal: true,
            hideOnMaskTap: true,
            centered: true,
            items: [{
                xtype: 'image',
                itemId: 'fullsizeImg',
                height: height,
                width: width,
                src: this.getValue().data,
                listeners: {
                    tap: function () {
                        this.getParent().hide();
                    }
                }
            }],
            listeners: {
                hide: function () {
                    this.destroy();
                }
            }
        });

        // show the image
        Ext.Viewport.add(cntImage);

    },

    // add the image element for the thumbnail
    // done on start up or whenever the clear button is tapped
    addImageElement: function () {

        try {

            this.insert(2, {
                xtype: 'container',
                itemId: 'thumbContainer',
                html: '<img id="thumb" />',
                margin: '0 0.2em',
                style: 'overflow: hidden;',
                listeners: {
                    tap: {
                        element: 'element',
                        fn: this.showFullSizeImage,
                        scope: this
                    }
                }
            });

        } catch (ex) {
            console.error('ImageInput.addImageElement() Error', ex.message);
        }

    },

    clearImage: function () {
                // clear the value
        this.setValue(this.getClearImage());

        // need to destroy the image element and readd it
        this.down('#thumbContainer').destroy();
        this.addImageElement();

        // hide the clear button
        this.down('#clrBtn').setHidden(true);
        this.down('#rotateBtn').setHidden(true);
        this.down('#cropBtn').setHidden(true);

    },

    cropImage: function () {
        var ic, c, ctx, cropDoneBtn, me = this;
        me.down('#cropBtn').setHidden(true);
        me.getParent().down('#saveBtn').setHidden(true);


        ic = new ICropper(this.getImageNode(), {
            ratio: 1
            , onComplete: function (info) {
                c = document.createElement("canvas");
                c.width = info.w;
                c.height = info.h;
                ctx = c.getContext("2d");
                //console.log(info);
                ctx.drawImage(this.imageNode, info.l, info.t, info.w, info.h, 0, 0, info.w, info.h);
                me.setCropValue(c.toDataURL("image/jpeg", 0.8));
                console.log(c.toDataURL("image/jpeg", 0.8));
                c = ctx = null;

            }
        });

        cropDoneBtn = this.add({
            xtype: 'button',
            itemId: 'cropDoneBtn',
            text: 'Save Crop',
            height: '1.5em',
            ui: 'decline'
        });

        cropDoneBtn.on('tap', function () {

            me.down('#cropBtn').setHidden(false);
            me.getParent().down('#saveBtn').setHidden(false);

            me.setValue(me.getCropValue());
            var img = Ext.getCmp(me.getImageNode()).element.query('img')[0];
            Ext.getCmp(me.getImageNode()).setWidth = img.naturalWidth;
            Ext.getCmp(me.getImageNode()).setHeight = img.naturalHeight;


            // delete the crop done
            this.destroy();
            ic.destroy();
        });

    },
    
    rotateImage: function() {
        console.log("Rotate");
        var imgEL = new Image();
            me = this,
            value = this.convertValuetoObject(this.getValue());

        imgEL.addEventListener("load", function (e) {
            var img = e.target,            
            imgWidth = img.naturalWidth,
            imgHeight = img.naturalHeight;

            var c = document.createElement("canvas");
            c.width = imgHeight;
            c.height = imgWidth;

            var ctx = c.getContext("2d");
            //console.log(info);
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -imgHeight);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            rotatedData = c.toDataURL("image/jpeg", 0.8);
            value.data = rotatedData;
            
            //remder for thumbnail
            var thumbWidth = 64,
                thumbHeight = (imgHeight * thumbWidth / imgWidth) << 0,
                thumbC = document.createElement("canvas");
                
            thumbC.width = thumbHeight;
            thumbC.height = thumbWidth;
            
            var thumbCtx = thumbC.getContext('2d');

            thumbCtx.rotate(0.5 * Math.PI);
            thumbCtx.translate(0, -thumbHeight);
            thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            
            thumbnailData = thumbC.toDataURL("image/jpeg", 0.8);
            value.thumb = thumbnailData;

            me.setValue(value);
            me.getThumb().src = thumbnailData;
            
            me.updateValue();
             
            c = ctx = null;
            thumbC = thumbCtx = null;

        });
        imgEL.src = value.data;
        
    },

    hideClearButton: function () {
        this.down('#clrBtn').setHidden(true);
    },

    convertValuetoObject: function (value) {
        var objValue;
        
        if (typeof value === "string" && value !== '' && value.substring(0, 1) === "{") {
            objValue = Ext.JSON.decode(value);            
        }
        if (typeof value === "string" && value !== '' && value.substring(0, 1) === "<") {
            objValue = XML.parse(value);            
        } else if (value && value.data) {
            objValue = value;
        }

        return objValue;

    }

});

