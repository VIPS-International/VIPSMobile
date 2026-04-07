//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.form.TextArea', {
    override: 'Ext.form.TextArea'
    //,
    //initialize: function () {

    //    try {
    //        this.callParent();
    //        this.element.dom.addEventListener(
    //           Ext.feature.has.Touch ? 'touchstart' : 'mousedown',
    //           this.handleTouchListener = Ext.bind(this.handleTouch, this),
    //           false);
    //        this.element.dom.addEventListener(
    //           Ext.feature.has.Touch ? 'touchmove' : 'mousemove',
    //           this.handleMoveListener = Ext.bind(this.handleMove, this),
    //           false);
    //        this.moveListenersAttached = true;
    //    } catch (ex) {
    //        console.error('overrides.TextArea.initialize() Error', ex.message);
    //    }
    //},
    //destroy: function () {
    //    try {
    //        // cleanup event listeners to avoid memory leak
    //        if (this.moveListenersAttached) {
    //            this.moveListenersAttached = false;
    //            this.element.dom.removeEventListener(
    //               Ext.feature.has.Touch ? 'touchstart' : 'mousedown',
    //               this.handleTouchListener,
    //               false);
    //            this.element.dom.removeEventListener(
    //               Ext.feature.has.Touch ? 'touchmove' : 'mousemove',
    //               this.handleMoveListener,
    //               false);
    //            this.handleTouchListener = this.handleMoveListener = null;
    //        };
    //        this.callParent();
    //    } catch (ex) {
    //        console.error('overrides.TextArea.destroy() Error', ex.message);
    //    }
    //},
    //handleTouch: function (e) {
    //    this.lastY = e.pageY;
    //},
    //handleMove: function (e) {
    //    var textArea = e.target;
    //    var top = textArea.scrollTop <= 0;
    //    var bottom = textArea.scrollTop + textArea.clientHeight >= textArea.scrollHeight;
    //    var up = e.pageY > this.lastY;
    //    var down = e.pageY < this.lastY;
    //    this.lastY = e.pageY;
    //    // default (mobile safari) action when dragging past the top or bottom of a scrollable
    //    // textarea is to scroll the containing div, so prevent that.
    //    if ((top && up) || (bottom && down)) e.preventDefault();
    //    // Sencha disables textarea scrolling on iOS by default,
    //    // so stop propagating the event to delegate to iOS.
    //    if (!(top && bottom)) e.stopPropagation();
    //}
});
