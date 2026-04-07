//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.util.Geolocation', {
    override: 'Ext.util.Geolocation'

    , watchId: null

    , updateLocation: function (callback, scope, positionOptions) {
        var failFunction, me = this,
            provider = me.getProvider();
        if (VIPSMobile.Conn.SQLPlugin) {
            SQLPlugin.getCurrentPosition().then(function (position) {
                me.fireUpdate(position);
                if (callback) {
                    callback.call(scope || me, me, me); //last parameter for legacy purposes
                }
            });
        } else {
            failFunction = function (message, error) {
                if (error) {
                    me.fireError(error);
                }
                else {
                    me.fireEvent('locationerror', me, false, false, true, message);
                }
                if (callback) {
                    callback.call(scope || me, null, me); //last parameter for legacy purposes
                }
            };

            if (!provider) {
                failFunction(null);
                return;
            }

            try {

                if (!me.watchId) {

                    me.timeout = setTimeout(function () {
                        console.log('stop trying for position watchId: ' + me.watchId);
                        provider.clearWatch(me.watchId);
                        me.watchId = null;
                    }, 60000); // try to get a location for X seconds then give up

                    me.watchId = provider.watchPosition(
                        //success callback                        
                        function (position) {
                            me.fireUpdate(position);
                            if (callback) {
                                callback.call(scope || me, me, me); //last parameter for legacy purposes
                            }
                            provider.clearWatch(me.watchId);
                            console.log('clearing timeout: ' + me.timeout);
                            clearTimeout(me.timeout);
                            console.log('clearing watchId: ' + me.watchId);
                            me.watchId = null;
                        },
                        //error callback
                        function (error) {
                            // load the call flow but keep trying to get a location
                            failFunction(null, error);
                        },
                        positionOptions || me.parseOptions()
                    );

                } else {
                    console.log('already getting location with: ' + me.watchId);
                    failFunction('already getting location with: ' + me.watchId);
                }

            }
            catch (e) {
                failFunction(e.message);
            }
        }
    }
});
