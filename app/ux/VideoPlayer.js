//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.VideoPlayer', {
    extend: 'Ext.Container',
    alias: 'widget.videoplayer',

    config: {
        items: [{
            html: '<video style="width: 100%"></video>'
        }, {
            cls: "msg-body",
            itemId: "mediaControls",
            layout: 'hbox',
            items: [
                {
                    xtype: "button",
                    itemId: "btnPlay",
                    iconCls: "play1",
                    iconMask: true,
                    flex: 1
                }, {
                    xtype: "slider",
                    itemId: "slider",
                    value: 0,
                    minValue: 0,
                    maxValue: 100,
                    flex: 8
                }, {
                    xtype: "container",
                    styleHtmlContent: true,
                    flex: 8,
                    itemId: "timeLabel",
                    hidden: Ext.os.is.Android,
                    html: "<h2>loading...</h2>"
                }
            ]
        }],

        href: '',
        type: ''
    },

    _buttons: {},

    initialize: function () { },

    _setupControls: function () {

        this._buttons.play = this.down("#btnPlay");

        this._buttons.play.on('tap', this.togglePlaying, this);

        this._video = this.element.dom.querySelector('video');
        this._video.src = this.getHref();

        console.debug("video: " + this._video);

    },
    togglePlaying: function () {
        var me = this;

        if (this._playing) {

            this._buttons.play.setIconCls("play1");

            this._playing = false;
            this._video.pause();
            this._video.currentTime = 0;

        } else {

            this._buttons.play.setIconCls("stop");
            this._playing = true;

            this._video.onended = function () {
                me.togglePlaying();
            };

            this._video.play();

            this.AddMediaEvents(this._video);
        }

    },

    AddMediaEvents: function (ctl) {
        var me = this;

        // fired when loaded and know duration
        ctl.addEventListener("loadedmetadata", function (e) {
            e.currentTarget.currentTime = 0.01;
        });

        // fired during play back to update position
        ctl.addEventListener("timeupdate", function (e) {
            me.setDuration(e);
        });

        // fired when error loading
        ctl.addEventListener("error", function (e) {
            console.debug("Error loading media", e);
        });

        // fired when end of audio reached
        ctl.addEventListener("ended", function (e) {

            var btnPlay = me.down("#play");
            if (btnPlay) {
                btnPlay.setIconCls("play1");
            }
            e.currentTarget.currentTime = 0;

        });

        // fired when stalled
        ctl.addEventListener("stalled", function (e) { });

        ctl.addEventListener("loadeddata", function (e) { });

        ctl.addEventListener("canplay", function (e) { });

        ctl.addEventListener("canplaythrough", function (e) { });

        objSlider = this.down("#slider");
        if (objSlider) {
            objSlider.on("change", function (slider) {
                var aCtl = me._video;
                aCtl.currentTime = slider.getValue();
            }, this);
        }

    },

    // this should be seperate function
    setDuration: function (e) {
        var intTime, intDur, strTime, strDur, timeLabel, objSlider;

        try {

            intTime = e.currentTarget.currentTime;
            intDur = e.currentTarget.duration;

            timeLabel = this.down("#timeLabel");
            if (timeLabel) {

                strTime = Math.floor(intTime / 60) + ":" + this.lpad(Math.floor(intTime % 60), 2);
                strDur = Math.floor(intDur / 60) + ":" + this.lpad(Math.floor(intDur % 60), 2);

                timeLabel.setHtml('<h2>' + strTime + "/" + strDur + '</h2>');

            }

            objSlider = this.down("#slider");
            if (objSlider) {
                objSlider.setMaxValue(intDur);
                objSlider.setValue(intTime);
            }

        } catch (ex) {
            console.error("Messages.Detail.SetDuration() Error", ex.message);
        }

    },

    lpad: function (string, length) {
        string = string.toString();
        while (string.length < length) {
            string = "0" + string;
        }
        return string;
    }


});

