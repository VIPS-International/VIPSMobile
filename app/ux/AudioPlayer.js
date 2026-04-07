//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.AudioPlayer', {
    extend: 'Ext.Container',
    alias: 'widget.audioplayer',

    config: {

        layout: "hbox",
        items: [{
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
            itemId: "timeLabel",
            html: "&nbsp;",
            flex: 8
        }],

        href: '',
        type: ''
    },

    _buttons: {},

    initialize: function () { },

    _setupControls: function () {

        this._buttons.play = this.down("#btnPlay");

        this._buttons.play.on('tap', this.togglePlaying, this);

    },

    togglePlaying: function () {
        var me = this;

        if (this._playing) {
            // stop recording

            this._buttons.play.setIconCls("play1");

            this._playing = false;
            this._audioPlayer.pause();
            this._audioPlayer.currentTime = 0;
            this._audioPlayer = null;

            //this._cancelAnimation();
            //this._drawBuffer();


        } else {

            this._buttons.play.setIconCls("stop");
            this._playing = true;

            this._audioPlayer = new Audio(this.getHref());
            this._audioPlayer.onended = function () {
                me.togglePlaying();
            };

            this._audioPlayer.play();

            //this._drawBuffer();
            //            this._audioPlayer.ontimeupdate = $.proxy(this._playerTimeUpdate, this);            

            this.AddMediaEvents(this._audioPlayer);
        }

    },

    AddMediaEvents: function (ctl, strMsg) {
        var objSlider,
            me = this;

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
            console.debug("Error loading media", JSON.stringify(e));
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
                var aCtl = me._audioPlayer;
                aCtl.currentTime = slider.getValue();
            }, this);
        }

    },

    setDuration: function (e) {
        var intTime, intDur, strTime, strDur, timeLabel, objSlider;

        try {

            intTime = e.currentTarget.currentTime;
            intDur = e.currentTarget.duration;

            timeLabel = this.down("#timeLabel");
            if (timeLabel) {

                strTime = Math.floor(intTime / 60) + ":" + this.lpad(Math.floor(intTime % 60), 2);
                strDur = Math.floor(intDur / 60) + ":" + this.lpad(Math.floor(intDur % 60), 2);

                timeLabel.setHtml(strTime + "/" + strDur);

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

