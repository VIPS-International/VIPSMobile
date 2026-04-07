//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.Localization', {
    alternateClassName: ['loc'],
    singleton: true,

    requires: ['Ext.Ajax'],

    config: {
        strings: {}
    },

    constructor: function (config) {
        this.initConfig(config);
        VIPSMobile.getString = this.string;
        this.loadLanguage();
    },

    loadLanguage: function (index) {
        var lang, strings;

        if (!index) {
            index = 0;
            languages = Ext.Array.clone(navigator.languages);

            // could add community and/or customer number to load custom language
            //Ext.Array.insert(languages, 0, VIPSMobile
        }

        if (index < navigator.languages.length) {

            lang = navigator.languages[index];
            lang = lang.substr(0, lang.indexOf('-'));

            // load the language json
            Ext.Ajax.request({
                url: "services/" + 'lang/' + lang + '.json',
                scope: this,
                success: function (response) {

                    // check if anything returned
                    if (response.responseText.trim().length > 0) {

                        strings = Ext.JSON.decode(response.responseText, true);
                        if (strings) { this.setStrings(strings); }

                    }

                },
                failure: function () {

                    // file doesn't so check next language
                    this.loadLanguage(++index);

                }
            });
        }

    },

    string: function (value) {
        var retVal = VIPSMobile.util.Localization.getStrings()[value];
        return retVal || value;
    }

});
