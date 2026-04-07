//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.viewport.Default', {
    override: 'Ext.viewport.Default',

    doPreventPanning: function (e) {
        var target = e.target, touch;

        // If we have an interaction on a WebComponent we need to check the actual shadow dom element selected
        // to determine if it is an input before preventing default behavior
        // Side effect to this is if the shadow input does not do anything with 'touchmove' the user could pan
        // the screen.
        if (this.isInteractiveWebComponentRegEx.test(target.tagName) && e.touches && e.touches.length > 0) {
            touch = e.touches[0];
            if (touch && touch.target && this.isInputRegex.test(touch.target.tagName)) {
                return;
            }
        }

        if (target && target.nodeType === 1 && !this.isInputRegex.test(target.tagName)) {
            if (!e.defaultPrevented) { e.preventDefault(); }
        }
    },
});
