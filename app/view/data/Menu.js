//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.Menu', {
    extend: 'Ext.dataview.List',
    xtype: 'DataMenu',

    tbConfig: {
        title: 'Data',
        items: [{
            text: VIPSMobile.getString('Back'),
            ui: 'back action',
            func: 'MenuBack'
        }, {
            itemId: 'datarefresh',
            iconCls: 'refresh',
            iconMask: true,
            html: ' Sync',
            func: 'Refresh'
        }]
    },

    config: {
        itemId: 'datamenu',
        store: 'DataMenu',
        emptyText: VIPSMobile.getString('No options available'),
        loadingText: '',
        grouped: true,
        func: 'DataMenu',
        panel: 'set in setup',
        cls: 'clientbackground rightborder',

        itemTpl: new Ext.XTemplate(
            '<div style="display:-webkit-box;">',
            "<span class='listthumb' style='width: 2em;height: 2em;-webkit-mask-image:url(\"data:image/png;base64,{Thumbnail}\");'></span>",
            '<div style="-webkit-box-flex:1;">{Description}',
            '<tpl if="Badge">',
            '<br/><span class="indexvalue answered">{Badge}</span>',
            '</tpl>',
            '</div>',
            '<tpl if="Draft">',
            '<span class="draft answered">[ ' + VIPSMobile.getString('draft') + ' ]</span>',
            '</tpl>',
            '<tpl if="VIPSMobile.User.getDebug()"><div class="debuginfo">{CallFlowID}</div></tpl>',
            '</div>'
        ),

        controller: null

    },

    setup: function (controller) {

        // remember the controller responsible for the view
        this.setController(controller);

        // set the title to the current section
        this.tbConfig.title = controller.getSection();

        // hide the back button if not calendar
        this.tbConfig.items[0].hidden = true;

        // which panel it is displayed in can be changed by multi panel setting
        if (VIPSMobile.Main.useMultiPanels() && VIPSMobile.User.getMultiPanelOptions()[VIPSMobile.User.MultiPanelOptions.DataLeftPanel] === 'M') {
            this.setPanel('left');
        } else {
            this.setPanel('full');
        }

        // hide the selected option if not multi panel
        if (!VIPSMobile.Main.useMultiPanels()) {
            this.setSelectedCls('');
        }

        // populate the menu store
        this.populateMenuStore();

        // listen for any changes to call flows
        VIPSMobile.CallFlows.on('updated', this.populateMenuStore, this);

    },

    // called when set up or whenever the call flows change
    populateMenuStore: function () {
        var filter;

        // get the filter for the menu
        filter = this.getController().getMenuFilter();

        // clear the store
        this.getStore().removeAll();

        // loop through each call flow
        Ext.iterate(VIPSMobile.CallFlows.getById(), function (id, cf) {

            // check if should show the call flow
            id = parseInt(id, 10);
            if (!filter || filter.indexOf(id) >= 0) {

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
