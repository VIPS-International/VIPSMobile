//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.MapSymbols', {
    alias: 'MapSymbols',

    config: {
        fillColor: null,
        strokeColor: null,
        blacklist: []
    },

    constructor: function (config) {

        this.initConfig(config);

        // based on the skin, get default colours from div then destroy it
        // var style = window.getComputedStyle(VIPSMobile.Main.getTitlebar().element.dom);
        this.setFillColor('BackColor');
        this.setStrokeColor('FontColor');

        this._symbols = {};

    },

    get: function (name, callback, scope) {

        if (!this._symbols[name]) {
            this.fetchJson(name, callback, scope);
        } else {
            if (callback) {
                callback.apply(scope, [this._symbols[name]]);
            }
        }

    },

    fetchJson: function (name, callback, scope) {

        // clear current values
        this._symbols[name] = {};

        Ext.Ajax.request({
            url: 'resources/mapPins/' + name + '.json',
            scope: this,
            success: function (response, opts) {

                this._symbols[name] = Ext.decode(response.responseText);

                if (callback) { callback.apply(scope, [this._symbols[name]]); }

            },
            failure: function (response, opts) {
                if (callback) { callback.apply(scope, [this._symbols[name]]); }
            }
        });

    }

});
