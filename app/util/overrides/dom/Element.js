//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.dom.Element', {
    override: 'Ext.dom.Element'
    //,

    //getPageBox: function (getRegion) {
    //    try {
    //        var me = this,
    //            el = me.dom;
    //        if (el) {

    //            var w = el.offsetWidth,
    //                   h = el.offsetHeight,
    //                   xy = me.getXY(),
    //                   t = xy[1],
    //                   r = xy[0] + w,
    //                   b = xy[1] + h,
    //                   l = xy[0];

    //            if (!el) {
    //                return new Ext.util.Region();
    //            }

    //            if (getRegion) {
    //                return new Ext.util.Region(t, r, b, l);
    //            }
    //            else {
    //                return {
    //                    left: l,
    //                    top: t,
    //                    width: w,
    //                    height: h,
    //                    right: r,
    //                    bottom: b
    //                };
    //            }
    //        } else {
    //            return {
    //                left: 0,
    //                top: 0,
    //                width: 0,
    //                height: 0,
    //                right: 0,
    //                bottom: 0
    //            };
    //        }

    //    } catch (ex) {
    //        console.error('overrides.Element.getPageBox() Error', ex.message);
    //    }

    //}
});
