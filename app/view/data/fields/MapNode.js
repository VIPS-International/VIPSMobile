//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

// ListSQL: SELECT ID, Label, Info, Lat, Long, pinType, pinSettings

Ext.define('VIPSMobile.view.data.fields.MapNode', {
    extend: 'VIPSMobile.view.data.Detail',

    requires: ['VIPSMobile.util.MapSymbols'],

    config: {
        panel: 'right',
        layout: 'fit',
        bounds: null,
        mapInitialized: null,
        selectedItems: [],
        cls: 'rightpanel',

        items: [{
            xtype: 'map',
            itemId: 'field',
            useCurrentLocation: false,
            mapoptions: {
                zoom: 12
            },
            mapListeners: {
                idle: function (obj) {                     
                    if(!obj.getParent().getMapInitialized() && obj.getParent().getNode()) {
                        console.log('Map Idle');
                        obj.getParent().initMap.apply(obj.getParent());
                    }
                }
            }
        }]
    },

    statics: {

        getFormattedValue: function (node) {
            var strReturn = '';
            if (!node.get('Value')) { 
                node.set('Value', '');
                strReturn = '';
            }
            if (node.get('Options')) {
                strReturn = node.get('Options').length + ' locations on map';
            } else {
                strReturn = 'No locations';
            }

            return strReturn;
        },

        convertListOption: function (option) {
            return {
                id: option.Field0,
                label: option.Field1,
                info: option.Field2,
                latitude: option.Field3,
                longitude: option.Field4,
                pinType: option.Field5,
                pinSettings: Ext.decode(option.Field6) || {}
            };
        }

    },

    setup: function (controller, node) {
        // call parent setup
        this.callParent(arguments);
        this.setNode(node);
        
    },

    initMap: function(){
        
        if (!VIPSMobile.MapSymbols) { VIPSMobile.MapSymbols = Ext.create('VIPSMobile.util.MapSymbols'); }
        
        // check if need to get the default colours
        if (!VIPSMobile.view.data.fields.MapNode.PinColours) { this.getDefaultColours(); }
        this.setBounds(new LatLngBounds);

        this.addOptionToMap(this.getNode());

        if( this.getNode().get("Value") !== undefined){
            try {
                var tmpPolyLine =  this.getNode().get("Value");
                if(tmpPolyLine){
                    this.setPolyLine(tmpPolyLine);
                }                
            } catch (error) {
                console.log("unable to set Polyline", error);
            }            
        }        
        
        this.setMapInitialized(true);
        
    },

    getDefaultColours: function () {
        var pinSettingsCmp, style;

        pinSettingsCmp = Ext.Viewport.add({
            xtype: 'container',
            cls: 'mapPinSettings',
            left: 0,
            top: -1000,
            hidden: false
        });
        pinSettingsCmp.show();

        // get the div class's propertys
        style = window.getComputedStyle(pinSettingsCmp.element.dom);
        VIPSMobile.view.data.fields.MapNode.PinColours = {
            stroke: style.color,
            fill: style.backgroundColor
        };

        // destroy the div
        pinSettingsCmp.destroy();

    },

    addOptionToMap: function (node, index) {
        var map = this.getField().getMap(), opt;

        // check if first call
        if (!index) {

            index = 0;

            // add listeners for when the map changes to remember them for redisplay of node
            node.mapOptions = {};
            google.maps.event.addListener(map, 'center_changed', function () { node.mapOptions.center = map.getCenter(); });
            google.maps.event.addListener(map, 'zoom_changed', function () { node.mapOptions.zoom = map.getZoom(); });
        }

        // check if any more options to add
        if (index < node.get('Options').length) {

            opt = node.get('Options')[index];

            opt.pinType = opt.pinType || 'BasicPin';

            // add the marker if lat/long set
            if (opt.latitude && opt.longitude) {

                this.addSymbolToMap(node, undefined, index);

            } else {

                // add the next option
                this.addOptionToMap(node, ++index);

            }

        } else {

            // change map bounds to contain all the points
            if (node.mapOptions.bounds) {
                map.setCenter(node.mapOptions.center);
                map.setZoom(node.mapOptions.zoom);
            } else {
                this.fitMapToOptions();
            }

        }

    },

    addSymbolToMap: function (node, symbol, index) {
        var map = this.getField().getMap(),
            opt = node.get('Options')[index],
            point, marker, infoEvent, label, pinElement;

        // make sure the point is in the bounds to display
        point = { lat: parseFloat(opt.latitude), lng: parseFloat(opt.longitude) };
        this.getBounds().extend(point);

     
        if (opt.label === 'index') {
            label = (index + 1).toString();
        } else {
            label = opt.label;
        }

        // add the marker to the map
        pinElement = new PinElement({
            glyph: label,
            glyphColor: 'white',
            background: opt.pinSettings.background || 'red',
            borderColor: opt.pinSettings.background || 'white'
        })
        marker = new AdvancedMarkerElement({
            position: point,
            content: pinElement.element,
            title: opt.info,
            map: map
        });
                
        // if items are selectable, add event to listen for click
        infoEvent = 'click';

        // if have info, add event to display it
        if (marker.title) {
            marker.addListener(infoEvent, function (e) {
                if (!this.infoWindow) {
                    this.infoWindow = new google.maps.InfoWindow({ content: this.title });
                }
                this.infoWindow.open(map, this);
            }, this);
        }

        // add the next option
        this.addOptionToMap(node, ++index);

    },

    fitMapToOptions: function () {
        var map = this.getField().getMap();

        if (!map.getBounds()) {
            map.fitBounds(this.getBounds());
        } else {
            // not sure why need to wait for painted second time but this fixes issue of it showing Antarctica
            this.getField().getMap().fitBounds(this.getBounds()); //.setMapCenter(this.getBounds().getCenter());                        
        }
    },

    setPolyLine: function (encodedPolyline) {
        const objPath = new Polyline({
            path: MapsEncoding.decodePath(encodedPolyline),            
        })
        objPath.setMap(this.getField().getMap());
    },

    getValue: function () {
        return this.getSelectedItems();
    },

    setValue: function (value) {
        // make sure it's an array
        if (!Ext.isArray(value)) { value = [value]; }

        this.setSelectedItems(value);

    }

});
