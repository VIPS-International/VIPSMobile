//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.Menu', {
    extend: 'Ext.Container',
    xtype: 'DashboardMenu',

    tbConfig: {
        title: 'Dashboard',
        items: []
    },

    config: {
        itemId: 'dashboardmenu',
        panel: 'full',
        store: null,
        controller: null,
    },

    setup: function (controller) {
        var me = this;

        // remember the controller responsible for the view
        this.setController(controller);

        // set the title to the current section
        this.tbConfig.title = controller.getSection();
                
        // set the title to the current section
        this.tbConfig.items = [{
            itemId: 'dashboardrefresh',
            iconCls: 'refresh',
            iconMask: true,
            html: ' Sync',
            func: 'Refresh'
        }]

        // populate the menu store
        this.populateMenuStore();

        // listen for any changes to call flows
        VIPSMobile.CallFlows.on('updated', this.populateMenuStore, this);

    },
    
    // called when set up or whenever the call flows change
    populateMenuStore: function () {
        // clear the store
        if (!this.getStore()) {
            this.setStore(Ext.create("VIPSMobile.store.DashboardMenu"));
        }
        this.getStore().removeAll();

        // loop through each call flow
        Ext.iterate(VIPSMobile.CallFlows.getById(), function (id, cf) {

            // check if should show the call flow
            id = parseInt(id, 10);

            if (cf.getCalculatedValueSQL() !== "") {
                var sql = cf.getCalculatedValueSQL();

                sql = DataFunc.PrepareQuery(false, sql);
                sql = DataFunc.ReplaceValueTags(false, sql);

                DataFunc.executeSQL({
                    sql: sql,
                    scope: this,
                    success: function (tx, results) {
                        var description = DataFunc.GetScalarValue(results) || '';

                        if (description && description.indexOf("http") === 0) {
                            var node = this.getController().getCallFlowNodesStore().getById(cf.getCallFlowID());
                            node.data.DefaultValue = description.toString();
                            this.addToMenu(cf, "");
                        } else if (description) {
                            this.addToMenu(cf, description.toString());
                        } else {
                            this.addToMenu(cf);
                        }
                    },
                    failure: function () {
                        this.addToMenu(cf);
                    }
                });

            } else {
                this.addToMenu(cf);
            }

        }, this);

    },

    addToMenu: function (cf, badge) {
        if (this.getStore && this.getStore()) {
            this.getStore().add({
                CallFlowID: cf.getCallFlowID(),
                Badge: badge || "",
                Colour: cf.getColour(),
                CustNo: cf.getCustNo(),
                DCNo: cf.getDCNo(),
                InputMethod: cf.getInputMethod(),
                Description: cf.getDescription(),
                Draft: cf.getHasDraft(),
                SecondaryDescription: cf.getSecondaryDescription() || 'Input',
                Thumbnail: cf.getThumbnail()
            });
        }
    }
});
