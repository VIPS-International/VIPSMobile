//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.InfoSheet', {
    extend: 'Ext.Container',
    xtype: 'infosheet',

    config: {
        docked: 'bottom',
        height: '1em',
        xtype: 'container',
        itemId: 'info',
        scrollable: {
            direction: 'vertical',
            directionLock: true
        }
    },

    constructor: function () {
        var startY, startHeight,
            itemsHeight = 0;

        this.callParent(arguments);

        this.on('painted', function () {

            //try {

            var handle = this.insert(0, {
                xtype: 'container',
                docked: 'top',
                height: '1em',
                cls: 'infosheet'
            });

            // get the info container
            this.baseHeight = this.element.getHeight();

            Ext.iterate(this.items, function (key, index, obj) {
                itemsHeight += this.items[index].element.getHeight();
            });

            this.thisHeight = this.baseHeight + itemsHeight;

            // get the starting position
            handle.element.on('touchstart', function (e) {
                startY = e.touches[0].pageY;
                startHeight = this.element.getHeight();
            }, this);

            // resize the container as move
            handle.element.on('touchmove', function (e) {
                var height;

                if (startY) {

                    // calculate the new height
                    height = startHeight + startY - e.touches[0].pageY;

                    // check for minimum and maximum size
                    if (height < this.baseHeight) { height = this.baseHeight; }
                    if (height > this.thisHeight) { height = this.thisHeight; }

                    // set the height
                    this.setHeight(height);

                }

            }, this);

            //} catch (ex) {
            //    console.error('VIPSMobile.ux.InfoSheet.painted() Error', ex.message);
            //}


        }, this, { single: true });

    }

});
