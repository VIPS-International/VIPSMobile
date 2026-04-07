//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

// Since this probably looks a bit strange, here's an overview of the logic.
// The <input> element can't be styled in browsers.  To get around this, add the element with an opacity of 0 so it's there, but invisible.
// Then add a button which covers the same area as the input field but behind it.  When the user goes to click the button, they are actually
// clicking the invisible input element so works as it should.
Ext.define('VIPSMobile.ux.VideoInput', {
    extend: 'Ext.Container',
    alias: 'widget.VideoInput',

    config: {

        layout: {
            type: 'vbox'
        },

        items: [{
            xtype: 'container',
            html: '<input type="file" style="width: 6.3em; vertical-align: top;"/>',
            hidden: true
        }, {
            html: '<video id="videoPlayer" volume="0" style="width:100%;height:20em"></video>'
        }, {
            xtype: 'container',
            itemId: 'controls',
            layout: {
                type: 'hbox'
            },
            defaults: {
                iconMask: true,
                xtype: 'button'
            },
            items: [{
                itemId: 'btnRecord',
                iconCls: 'radio',
                func: 'Record',
                text: VIPSMobile.getString("Record")
            }]
        }],

        acceptedAttachmentTypes: ['*/*'],
        value: null
    },

    _videoContext: null,
    _videoRecorder: null,
    _buttons: {},
    _shouldStop: false,
    _recording: false,
    _videoPlayer: null,
    _currentBLOB: null,
    _options: { mimeType: 'video/mp4' },

    init: function (callback) {
        var me = this;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.getUserMedia = navigator.mediaDevices.getUserMedia;
        }

        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;

        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

        this._videoContext = document.getElementById("videoPlayer");

        navigator.getUserMedia({
            video: true,
            audio: false
        }).then(function (stream) {
            me._gotStream(stream, callback);
        }).catch(function (ex) {
            Ext.Msg.alert(ex.message);
            throw ex;
        });

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

    _startRecording: function (callback) {
        var me = this;
        const recordedChunks = [];

        this._videoRecorder = new MediaRecorder(this._videoContext.srcObject, this._options);
        this._videoRecorder.addEventListener('dataavailable', function (e) {
            if (me._recording === true && e.data.size > 0) {
                recordedChunks.push(e.data);
            }

            if (me._shouldStop === true && me._recording === true) {
                me._recording = false;
                me._videoContext.srcObject = null;
            }
        });

        this._videoRecorder.addEventListener('stop', function () {
            me._setupDownload(new Blob(recordedChunks), "video.mp4");
        });

        if (callback) {
            callback.apply(this);
        }

    },


    _gotStream: function (stream, callback) {
        var me = this;

        this._videoContext.srcObject = stream;
        this._videoContext.volume = 0; // stop feed back issues
        this._videoContext.play();

        if (callback) {
            callback.apply(this);
        }
    },

    _setupDownload: function (blob, filename) {
        var url = (window.URL || window.webkitURL).createObjectURL(blob),
            a = new FileReader(),
            me = this;

        this._currentBLOB = url;

        a.onload = function (e) {
            var objReturn = {
                fileName: filename,
                data: e.target.result,
                dateCreated: DataFunc.getdate()
            };

            me.setValue(objReturn);
        };
        a.readAsDataURL(blob);

    },

    _setupButtons: function () {

        this._buttons = {};
        this._buttons.record = this.down("#btnRecord");

    },

    toggleRecording: function (e) {
        var me = this;

        this._setupButtons();

        if (this._recording) {

            this._buttons.record.setText("Record");
            this._buttons.record.setIconCls("radio");

            // stop recording
            this._shouldStop = true;
            this._videoRecorder.stop();

        } else {

            if (!this._videoContext.srcObject) {
                //the videoContext might be null, if a re-record
                this.init(this.toggleRecording);
            } else {
            // start recording
                this._startRecording(function () {

                    if (!this._videoRecorder)
                        return;

                    this._buttons.record.setText("Stop");
                    this._buttons.record.setIconCls("stop");

                    this._videoRecorder.start();
                    this._recording = true;
                    this._shouldStop = false;

                });
            }
        }
    }

});

