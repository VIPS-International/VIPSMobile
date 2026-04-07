//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.orders.Browse', {
    extend: 'Ext.dataview.List',

    config: {

        store: 'BrowseItems',

        selectedCls: '',

        items: [{
            xtype: 'titlebar',
            title: 'Shop',
            docked: 'top',
            defaults: {
                ui: 'action'
            },
            items: [{
                func: 'browseBack',
                text: 'Back',
                ui: 'back action'
            }, {
                func: 'cart',
                iconCls: 'shop1',
                iconMask: true,
                align: 'right',
                disabled: true
            }]
        }],

        itemTpl: new Ext.XTemplate(
             '<tpl for".">',
                 '<div>',
                     '<tpl if="Thumbnail">',
                        '<img src="{Thumbnail}" class="order-thumbnail" />',
                    '<tpl else>',
                        '<tpl switch="Type">',
                            '<tpl case="C">',
                                '<div class="order-folder"></div>',
                            '<tpl case="P">',
                                '<div class="order-product"></div>',
                        '</tpl>',
                    '</tpl>',
                    '{[this.getProduct(values)]}',
                 '</div>',
             '</tpl>',
            {
                compiled: true,
                getProduct: function (product) {
                    var strQuantity, strReturn, strAnswered = "",
                        blnHasQuantity;

                    strQuantity = '';
                    blnHasQuantity = false;

                    Ext.iterate(product.Quantity, function (uom, value) {
                        if (value.Quantity > 0) {
                            strQuantity += uom + ':' + value.Quantity + ' ';
                            blnHasQuantity = true;
                        }
                    });

                    if (blnHasQuantity) { strAnswered = ' blue'; }

                    strReturn = [
                        '<div class="order-name' + strAnswered + '">', product.Name, '</div>',
                        '<div class="order-quantity font80">', strQuantity, '</div>'
                    ].join('');

                    return strReturn;

                }
            }
         )

    }

});
