//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.Index', {
    extend: 'Ext.DataView',

    tbConfig: {
        title: 'Dashboard',
        items: []
    },

    requires: ['VIPSMobile.view.dashboard.Detail'],

    config: {
        itemId: 'dashboardindex',
        loadingText: '',
        scrollToTopOnRefresh: true,
        func: 'DashboardIndex',
        panel: 'full',
        style: 'height:100%',
        controller: null,
        inline: true,
        useComponents: true,
        defaultType: 'dashboardlistitem'
    },

    setup: function (controller) {
        var me = this, menuStore;

        // remember the controller responsible for the view
        this.setController(controller);
                
        // set the title to the current section
        this.tbConfig.title = controller.getSection();

        this.tbConfig.items = [{
            itemId: 'dashboardrefresh',
            iconCls: 'refresh',
            iconMask: true,
            html: ' Sync',
            func: 'Refresh'
        }];

        if (this.getController().getMenu() && this.getController().getMenu().getStore()) {
            menuStore = this.getController().getMenu().getStore();
            Ext.iterate(menuStore.getRange(), function (sn) {
                me.tbConfig.items.push({
                    itemId: sn.get("CallFlowID"),
                    CallFlowID: sn.get("CallFlowID"),
                    html: sn.get("Description"),
                    func: 'ShowDashboard'
                })
            })
        } else {
            sn = this.getController().getCallFlowNodesStore().getById(this.getController().getCurrentCallFlowID());
            me.tbConfig.items.push({
                itemId: sn.get("CallFlowID"),
                CallFlowID: sn.get("CallFlowID"),
                html: sn.get("Description"),
                func: 'ShowDashboard'
            })
        }

        // listen for any changes to call flows
        VIPSMobile.CallFlows.on('updated', this.populateMenuStore, this);

        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.color = "#000";
    }
});
