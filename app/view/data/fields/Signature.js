//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.Signature', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {

        items: [{
            xtype: 'button',
            itemId: 'clearsig',
            text: 'Clear',
            ui: 'decline',
            func: 'ClearSig',
            margin: '0.5em 0 0 0'
        }, {
            xtype: 'container',
            itemId: 'canvasCnt',
            cls: 'field-body',
            html: '<canvas id="sigcanvas" style="border: 1px solid black;border-radius: 0.4em;"></canvas>'
        }, {
            xtype: 'button',
            text: 'Ok',
            ui: 'action',
            func: 'Action',
            margin: '0.5em 0 0 0'
        }],

        layout: 'vbox',
        scrollable: 'vertical',
        canvas: null,
        context: null,
        drawing: false,
        lastCoord: null

    },

    statics: {

        getFormattedValue: function (node) {
            var strValue;

            strValue = node.get('Value') || '';

            if (typeof strValue === "string") {
                strValue = '<img src="' + strValue + '" height="64px" />';
                return strValue;
            }

            return "";

        }

    },

    setup: function (controller, node) {
        var scrollable, scroller, height, width;

        try {

            scrollable = this.getScrollable();
            scroller = scrollable.getScroller();
            height = scroller.getSize().y;
            width = scroller.getSize().x;

        } catch (ex) {

            console.error('Error in Signature Node setup()', ex.message);
            return;

        }

        // make sure on screen and rendered before calculating values
        if (height === 0) {

            Ext.defer(function () {
                this.setup(controller, node);
            }, 100, this);

        } else {

            // call parent setup
            this.callParent(arguments);

            height = scroller.getSize().y;
            width = scroller.getSize().x;

            this.setupCanvas(node, width, height);

        }

    },
    setupCanvas: function (node, vWidth, vHeight) {
        var cnt, canvas, height, width,
            ratio = 0.4,
            hFudge = 190;

        try {

            width = vWidth - 30;
            height = vHeight - hFudge;

            // set event listeners
            cnt = this.down('#canvasCnt');
            cnt.element.on('touchstart', this.canvasTouchStart, this);
            cnt.element.on('touchmove', this.canvasTouchMove, this);
            cnt.element.on('touchend', this.canvasTouchEnd, this);

            cnt.setHeight(height);
            cnt.setWidth(width);

            //this.down('#clearsig').setTop(height / 2 - 30);
            //this.down('#clearsig').setLeft(width + 10);

            // get the canvas and it's 2d context
            canvas = this.element.dom.getElementsByTagName('canvas')[0];
            this.setCanvas(canvas);
            this.setContext(canvas.getContext('2d'));

            canvas.height = height;
            canvas.width = width;

            // set up the line style
            if (node.get('Colour')) {
                this.getContext().strokeStyle = 'rgba(0,0,' + node.get('Colour') % 256 + ', 1)';
            } else {
                this.getContext().strokeStyle = 'rgba(0,0,0, 1)';
            }

            this.clearCanvas();
            if (typeof (node.get('Value')) === "object") {
                this.SetupSignOnGlassDetail(node);
            } else if (node.get('Value')) {
                this.setValue(node.get('Value'));
            }
        } catch (ex) {
            console.error('Signature.setup() Error', ex.message);
        }
    },
    clearCanvas: function () {
        var width = this.getCanvas().width;

        // setting the height or with of the canvas clears the canvas
        this.getCanvas().width = width;

    },

    canvasTouchStart: function (e) {
        this.setScrollable(false);

        this.setLastCoord(this.relMouseCoords(e));
        this.setDrawing(true);
    },

    canvasTouchMove: function (e) {
        var context, coords;

        if (this.getDrawing()) {

            coords = this.relMouseCoords(e);

            context = this.getContext();
            context.beginPath();
            context.moveTo(this.getLastCoord().x, this.getLastCoord().y);
            context.lineTo(coords.x, coords.y);
            context.lineWidth = 2;
            context.stroke();
            context.closePath();

            this.setLastCoord(coords);

        }

    },

    canvasTouchEnd: function (e) {
        delete this.last;
        this.setDrawing(false);

        this.setScrollable(true);

    },

    relMouseCoords: function (e) {

        try {
            var totalOffsetX = 0,
                totalOffsetY = 0,
                canvasX = 0,
                canvasY = 0,
                currentElement = this.getCanvas();

            do {
                totalOffsetX += currentElement.offsetLeft;
                totalOffsetY += currentElement.offsetTop;
                currentElement = currentElement.offsetParent;
            }
            while (currentElement);

            canvasX = e.pageX - totalOffsetX;
            canvasY = e.pageY - totalOffsetY;

            return { x: canvasX, y: canvasY };

        } catch (ex) {
            console.error('Signature.relMouseCoords() Error', ex.message);
        }


    },

    getValue: function () {
        return this.getCanvas().toDataURL();
    },

    setValue: function (value) {
        var img, ctx;

        if (value) {
            img = new Image();
            img.crossOrigin = "Anonymous";

            ctx = this.getContext();
            if (!ctx) {
                ctx = this.element.dom.getElementsByTagName('canvas')[0].getContext('2d');
            }
            img.onload = function () {
                try {
                    ctx.drawImage(img, 0, 0);
                } catch (ex) {
                    console.log('unable to find canvas ' + ex.message);
                }
            }

            img.src = value;
        }

    },

    SetupSignOnGlassDetail: function (node) {
        var values = node.get("Value"),
            strFilename, img;

        // check if the background image has been set
        if (values && values.href) {

            strFilename = values.href;

            img = document.createElement('img');
            img.crossOrigin = "Anonymous";

            c2 = this.getCanvas();
            ctx2 = this.getContext();
            if (!ctx2) {
                ctx2 = this.element.dom.getElementsByTagName('canvas')[0].getContext('2d');
            }
            ctx2.strokeStyle = values.strokeStyle;

            img.onload = function (e) {

                c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);

                var hRatio = c2.width / c.width;
                var vRatio = c2.height / c.height;
                var ratio = Math.min(hRatio, vRatio);

                try {
                    ctx2.drawImage(c, 0, 0, c.width, c.height, 0, 0, c.width * ratio, c.height * ratio);
                    //ctx2.drawImage(c, 0, 0, c.width, c.height, 0, 0, c2.width, c2.height);
                } catch (ex) {
                    console.log('unable to find canvas SetupSignOnGlassDetail' + ex.message);
                }
            };

            img.src = strFilename;

        }
    }

});
