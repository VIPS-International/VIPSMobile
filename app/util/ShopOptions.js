//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.ShopOptions', {

    FLAGS: {
        QuantityDisplay: 7, // three bits (1, 2, 4)
        SignatureReq: 8,
        CartBadgeTotalItems: 16,
        OrderDateReq: 32,
        OrderNotesReq: 64,
        AllowNewPatrons: 128,
        PatronsFilter: 768, // two bits (256, 512)
        ShowAllSpecials: 1024,
        ShowPrices: 2048
    },

    config: {
        AllowNewPatrons: false,
        CartBadgeTotalItems: false,
        OrderDateReq: true,
        OrderNotesReq: false,
        PatronsFilter: 0,
        QuantityDisplay: 1,
        ShowAllSpecials: true,
        ShowPrices: true,
        SignatureReq: false
    },

    constructor: function (config) {
        var bitwise;

        // check if bitwise value passed in
        if ((config && config.bitwise) || Ext.isNumber(config)) {

            // get the bitwise value
            bitwise = (Ext.isNumber(config)) ? config : config.bitwise;

            // set based on bitwise value
            this.setAllowNewPatrons(!!(bitwise & this.FLAGS.AllowNewPatrons));
            this.setCartBadgeTotalItems(!!(bitwise & this.FLAGS.CartBadgeTotalItems));
            this.setOrderDateReq(!!(bitwise & this.FLAGS.OrderDateReq));
            this.setOrderNotesReq(!!(bitwise & this.FLAGS.OrderNotesReq));
            this.setPatronsFilter(!!(bitwise & this.FLAGS.PatronsFilter));
            this.setQuantityDisplay(bitwise & this.FLAGS.QuantityDisplay);
            this.setShowAllSpecials(!!(bitwise & this.FLAGS.ShowAllSpecials));
            this.setShowPrices(!!(bitwise & this.FLAGS.ShowPrices));
            this.setSignatureReq(!!(bitwise & this.FLAGS.SignatureReq));

        }

        // set explicitly passed values
        this.initConfig(config);

    }

});
