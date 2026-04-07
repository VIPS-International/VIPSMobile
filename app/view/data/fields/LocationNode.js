//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

// ListSQL: SELECT ID, Label, Info, Lat, Long, pinType, pinSettings

Ext.define('VIPSMobile.view.data.fields.LocationNode', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        panel: 'right',
        layout: 'fit',
        geo: null,
        bounds: null,
        location: null,
        marker: null,
        circle: null,
        selectedItems: [],
        cls: 'rightpanel',

        items: [{
            xtype: 'container',
            layout: 'hbox',
            docked: 'top',
            style: 'background:white',
            items: [{
                itemId: 'locationLabel',
                style: 'margin: .5em',
                flex: 3
            }, {
                xtype: 'button',
                iconCls: 'refresh',
                iconMask: true,
                flex: 1,
                itemId: 'RefreshLocation',
                ui: 'action',
                text: 'Refresh Location'
            }]
        }, {
            xtype: 'map',
            itemId: 'field',
            useCurrentLocation: false,
            mapOptions: {
                zoom: 14
            }
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            docked: 'bottom',
            margin: '0.5em 0 0 0'
        }]
    },

    statics: {
        getTypedValue: function (value) {
            return VIPSMobile.Main.getLocation();
        },

        getFormattedValue: function (node) {
            var geo = node.get("Value"),
                strReturn;

            if (!node.get('Value')) {
                node.set('Value', '');
                strReturn = '';
            } else if (geo === "NOW") {
                var tempLoc = VIPSMobile.Main.getLocation();

                if (tempLoc) {
                    strReturn = 'Location: ' + tempLoc.latitude + ',' + tempLoc.longitude;
                }

            } else if (geo) {
                strReturn = 'Location: ' + geo.latitude + ',' + geo.longitude;
            }

            return strReturn;
        },

        setupMap: function (scope) {
            if (google && google.maps) {
                scope.setBounds(google.maps.LatLngBounds());

                scope.setGeo(Ext.create('Ext.util.Geolocation', {
                    autoUpdate: false,
                    timeout: 500,
                    allowHighAccuracy: true,
                    listeners: {
                        locationupdate: {
                            fn: scope.setPosition,
                            scope: scope
                        }
                    }
                }));

                scope.getField().setMapOptions({
                    zoom: 14
                });

                scope.mapRenderer = new google.maps.DirectionsRenderer();
                scope.mapRenderer.setMap(scope.getField().getMap());

                scope.getGeo().updateLocation();
            } else {
                setTimeout()
            }
            

        }

    },

    setup: function (controller, node) {

        // call parent setup

        VIPSMobile.view.data.fields.LocationNode.setupMap(this);

        this.callParent(arguments);

        this.down('#RefreshLocation').on('tap', function () { this.getGeo().updateLocation() }, this);

    },

    setPosition: function (geo) {

        var map = this.getField().getMap(),
            point, marker, infoEvent, label, circle, loc;

        if (this.getMarker()) { this.getMarker().setMap(null); }
        if (this.getCircle()) { this.getCircle().setMap(null); }

        loc = {
            accuracy: geo.getAccuracy(),
            lastUpdate: new Date(geo.getTimestamp()),
            latitude: geo.getLatitude(),
            longitude: geo.getLongitude(),
            speed: geo.getSpeed()
        }
        this.setLocation(loc);

        // make sure the point is in the bounds to display
        point = { lat: geo.getLatitude(), lng: geo.getLongitude() };
        this.getBounds().extend(point);

        strInfo = ['Your Location',
            loc.latitude + ', ' + loc.longitude,
            'LastUpdate: ' + loc.lastUpdate.toLocaleDateString() + ' ' + loc.lastUpdate.toLocaleTimeString(),
            'Accuracy: ' + loc.accuracy + ' meters'
        ].join('<br />');

        this.down('#locationLabel').setHtml(strInfo);

        // add the marker to the map
        marker = new google.maps.Marker({
            position: point,
            map: map,
            zIndex: 1,
            info: strInfo
        });

        if (geo.getAccuracy() > 0) {

            circle = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35,
                map: map,
                center: point,
                radius: geo.getAccuracy()
            });
        };

        // if items are selectable, add event to listen for click
        infoEvent = 'click';

        // if have info, add event to display it
        if (marker.info) {
            marker.addListener(infoEvent, function (e) {
                if (!this.infoWindow) {
                    this.infoWindow = new google.maps.InfoWindow({ content: this.info });
                }
                this.infoWindow.open(map, this);
            }, this);
        }

        this.getField().getMap().fitBounds(this.getBounds());
        this.getField().getMap().setZoom(14);

        this.setMarker(marker);
        this.setCircle(circle);

    },

    getValue: function () {
        return this.getLocation();
    },

    setValue: function (value) {
        this.getGeo().updateLocation();
    }

});
