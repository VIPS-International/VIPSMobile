//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.settings.Location', {
    extend: 'Ext.Map',

    tbConfig: {
        title: VIPSMobile.getString('Location'),
        items: [{
            text: VIPSMobile.getString('Back'),
            ui: 'back action',
            func: 'Back'
        }, {
            text: VIPSMobile.getString('Update Location'),
            func: 'UpdateLocation'
        }, {
            iconCls: 'arrow_down',
            iconMask: true,
            align: 'right',
            func: 'Markers',
            hidden: true
        }]
    },

    fsButton: {
        iconCls: 'left2',
        func: 'Back'
    },

    config: {
        itemId: 'SettingsLocation',
        layout: 'fit',
        panel: 'full',
        useCurrentLocation: true
    },

    circles: {},
    markers: {},
    tasks: {},

    setup: function () {
        var me = this;

        this.setGeo(VIPSMobile.Main.getGeo());

        this.setMapOptions({
            center: { lat: loc.latitude, lng: loc.longitude},
            zoom: 14
        });

        this.mapRenderer = new google.maps.DirectionsRenderer();
        this.mapRenderer.setMap(this.getMap());

        // listen for location changes
        VIPSMobile.Main.getGeo().on({
            'locationerror': function () {
                console.log('location error', arguments);
            },
            'locationupdate': function () {
                //console.log('location update', arguments);
                me.SetUserPosition();
            }
        });

        // if currently have a position, set it
        this.SetUserPosition();

    },

    getMarkerTables: function () {
        var i, allWithLatLong, tbMarkerItems, strStore;

        // always show my position item
        tbMarkerItems = [{
            text: 'Me',
            func: 'ShowMarker',
            table: 'me',
            icon: 'resources/images/Pin_Blue.png'
        }];

        // hardcoded list of which tables have lat/long info
        // could do with SELECT name FROM SQLITE_MASTER WHERE sql LIKE '%Latitude%' AND sql LIKE '%Longitude%'
        allWithLatLong = ['VIPSdboStores'];

        // loop through all the tables to check if have them
        for (i = 0; i < allWithLatLong.length; i++) {

            if (VIPSMobile.SQLTables.exists(allWithLatLong[i])) {

                strStore = allWithLatLong[i];
                strStore = allWithLatLong[i].substring(allWithLatLong[i].lastIndexOf('dbo') + 3);

                tbMarkerItems.push({
                    text: strStore,
                    func: 'ShowMarker',
                    table: allWithLatLong[i],
                    icon: 'resources/images/Pin_Red.png'
                });

            }
        }
        return tbMarkerItems;

    },

    SetUserPosition: function () {
        var loc;

        loc = VIPSMobile.Main.getLocation();

        this.setMapCenter({ lat: loc.latitude, lng: loc.longitude });

        this.SetMarkers('me', [{
            title: 'You',
            zIndex: 100,
            colour: 'Blue',
            anim: 'drop',
            info: ['Your location',
                loc.latitude + ', ' + loc.longitude,
                'Speed:',
                (loc.speed / 3.6) + 'km/h',
                'Accuracy',
                loc.accuracy + ' meters'
            ].join('<br />'),
            location: loc
        }]);


    },

    SetMarkers: function (group, markers) {

        // remove any current markers in group
        this.ClearMarkers(group);

        // sort the markers based on distance
        markers.sort(this.SortMarkers);

        // create all the markers
        this.AnimateMarkers(group, markers, 0);

    },

    // sort markers so unanimated options are first and then by distance
    SortMarkers: function (opt1, opt2) {
        var sort;

        if (!!opt1.anim === !!opt2.anim) { sort = DataFunc.SortOptionsByDistance(opt1, opt2); }
        else { sort = !!opt1.anim - !!opt2.anim; }

        return sort;

    },

    AnimateMarkers: function (group, markers, index) {
        var image, marker, me;

        me = this;

        // set the image to use
        if (!markers[index].colour) {
            markers[index].colour = 'Blue';
        }
        image = 'resources/images/Pin_' + markers[index].colour + '.png';

        // set the animation
        if (markers[index].anim) {
            if (Ext.isString(markers[index].anim)) {
                switch (markers[index].anim.toLowerCase()) {
                    case 'drop': markers[index].anim = google.maps.Animation.DROP; break;
                    case 'bounce': markers[index].anim = google.maps.Animation.BOUNCE; break;
                    default: markers[index].anim = null; break;
                }
            }
        }

        marker = new google.maps.Marker({
            animation: markers[index].anim,
            //icon: image,
            position: { lat: markers[index].location.latitude, lng: markers[index].location.longitude },
            map: this.getMap(),
            title: markers[index].title,
            zIndex: markers[index].zIndex || 0,
            info: markers[index].info
        });

        if (markers[index].location.accuracy > 0) {

            var circle = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35,
                map: this.getMap(),
                center: { lat: markers[index].location.latitude, lng: markers[index].location.longitude },
                radius: markers[index].location.accuracy
            });

            this.circles[group].push(circle);

        };

        google.maps.event.addListener(marker, 'click', function () { me.ShowMarkerInfo(marker); });

        this.markers[group].push(marker);

        // pause and add next marker
        if (index < (markers.length - 1)) {

            if (markers[++index].anim) {

                this.tasks[group] = Ext.create('Ext.util.DelayedTask', function () {
                    this.AnimateMarkers(group, markers, index);
                }, this);
                this.tasks[group].delay(10);

            } else {
                this.AnimateMarkers(group, markers, index);
            }

        } else {

            delete this.tasks[group];

        }

    },

    ShowMarkerInfo: function (marker) {

        if (marker.info) {

            // close open info 
            if (this.markerInfo) { this.markerInfo.close(); }

            this.markerInfo = new google.maps.InfoWindow({
                content: '<div>' + marker.info + '</div>'
            });

            this.markerInfo.open(this.getMap(), marker);

        }

    },

    HasMarkers: function (group) {
        return (this.markers[group] && this.markers[group].length);
    },

    ClearMarkers: function (group) {
        var i;

        // remove any markers from the map
        if (this.markers[group]) {
            for (i = 0; i < this.markers[group].length; i++) {
                this.markers[group][i].setMap(null);
            }
        }

        // remove any markers from the map
        if (this.circles[group]) {
            for (i = 0; i < this.circles[group].length; i++) {
                this.circles[group][i].setMap(null);
            }
        }
        // reset the group
        this.circles[group] = [];
        this.markers[group] = [];

    }

});
