//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.VoiceInput', {
    extend: 'Ext.Container',
    alias: 'widget.VoiceInput',

    config: {

        layout: {
            type: 'vbox'
        },

        items: [{
            xtype: 'container',
            html: '<input type="file" style="width: 6.3em; vertical-align: top;"/>',
            hidden: true
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
                iconCls: 'radio error',
                func: 'Record',
                text: VIPSMobile.getString("Record")
            }, {
                itemId: 'btnPlay',
                iconCls: 'play1',
                func: 'RecordPlay',
                hidden: true,
                text: VIPSMobile.getString("Play")
            }]
        }, {
            html: '<canvas id="analyser" style="width:100%;height:15em"></canvas>'
        }],

        acceptedAttachmentTypes: ['*/*'],
        value: null
    },

    _audioContext: null,
    _inputPoint: null,
    _realAudioInput: null,
    _audioInput: null,
    _analyserNode: null,
    _audioRecorder: null,
    _zeroGain: null,
    _rafID: null,
    _analyserContext: null,
    _canvasWidth: null,
    _canvasHeight: null,
    _recIndex: 0,
    _buttons: {},
    _FormData: null,
    _recording: false,
    _playing: false,
    _audioPlayer: null,
    _currentBLOB: null,

    options: {
        fillStyle: '#F6D565'
        , lineCap: 'round'
        , spacing: 3
        , barWidth: 1
        , _WORKER_PATH: 'recorderWorker.js'
    },

    initialize: function () { },

    clearVoice: function () {

        // clear the value
        this.setValue('');

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

        if (!this._audioRecorder) {

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.getUserMedia = navigator.mediaDevices.getUserMedia;
            }

            if (!navigator.getUserMedia)
                navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if (!navigator.cancelAnimationFrame)
                navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;

            if (!navigator.requestAnimationFrame)
                navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

            var AudioContext = window.AudioContext || window.webkitAudioContext;
            me._audioContext = new AudioContext();

            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            }).then(function (stream) {
                me._gotStream(stream, callback);
            });


        } else {
            me._updateAnalysers();
            if (callback) {

                callback.apply(me);
            }
        }
    },


    _gotStream: function (stream, callback) {
        this._inputPoint = this._audioContext.createGain();

        // Create an AudioNode from the stream.
        this._realAudioInput = this._audioContext.createMediaStreamSource(stream);
        this._audioInput = this._realAudioInput;
        this._audioInput.connect(this._inputPoint);

        this._analyserNode = this._audioContext.createAnalyser();
        this._analyserNode.fftSize = 2048;
        this._inputPoint.connect(this._analyserNode);

        this._audioRecorder = new this._Recorder(this._inputPoint, this.options);

        this._zeroGain = this._audioContext.createGain();
        this._zeroGain.gain.value = 0.0;
        this._inputPoint.connect(this._zeroGain);
        this._zeroGain.connect(this._audioContext.destination);
        this._updateAnalysers();

        if (callback) {
            callback.apply(this);
        }

    },

    _updateAnalysers: function (time) {

        var canvas, numBars, freqByteData,
            multiplier, magnitude, magnitude2, i, offset,
            SPACING = this.options.spacing,
            BAR_WIDTH = this.options.barWidth,
            me = this;

        if (!this._analyserContext) {
            canvas = document.getElementById("analyser");
            this._canvasWidth = canvas.width;
            this._canvasHeight = canvas.height;
            this._analyserContext = canvas.getContext('2d');
        }

        // analyzer draw code here
        {
            numBars = Math.round(this._canvasWidth / SPACING);
            freqByteData = new Uint8Array(this._analyserNode.frequencyBinCount);

            this._analyserNode.getByteFrequencyData(freqByteData);

            this._analyserContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
            this._analyserContext.fillStyle = this.options.fillStyle;
            this._analyserContext.lineCap = this.options.lineCap;
            multiplier = this._analyserNode.frequencyBinCount / numBars;

            // Draw rectangle for each frequency bin.
            for (i = 0; i < numBars; ++i) {
                magnitude = 0;
                offset = Math.floor(i * multiplier);
                // gotta sum/average the block, or we miss narrow-bandwidth spikes
                for (j = 0; j < multiplier; j++) {
                    magnitude += freqByteData[offset + j];
                }
                magnitude = magnitude / multiplier;
                magnitude2 = freqByteData[i * multiplier];
                this._analyserContext.fillStyle = "hsl( " + Math.round((i * 360) / numBars) + ", 100%, 50%)";
                this._analyserContext.fillRect(i * SPACING, this._canvasHeight, BAR_WIDTH, -magnitude);
            }
        }

        this._rafID = requestAnimationFrame(function (time) { me._updateAnalysers(time) });

    },

    _Recorder: function (source, cfg) {
        var config = cfg || {};
        var bufferLen = config.bufferLen || 4096;
        this.context = source.context;
        if (!this.context.createScriptProcessor) {
            this.node = this.context.createJavaScriptNode(bufferLen, 2, 2);
        } else {
            this.node = this.context.createScriptProcessor(bufferLen, 2, 2);
        }

        var worker = new Worker(config._WORKER_PATH);
        worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.context.sampleRate
            }
        });
        var recording = false,
            currCallback;

        this.node.onaudioprocess = function (e) {
            if (!recording) return;
            worker.postMessage({
                command: 'record',
                buffer: [
                    e.inputBuffer.getChannelData(0),
                    e.inputBuffer.getChannelData(1)
                ]
            });
        };

        this.configure = function (cfg) {
            for (var prop in cfg) {
                if (cfg.hasOwnProperty(prop)) {
                    config[prop] = cfg[prop];
                }
            }
        };

        this.record = function () {
            recording = true;
        };

        this.stop = function () {
            recording = false;
        };

        this.clear = function () {
            worker.postMessage({ command: 'clear' });
        };

        this.getBuffers = function (cb) {
            currCallback = cb || config.callback;
            worker.postMessage({ command: 'getBuffers' })
        };

        this.exportWAV = function (cb, type) {
            currCallback = cb || config.callback;
            type = type || config.type || 'audio/wav';
            if (!currCallback) throw new Error('Callback not set');
            worker.postMessage({
                command: 'exportWAV',
                type: type
            });
        };

        this.exportMonoWAV = function (cb, type) {
            currCallback = cb || config.callback;
            type = type || config.type || 'audio/wav';
            if (!currCallback) throw new Error('Callback not set');
            worker.postMessage({
                command: 'exportMonoWAV',
                type: type
            });
        };

        worker.onmessage = function (e) {
            var blob = e.data;
            currCallback(blob);
        };

        source.connect(this.node);
        this.node.connect(this.context.destination);   // if the script node is not connected to an output the "onaudioprocess" event is not triggered in chrome.
    },

    _setupDownload: function (blob, filename) {
        var url = (window.URL || window.webkitURL).createObjectURL(blob),
            a = new FileReader(),
            me = this;

        this._FormData = new FormData();
        this._FormData.append('fname', filename);
        this._FormData.append('data', url);

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

    _gotBuffers: function (buffers) {
        var me = this;

        this._buttons.play.setHidden(false);
        this._data = buffers[0];

        this._drawBuffer();

        // the ONLY time gotBuffers is called is right after a new recording is completed - 
        // so here's where we should set up the download.
        this._audioRecorder.exportWAV(function (b) {
            me._doneEncoding(b);
        });
    },

    _doneEncoding: function (blob) {
        this._setupDownload(blob, "myRecording" + ((this._recIndex < 10) ? "0" : "") + this._recIndex + ".wav");
        this._recIndex++;
    },

    _cancelAnimation: function () {
        if (this._rafID) {
            this._analyserContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
            window.cancelAnimationFrame(this._rafID);
            this._rafID = undefined;
        }
    },

    _setupButtons: function () {

        this._buttons = {};
        this._buttons.record = this.down("#btnRecord");
        this._buttons.play = this.down("#btnPlay");

    },

    toggleRecording: function (e) {
        var me = this;

        this._setupButtons();

        if (this._recording) {
            // stop recording
            this._audioRecorder.stop();
            this._audioRecorder.getBuffers(function (b) {
                me._gotBuffers(b);
            });

            this._buttons.record.setText("Record");
            this._buttons.record.setIconCls("radio error");

            this._recording = false;

            this._cancelAnimation();

        } else {
            // start recording
            this._startRecording(function () {

                if (!this._audioRecorder)
                    return;

                this._buttons.record.setText("Stop");
                this._buttons.record.setIconCls("stop");

                this._audioRecorder.clear();
                this._audioRecorder.record();
                this._recording = true;

            });
        }

    },

    togglePlaying: function () {

        if (this._playing) {
            // stop recording

            this._buttons.play.setText("Play");
            this._buttons.play.setIconCls("play1");

            this._playing = false;
            this._audioPlayer.pause();
            this._audioPlayer.currentTime = 0;
            this._audioPlayer = null;

            this._cancelAnimation();
            this._drawBuffer();

        } else {
            // start recording
            if (!this._currentBLOB) {
                return;
            }

            this._buttons.play.setText("Stop");
            this._buttons.play.setIconCls("stop");
            this._playing = true;

            this._audioPlayer = new Audio(this._currentBLOB);
            this._audioPlayer.onended = this.togglePlaying;

            this._audioPlayer.play();

            this._drawBuffer();
            //            this._audioPlayer.ontimeupdate = $.proxy(this._playerTimeUpdate, this);            

        }

    },

    _drawBuffer: function () {
        var context = this._analyserContext,
            step = Math.ceil(this._data.length / this._canvasWidth),
            amp = this._canvasHeight / 2, ctime, duration, per,
            me = this;

        context.fillStyle = "silver";
        context.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
        for (var i = 0; i < this._canvasWidth; i++) {
            var min = 1.0;
            var max = -1.0;
            for (j = 0; j < step; j++) {
                var datum = this._data[(i * step) + j];
                if (datum < min)
                    min = datum;
                if (datum > max)
                    max = datum;
            }
            context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        if (this._audioPlayer) {
            if (this._audioPlayer.currentTime > 0) {
                ctime = this._audioPlayer.currentTime;
                duration = this._audioPlayer.duration;
                per = ctime / duration;
            } else {
                per = 0;
            }

            context.fillStyle = "blue";
            context.fillRect(this._canvasWidth * per, 0, this.options.barWidth, this._canvasHeight);

            this._rafID = requestAnimationFrame(function (time) { me._drawBuffer(time) });

        }
    }

});

