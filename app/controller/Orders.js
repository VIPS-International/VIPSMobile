//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.controller.Orders', {
    extend: 'Ext.app.Controller',
    alias: 'controller.Orders',

    requires: ['VIPSMobile.Version'],

    config: {

        models: ['BrowseItem', 'BrowsePatron', 'CartItem', 'Shop'],
        stores: ['BrowseItems', 'BrowsePatrons', 'OrdersCart', 'Shops'],
        views: [
            'orders.Browse',
            'orders.Cart',
            'orders.Container',
            'orders.Detail',
            'orders.Patrons',
            'orders.PlaceOrder',
            'orders.Shops'
        ],

        routes: {
            'Orders': 'route',
            'Orders/:shopId': { action: 'route', conditions: { ':shopId': '[0-9]+' } },
            'Orders/:shopId/:categoryId': { action: 'route', conditions: { ':shopId': '[0-9]+', ':categoryId': '[0-9]+' } },
            'Orders/:shopId/:categoryId/:productId': { action: 'route', conditions: { ':shopId': '[0-9]+', ':categoryId': '[0-9]+', ':productId': '[0-9]+' } },
            'Orders/:shopId/Cart': { action: 'route', conditions: { ':shopId': '[0-9]+' } }
        },

        refs: {
            buttons: {
                selector: 'button[cls="Orders"]'
            },
            browse: { selector: 'OrdersBrowse' },
            cart: { selector: 'OrdersCart' },
            detail: { selector: 'OrdersDetail' },
            patrons: { selector: 'OrdersPatron' },
            placeOrder: { selector: 'OrdersPlace' },
            shops: { selector: 'OrdersShops' },
            specials: { selector: '#specials' }
        },

        categoryId: null,
        patronGroupId: 0,
        product: null,
        shop: null,
        shopId: null,
        shopOptions: {}

    },

    StoreOptions: {
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

    setup: function () {

        //this.getContainer().add([
        //    { xtype: 'OrdersShops' },
        //    { xtype: 'OrdersBrowse' },
        //    { xtype: 'OrdersDetail' },
        //    { xtype: 'OrdersCart' },
        //    { xtype: 'OrdersPlace' },
        //    { xtype: 'OrdersPatron' }
        //]);

        //// sync all the order tables
        //this.onRefreshTap();
        // Get call flow data and sync required tables
        VIPSMobile.Sync.doMany({
            tableNames: ['OrdersdboShops'],
            scope: this,
            callback: function () {
                VIPSMobile.Main.setMask(this, false);
            }
        });

        //// auto update the cart badge when cart changes
        //this.getOrdersCartStore().on({
        //    addrecords: { fn: this.updateCartBadge, scope: this },
        //    clear: { fn: this.updateCartBadge, scope: this },
        //    removerecords: { fn: this.updateCartBadge, scope: this },
        //    updaterecord: { fn: this.updateCartBadge, scope: this } // only if want the badge to show quantity rather than number of items
        //});

    },

    route: function (shopId, categoryId) {
        var view;

        // setup app if needed
        VIPSMobile.Main.SetupApplication(this, function () {

            // wait for the shops store to load
            this.getShopsStore().waitForLoad(function () {

                // if message key not passed in, go to last message key
                if (!shopId) { shopId = this.getShopId(); }
                if (!categoryId) { categoryId = this.getCategoryId(); }

                if (!shopId) {

                    // show the shop menu
                    view = Ext.create('VIPSMobile.view.orders.Shops');
                    view.setup(this);
                    VIPSMobile.Main.showView(this, view);

                }

            });

        });

    },

    GetDraftKey: function (vShopID) {
        return VIPSMobile.Version.getLSPrefix() + 'OrderDraft' + vShopID;
    },

    onRefreshTap: function (btn) {
        var i, strKey;

        // sync all the order tables
        VIPSMobile.Sync.doMany({
            tableNames: [
                'OrdersdboShops',
                'OrdersdboCategories',
                'OrdersdboCategoryProducts',
                'OrdersdboPatrons',
                'OrdersdboPatronGroups',
                'OrdersdboPatronGroupMembers',
                'OrdersdboProducts',
                'OrdersdboShippingOptions',
                'OrdersdboSpecials',
                'OrdersdboSpecialsItems',
                'OrdersdboUnitsOfMeasure'
            ],
            forceSync: !!btn,
            scope: this,
            callback: function (vSyncTables) {

                // load the shops store after sync
                this.getShopsStore().load({
                    callback: function (records, operation, success) {

                        // check if any shops have drafts
                        for (i = 0; i < records.length; i++) {
                            strKey = this.GetDraftKey(records[i].get('ShopID'));
                            records[i].set('Draft', !!localStorage[strKey]);
                        }

                        VIPSMobile.Main.setMask(this, false);

                    },
                    scope: this
                });

            }

        });

    },

    onShopTap: function (list, index) {
        var item, opts;

        item = list.getStore().getAt(index);

        // get the shop options
        opts = {};
        Ext.iterate(this.StoreOptions, function (opt, bitwise) {
            opts[opt] = item.raw.Options & bitwise;
        });

        // set the shop and it's options
        this.setShop(item.raw);
        this.setShopOptions(opts);
        this.getCart().setShopOptionsInt(opts);

        // browse the shop's root category
        this.browseCategory(0);

        this.getContainer().animateActiveItem(this.getBrowse(), DataFunc.GetAnimation('left'));

    },

    onCartTap: function () {

        this.getCart().setLastActive(this.getContainer().getActiveItem());

        this.getCart().setStore(this.getOrdersCartStore());

        this.getContainer().animateActiveItem(this.getCart(), DataFunc.GetAnimation('left'));

    },

    onIndexTap: function () {
        var last;

        if (this.getOrdersCartStore().getCount() > 0) {

            last = this.getCart().getLastActive();
            this.getCart().setLastActive(null);

            this.getContainer().animateActiveItem(last, DataFunc.GetAnimation('right'));

        } else {
            Ext.Msg.alert('Place Order', 'There are no products in the cart.');
        }

    },

    // populate the browse items store with categories and products 
    browseCategory: function (categoryId) {

        // remember the category id
        this.setCategoryId(categoryId);

        // repopulate the store
        this.getBrowseItemsStore().removeAll();
        this.getSubCategories(categoryId);
        this.getCategoryProducts(categoryId);

    },

    getSubCategories: function (categoryId) {
        var now, i;

        now = DataFunc.getdate();

        DataFunc.executeSQL({
            sql: 'SELECT * FROM OrdersdboCategories WHERE ShopID=' + this.getShop().ShopID +
                ' AND ParentCategoryID=' + categoryId + ' AND ActiveStartDate<' + now +
                ' AND ActiveEndDate>' + now + ' ORDER BY SortOrder, Name',
            scope: this,
            success: function (tx, results) {

                // loop through each category
                for (i = 0; i < results.rows.length; i++) {

                    // add the category
                    this.getBrowseItemsStore().add({
                        ItemId: results.rows.item(i).CategoryID,
                        Name: results.rows.item(i).Name,
                        Type: 'C'
                    });

                }

            }
        });

    },

    getCategoryProducts: function (categoryId) {
        var now, cartItem, qty, i;

        now = DataFunc.getdate();

        DataFunc.executeSQL({
            sql: 'SELECT * FROM OrdersdboProducts WHERE ShopID=' + this.getShop().ShopID +
                ' AND ActiveStartDate<' + now + ' AND ActiveEndDate>' + now +
                ' AND ProductID IN (SELECT ProductID FROM OrdersdboCategoryProducts WHERE CategoryID=' +
                categoryId + ') ORDER BY SortOrder, Name',
            scope: this,
            success: function (tx, results) {

                // loop through each product
                for (i = 0; i < results.rows.length; i++) {

                    // check if the item is in the cart
                    cartItem = this.getOrdersCartStore().getById(results.rows.item(i).ProductID);
                    if (cartItem) {
                        qty = cartItem.get('Quantity');
                    } else {
                        qty = null;
                    }

                    // add the product
                    this.getBrowseItemsStore().add({
                        ItemId: results.rows.item(i).ProductID,
                        Name: results.rows.item(i).Name,
                        Quantity: qty,
                        Thumbnail: results.rows.item(i).Thumbnail,
                        Type: 'P'
                    });

                }

            }
        });

    },

    onBrowseBackTap: function () {
        var parentId;

        // check if in a sub category
        if (this.getCategoryId() !== 0) {

            // get the parent category id
            DataFunc.executeSQL({
                sql: 'SELECT ParentCategoryID FROM OrdersdboCategories WHERE CategoryID=' + this.getCategoryId(),
                scope: this,
                success: function (tx, results) {

                    parentId = DataFunc.GetScalarValue(results);
                    this.browseCategory(parentId);

                }
            });

        } else {

            // show the shops view
            this.getOrdersCartStore().removeAll();
            this.getContainer().animateActiveItem(this.getShops(), DataFunc.GetAnimation('right'));

        }

    },

    onBrowseTap: function (list, index) {
        var item = list.getStore().getAt(index);

        switch (item.get('Type')) {
            case 'C': this.browseCategory(item.get('ItemId')); break;
            case 'P': this.getProductDetails(item.get('ItemId')); break;
            default: console.error('unknown item in shop browse', item);
        }

    },

    getProductDetails: function (prodId) {
        var now, lstSQL, prod;

        now = DataFunc.getdate();

        lstSQL = [
            { sql: 'SELECT * FROM OrdersdboProducts WHERE ProductID=' + prodId },
            { sql: 'SELECT UoMID, Name, Value, Price FROM OrdersdboUnitsOfMeasure WHERE ProductID=' + prodId + ' AND ActiveStartDate<' + now + ' AND ActiveEndDate>' + now + ' ORDER BY SortOrder, Name' }
        ];

        // get all the product's info
        DataFunc.executeMany({
            statements: lstSQL,
            scope: this,
            callback: function (statements) {

                // check if a product was found
                if (statements[0].results.rows.length > 0) {

                    // get the base product
                    prod = statements[0].results.rows.item(0);
                    prod.cart = this.getOrdersCartStore().getById(prodId);
                    prod.uom = DataFunc.SQLResultsToArray(statements[1].results);

                    // remember the product
                    this.setProduct(prod);

                    // need to get specials for units of measure
                    this.getProductSpecials();

                } else {
                    Ext.Msg.alert('', 'Product not found.');
                }

            }
        });

    },

    getProductSpecials: function () {
        var prod;

        prod = this.getProduct();

        prod.specials = [];

        // check the product
        this.getItemSpecials(prod.specials, 'P', prod.ProductID, function () {

            // check the category
            this.getItemSpecials(prod.specials, 'C', this.getCategoryId(), function () {

                // check all parent category specials
                this.getParentCategorySpecials(prod.specials, function () {

                    // get the uom specials
                    this.getUoMSpecials(0);

                });
            });
        });
    },

    getUoMSpecials: function (index) {
        var prod;

        prod = this.getProduct();

        if (index < prod.uom.length) {

            prod.uom[index].specials = [];

            // check the uom
            this.getItemSpecials(prod.uom[index], 'U', prod.uom[index].UoMID, function () {

                // get the specials for the next uom
                index++;
                this.getUoMSpecials(index);

            });

        } else {
            this.showProduct();
        }

    },

    getItemSpecials: function (specials, itemType, itemID, callback) {
        var strSQL, now, i, special;

        now = DataFunc.getdate();

        // build the SQL
        strSQL = 'SELECT * FROM OrdersdboSpecials WHERE SpecialID IN (SELECT SpecialID FROM OrdersdboSpecialsItems WHERE (ItemType="' + itemType +
                '" AND ItemID=' + itemID + ')) AND ActiveStartDate<' + now + ' AND ActiveEndDate>' + now;
        if (itemType === 'C' && itemID !== this.getCategoryId()) { strSQL += ' AND ApplyToSubCategories=1'; }

        DataFunc.executeSQL({
            sql: strSQL,
            success: function (tx, results) {

                // loop through all the specials
                for (i = 0; i < results.rows.length; i++) {

                    special = results.rows.item(i);

                    // add the special if not already in list
                    if (!this.HasSpecial(specials, special.SpecialID)) {
                        specials.push(special);
                    }

                }

                callback.apply(this);

            },
            scope: this
        });

    },

    HasSpecial: function (specials, specialID) {
        var i, blnHas;

        // assume not
        blnHas = false;

        // check all the current specials
        for (i = 0; i < specials.length; i++) {
            if (specials[i].SpecialID === specialID) {
                blnHas = true;
            }
        }

        // return if found
        return blnHas;

    },

    // get all the specials from parent categories
    getParentCategorySpecials: function (uom, callback, categoryId) {
        var intParentId;

        // instantiate params if first call
        if (categoryId === null) { categoryId = this.getCategoryId(); }

        DataFunc.executeSQL({
            sql: 'SELECT ParentCategoryID FROM OrdersdboCategories WHERE CategoryID=' + categoryId,
            success: function (tx, results) {

                // get the parent category id
                intParentId = DataFunc.GetScalarValue(results);

                // check if a category was found
                if (intParentId > 0) {

                    // get all specials for the category that are inherited
                    this.getItemSpecials(uom, 'C', intParentId, function () {

                        // check this category's parent
                        this.getParentCategorySpecials(uom, callback, intParentId);

                    });

                } else {
                    callback.apply(this);
                }

            },
            scope: this
        });

    },

    showProduct: function () {

        this.getDetail().setProductValues(this.getProduct());
        this.PrepareSpecialsTests();

        this.getContainer().animateActiveItem(this.getDetail(), DataFunc.GetAnimation('left'));

    },

    PrepareSpecialsTests: function () {
        //var product, cart, i, strChecks, strValid;

        return;

        //product = this.getProduct();
        //cart = product.cart || Ext.create('VIPSMobile.model.CartItem');

        //// get all the checks for the specials
        //strChecks = [];
        //for (i = 0; i < product.specials.length; i++) {

        //    // replace any tags in the valid test
        //    strValid = product.specials[i].ValidTest;
        //    strValid = strValid.replace(/\[TotalQuantity\]/gi, cart.get('TotalQuantity'));
        //    strValid = strValid.replace(/\[TotalPrice\]/gi, cart.get('TotalPrice'));

        //    // replace all the quantity by uom values
        //    Ext.iterate(cart.get('Quantity'), function (uom, count) {
        //        strValid = strValid.replace(new RegExp('\\[Quantity-' + uom + '\\]', 'gi'), count);
        //    });

        //    // if blank, assume it's valid
        //    if (strValid.length == 0)
        //        strValid = 'SELECT 1';

        //    // add the check to the array
        //    strChecks.push({
        //        sql: strValid,
        //        special: product.specials[i]
        //    });

        //}

        //// check all the specials
        //DataFunc.executeMany({
        //    statements: strChecks,
        //    scope: this,
        //    callback: this.checkSpecials
        //});

    },

    checkSpecials: Ext.emptyFn,

    setProductPrice: Ext.emptyFn,

    onDetailBackTap: function () {
        this.getContainer().animateActiveItem(this.getBrowse(), DataFunc.GetAnimation('right'));
    },

    // add or remove the product from the cart
    updateCartProduct: function () {
        var product, values, browseIndex;

        product = this.getProduct();

        // get the current values
        values = this.getDetail().getValues();

        // check if removing the product
        //if (values.TotalQuantity === 0) {

        //    // remove the product if found
        //    if (product.cart) {
        //        this.getOrdersCartStore().remove(product.cart);
        //        product.cart = null;
        //    }

        //} else {

            // add or set the product's values in the cart
            if (product.cart) {
                product.cart.set(values);
            } else {
                product.cart = this.getOrdersCartStore().add(values)[0];
            }

        //}

        // update the item in browse list if need
        browseIndex = this.getBrowseItemsStore().findBy(function (record) {
            return (product.ProductID === record.get('ItemId') && record.get('Type') === 'P');
        });
        if (browseIndex >= 0) {
            this.getBrowseItemsStore().getAt(browseIndex).set({
                Quantity: values.Quantity
            });
        }

        // update the specials
        this.PrepareSpecialsTests();

    },

    updateCartBadge: function () {
        var count;

        // get the count to display based on shop option
        count = this.getOrdersCartStore().sum('Quantity');

        this.getApplication().fireEvent('setBadgeText', '#DataCart', count, count > 0);

        // update the totals value on cart
        if (this.getCart()) {
            this.getCart().UpdateTotals();
        }

        // save the cart as a draft for the shop
        this.saveDraft();

    },

    saveDraft: function () {
        var draft, i, key;

        // put all the cart item's into an array
        draft = [];
        for (i = 0; i < this.getOrdersCartStore().getCount() ; i++) {
            draft.push(this.getOrdersCartStore().getAt(i).raw);
        }

        // save or delete the draft
        key = this.GetDraftKey(this.getShop().ShopID);
        if (draft.length > 0) {
            localStorage[key] = JSON.stringify(draft);
        } else {
            delete localStorage[key];
        }

        // update the draft flag for shop
        this.getShopsStore().getById(this.getShop().ShopID).set('Draft', draft.length > 0);

    },

    onCartItemSwipe: Ext.emptyFn,

    hideDeleteButton: function (e) {

        try {

            // remove the listeners
            //this.element.un('tap', arguments.callee, this);
            //this.getScrollable().getScroller().un('scroll', arguments.callee, this);

            // hide the button
            this.deleteButton.hide();

            //reenable scrolling
            this.getScrollable().getScroller().setDisabled(false);

        } catch (ex) {
            console.error('Orders.hideDeleteButton() Error', ex.message);
        }

    },

    onCartItemTap: function (list, index) {
        var item, catID;

        item = list.getStore().getAt(index);

        // get the product's category
        DataFunc.executeSQL({
            sql: 'SELECT CategoryID FROM OrdersdboCategoryProducts WHERE ProductID=' + item.get('ProductID'),
            scope: this,
            success: function (tx, results) {

                // set the category
                catID = DataFunc.GetScalarValue(results);
                this.browseCategory(catID);

                // show the product detail
                this.getProductDetails(item.get('ProductID'));

            }

        });

    },

    onPlaceOrderTap: function () {
        var i, opts;

        if (this.getOrdersCartStore().getCount() > 0) {

            // hide unneeded fields
            this.getPlaceOrder().down('field[name=OrderDate]').setHidden(!this.getShopOptions().OrderDateReq);
            //this.getPlaceOrder().down('signaturefield').setHidden(!this.getShopOptions().SignatureReq);
            this.getPlaceOrder().down('field[name=Notes]').setHidden(!this.getShopOptions().OrderNotesReq);

            // get the shipping options
            DataFunc.executeSQL({
                sql: 'SELECT * FROM OrdersdboShippingOptions WHERE ShopID=' + this.getShop().ShopID,
                scope: this,
                success: function (tx, results) {

                    // set the shipping options array
                    opts = [];
                    for (i = 0; i < results.rows.length; i++) {
                        opts.push({ text: results.rows.item(i).Name, value: results.rows.item(i).ShippingID });
                    }

                    // set the options for the select field
                    this.getPlaceOrder().down('field[name=ShipTo]').setOptions(opts);

                    // show the place order view
                    this.getContainer().animateActiveItem(this.getPlaceOrder(), DataFunc.GetAnimation('left'));

                }
            });

        } else {
            Ext.Msg.alert('Place Order', 'There are no products in the cart.');
        }

    },

    onPlaceBackTap: function () {
        this.getContainer().animateActiveItem(this.getCart(), DataFunc.GetAnimation('right'));
    },

    onNewPatronTap: function () {
        Ext.Msg.alert('New Patron', 'Not yet implemented');
    },

    onPickPatronTap: function () {
        this.browseGroup(0);
        this.getContainer().animateActiveItem(this.getPatrons(), DataFunc.GetAnimation('left'));
    },

    onPatronsBackTap: function () {
        var parentId;

        // check if in a sub group
        if (this.getPatronGroupId() !== 0) {

            // get the parent group id
            DataFunc.executeSQL({
                sql: 'SELECT ParentGroupID FROM OrdersdboPatronGroups WHERE PatronGroupID=' + this.getPatronGroupId(),
                scope: this,
                success: function (tx, results) {

                    parentId = DataFunc.GetScalarValue(results);
                    this.browseGroup(parentId);

                }
            });

        } else {

            // show the place order view
            this.getContainer().animateActiveItem(this.getPlaceOrder(), DataFunc.GetAnimation('right'));

        }

    },

    // populate the browse groups store with groups and patrons
    browseGroup: function (groupId) {

        // remember the group id
        this.setPatronGroupId(groupId);

        // repopulate the store
        this.getBrowsePatronsStore().removeAll();
        this.getSubGroups(groupId);
        this.getGroupPatrons(groupId);

    },

    getSubGroups: function (groupId) {
        var i;

        DataFunc.executeSQL({
            sql: 'SELECT * FROM OrdersdboPatronGroups WHERE ShopID=' + this.getShop().ShopID +
                ' AND ParentGroupID=' + groupId + ' ORDER BY SortOrder, Name',
            scope: this,
            success: function (tx, results) {

                // loop through each group
                for (i = 0; i < results.rows.length; i++) {

                    // add the group
                    this.getBrowsePatronsStore().add({
                        ItemId: results.rows.item(i).PatronGroupID,
                        Name: results.rows.item(i).Name,
                        Type: 'G'
                    });

                }

            }
        });

    },

    getGroupPatrons: function (groupId) {
        var i;

        DataFunc.executeSQL({
            sql: 'SELECT * FROM OrdersdboPatrons WHERE ShopID=' + this.getShop().ShopID +
                ' AND PatronID IN (SELECT PatronID FROM OrdersdboPatronGroupMembers WHERE PatronGroupID=' + groupId +
                ') ORDER BY SortOrder, Name',
            scope: this,
            success: function (tx, results) {

                // loop through each patron
                for (i = 0; i < results.rows.length; i++) {

                    // add the product
                    this.getBrowsePatronsStore().add({
                        ItemId: results.rows.item(i).PatronID,
                        Name: results.rows.item(i).Name,
                        Type: 'P'
                    });

                }

            }
        });

    },

    onPatronTap: function (list, index) {
        var item = list.getStore().getAt(index);

        switch (item.get('Type')) {
            case 'G': this.browseGroup(item.get('ItemId')); break;
            case 'P': this.selectPatron(item); break;
            default: console.error('unknown item in patron browse', item);
        }

    },

    selectPatron: function (patron) {

        // set the patron
        this.getPlaceOrder().setValues({
            Patron: patron.get('Name'),
            PatronId: patron.get('ItemId')
        });

        // swith back to place order view
        this.getContainer().animateActiveItem(this.getPlaceOrder(), DataFunc.GetAnimation('right'));

    },

    onSubmitOrderTap: function () {
        var values, strMsg;

        values = this.getPlaceOrder().getValues();

        // if signature is required, make sure it's filled in
        if (!values.Patron) {
            strMsg = 'No patron selected';
        } else if (!values.ShipTo) {
            strMsg = 'No shipping method selected';
        } else if (!this.getSignature().getHidden() && !values["null"]) {
            strMsg = 'Need to sign order';
        }

        // check if everything is valid
        if (!strMsg) {

            Ext.Msg.alert('Place Order', 'n.y.i.');

        } else {

            // show the message to user
            Ext.Msg.alert('Place Order', strMsg);

        }

    },

    getHelpCategories: function (view) {
        var categories, viewClass;

        categories = [];

        // add the view name
        viewClass = Ext.getClassName(view);
        viewClass = viewClass.substring(viewClass.indexOf('view') + 5);
        categories.push(viewClass);

        // add the default controller category
        categories.push('Orders');

        return categories;

    }

});
