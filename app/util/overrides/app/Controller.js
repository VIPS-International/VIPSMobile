//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.app.Controller', {
    override: 'Ext.app.Controller',

    init: function () {

        this.createStoreFunctions();
        this.createControllerFunctions();

        this.callParent(arguments);

    },
    ref: function (refs) {
        var me = this,
            refName, getterName, selector, info;

        console.debug("refs", refs);

        for (refName in refs) {
            selector = refs[refName];
            getterName = "get" + Ext.String.capitalize(refName);
            console.debug(getterName);

            if (!this[getterName]) {
                if (Ext.isString(refs[refName])) {
                    info = {
                        ref: refName,
                        selector: selector
                    };
                } else {
                    info = refs[refName];
                }

                this[getterName] = function (refName, info) {
                    var args = [refName, info];
                    return function () {
                        return me.getRef.apply(me, args.concat.apply(args, arguments));
                    };
                }(refName, info);
            }

            this.references = this.references || [];
            this.references.push(refName.toLowerCase());
        }
    },
    // get the section for the controller
    getSection: function () {
        var section;

        section = this.self.getName();
        section = section.substring(section.lastIndexOf('.') + 1);

        return section;

    },

    createStoreFunctions: function () {

        this.storesCache = {};

        Ext.iterate(this.getStores(), function (strStoreName) {
            var strFunc;

            strStoreName = strStoreName.substring(strStoreName.lastIndexOf('.') + 1);
            strFunc = 'get' + strStoreName + 'Store';

            if (!this[strFunc]) {

                this[strFunc] = function () {
                    var StoreName = strStoreName;

                    if (!this.storesCache[StoreName]) {
                        this.storesCache[StoreName] = Ext.getStore(StoreName);
                    }

                    return this.storesCache[StoreName];

                };

            } else {

                console.warn('Controller Override: Function ' + strFunc + '() already defined so not set.');

            }


        }, this);

    },

    createControllerFunctions: function () {

        this.controllerCache = {};

        Ext.iterate(VIPSMobile.controller, function (controller) {
            var strFunc;

            strFunc = 'get' + controller[0].toUpperCase() + controller.substring(1) + 'Controller';

            // check if the function is already defined
            if (!this[strFunc]) {

                this[strFunc] = function () {
                    var StoreName = controller;

                    if (!this.controllerCache[StoreName]) {

                        this.controllerCache[StoreName] = this.getApplication().getController(StoreName);
                    }

                    return this.controllerCache[StoreName];

                };

            } else {

                console.warn('Controller Override: Function ' + strFunc + '() already defined so not set.');
            }

        }, this);

    }

});
