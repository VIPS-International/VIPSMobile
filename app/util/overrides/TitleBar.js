//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.TitleBar', {
    override: 'Ext.TitleBar',

    // apply any localization to displayed text
    applyTitle: function (newValue, oldValue) {
        return VIPSMobile.getString(newValue);
    },

    // needs to recurse through all the items since titlebars are weird
    // not an override, just adding our own function
    removeAllButtons: function (cmp) {
        var i, item, itemId;

        // first call needs to get reference to itself
        if (!cmp) { cmp = this; }

        // loop through all the component's items
        i = 0;
        while (i < cmp.getItems().getCount()) {

            item = cmp.getAt(i);
            itemId = item.id || '';

            // check if this item is a button
            if (DataFunc.GetXtype(item) === 'button' || itemId.indexOf('button') === 4) {

                // remove the button
                item.destroy();

            } else {

                // recurse looking for buttons
                if (item.getItems) {
                    this.removeAllButtons(item);
                }

                // check the next item
                i++;

            }

        }

    }

});
