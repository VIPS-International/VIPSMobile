//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.orders.Cart', {
    extend: 'VIPSMobile.view.orders.Detail',

    tbConfig: {
        title: VIPSMobile.getString('Data'),
        items: [{
            text: VIPSMobile.getString('Menu'),
            ui: 'back action',
            func: 'Back',
            addFn: function (controller) {
                return !VIPSMobile.Main.useMultiPanels();
            }
        }]
    },
    config: {
        shopOptionsInt: null,
        cartStore: null,
        items: [{
            xtype: 'formpanel',
            itemId: 'proddetails',
            docked: 'top',
            height: '80%',
            items: [{
                xtype: 'container',
                itemId: 'QtyFS',
                defaults: {
                    xtype: 'fieldset',
                    title: 'Quantity'
                }
            }, {
                xtype: 'button',
                text: VIPSMobile.getString('Update'),
                ui: 'action',
                style: 'margin: 1em 0',
                func: 'UpdateCartProduct'
            }]
        }, {
            xtype: 'infosheet',
            height: '5.5em',
            items: [{
                xtype: 'container',
                itemId: 'carttotals',
                padding: '.4em'
            }, {
                xtype: 'button',
                text: 'Place Order',
                itemId: 'btnPlaceOrder',
                ui: 'confirm',
                margin: '.5em',
                func: 'placeOrder'
            }, {
                xtype: 'container',
                //hidden: true,
                itemId: 'cartinfo',
                cls: 'cartinfo'
            }]
        }],
    },

    setup: function (controller) {

        this.setNode({ get: Ext.emptyFn });

        console.debug("Setup Cart View");

    },
    setStore: function (store) {

        this.setCartStore(store);

        var products = store.getRange();

        console.debug("setStore new Cart", products);
        this.addProductsToCart(products);


    },
    addProductsToCart: function (products) {

        var FS, obj, objs = {}, strLabel, product, groupStr, fsGroup;

        FS = this.down('#QtyFS');
        this.setField(FS);

        for (i = 0; i < products.length; i++) {

            product = products[i].data;
            //console.log(product);
            strLabel = product.Name;

            if (groupStr !== product.GroupName) {
                groupStr = product.GroupName;
                fsGroup = FS.add({ title: groupStr });
            }

            if (this.getShopOptionsInt() & 2048) {
                strLabel += ' <span class="order-price">$' + product.Price.toFixed(2) + '</span>';
            }
            obj = {
                xtype: 'uomfield',
                label: strLabel,
                width: '100%', // seem to need this for iphone
                labelWidth: '30%',
                labelWrap: true,
                name: product.Value,
                value: {
                    quantity: product.Quantity,
                    discount: product.Discount,
                    overrideprice: product.OverridePrice,
                    notes: product.Notes
                },
                minValue: 0,
                maxValue: product.Stock || 100,
                stepValue: 1,
                qtyLabel: product.qtyLabel || 'Qty.',
                qtyFieldToStore: product.qtyFieldToStore || 'Quantity'
            };
            obj.uom = product;
            objs[obj.uom.Value] = obj;
            cmp = fsGroup.add(obj);
            cmp.uom = obj.uom;
        }
        //console.log(objs);
    },
    getValues: function () {

        var form = this.down('#proddetails');

        return form.getValues();

    },
    setShopOptions: function (intShopOptions, strButtonText) {

        this.setShopOptionsInt(intShopOptions);

        if (strButtonText) {
            this.down('#btnPlaceOrder').setHidden(false);
            this.down('#btnPlaceOrder').setHtml(strButtonText);
        } else {
            this.down('#btnPlaceOrder').setHidden(true);
        }

    },
    UpdateTotals: function () {
        var html;

        html = '<div class="width100" style="display:table">';
        html += '<span style="display:table-row">';
        html += '<span style="display:table-cell">Products: ' + this.getCartStore().getActiveCount() + '</span>';
        html += '<span style="display:table-cell">Items: ' + this.getCartStore().sum('Quantity') + '</span>';
        if (this.getShopOptionsInt() & 2048) {
            html += '<span style="display:table-cell; text-align:right">$' + this.getCartStore().sum('TotalPrice').toFixed(2) + '</span>';
        }
        html += '</span>';
        html += '</div>';

        // update the totals value on cart
        this.down('#carttotals').setHtml(html);

        // enable or disable the place order button
        this.down('button[func=placeOrder]').setDisabled(this.getCartStore().getCount() === 0);

    }

});



