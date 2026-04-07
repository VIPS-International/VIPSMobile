//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.Index', {
    extend: 'Ext.dataview.List',

    tbConfig: {
        title: VIPSMobile.getString('Data'),
        items: [{
            text: VIPSMobile.getString('Menu'),
            ui: 'back action',
            func: 'Back',
            addFn: function (controller) {
                return !VIPSMobile.Main.useMultiPanels();
            }
        }, {
            xtype: 'togglefield',
            itemId: 'OnActionNextToggle',
            cls: 'OnActionNextToggle',
            align: 'right',
            style: 'font-size: 0.7em',
            label: 'Auto Advance',
            labelWidth: '6em',
            func: 'AutoAdvance',
            addFn: function (controller) {
                return VIPSMobile.Main.useMultiPanels();
            },
            initFn: function () {
                this.setValue(VIPSMobile.User.getOnActionNext());
            }
        }, {
            itemId: 'SavedReportsButton',
            align: 'right',
            text: VIPSMobile.getString('Saved'),
            ui: 'action',
            func: 'ShowSavedReports',
            addFn: function (controller) {
                var callflow = VIPSMobile.CallFlows.getCurrent(controller);
                return callflow.getSavedReports() && callflow.getSavedReports().length > 0;
            }
        }, {
            itemId: 'DataCart',
            align: 'right',
            iconCls: 'shop1',
            iconMask: true,
            ui: 'action',
            func: 'DataCart',
            addFn: function (controller) {
                var count, visable, cf, store;

                cf = VIPSMobile.CallFlows.getCurrent(controller);
                visable = cf.getHasProductNode();

                if (visable) {

                    Ext.create('Ext.util.DelayedTask', function () {
                        var CartButtonInfo = { Method: "sum", Field: 'Quantity' };

                        store = cf.getCartStore();
                        if (cf._nodeTree && cf._nodeTree.data.JavaScript) {
                            cf._nodeTree.javaOptions = new Function(cf._nodeTree.data.JavaScript)();
                            if (cf._nodeTree.javaOptions && cf._nodeTree.javaOptions.CartButtonInfo) {
                                CartButtonInfo = cf._nodeTree.javaOptions.CartButtonInfo;
                            }
                        }

                        count = store[CartButtonInfo.Method](CartButtonInfo.Field);

                        VIPSMobile.Main.setBadgeText('#DataCart', count, false);

                    }, this).delay(250);

                }

                return visable;

            }
        }, {
            xtype: 'button',
            itemId: 'closeCf',
            align: 'right',
            text: 'X'
        }]
    },

    config: {
        itemId: 'dataindex',
        grouped: true,
        loadingText: '',
        scrollToTopOnRefresh: false,
        func: 'DataIndex',
        panel: 'set in setup',
        cls: 'rightpanel',

        itemTpl: new Ext.XTemplate(
            '<tpl for=".">',
            '<div>',
            '<tpl switch="NodeTypeDesc">',
            '<tpl case="DynamicNode">',
            '<div class="answered">',
            '<tpl if="Thumbnail"><i class="fa fa-{Thumbnail}"></i></tpl>',
            '&nbsp;{Description}',
            '</div>',
            '<div class="indexvalue">{FormattedValue}{ListNotFoundText}</div>',
            '<tpl case="SaveNode">',
            '<div class="x-button"><div class="x-button-label">{Description}</div></div>',
            '<tpl case="SQLWebReportNode">',
            '<div class="indexsave">',
            '<tpl if="Thumbnail"><i class="fa fa-{Thumbnail}"></i></tpl>',
            '&nbsp;{Description}',
            '</div>',
            '<tpl case="LabelNode">',
            '<div class="answered">',
            '<tpl if="Thumbnail"><i class="fa fa-{Thumbnail}"></i></tpl>',
            '&nbsp;{Description}',
            '</div>',
            '<tpl if="FormattedValue != \'\'">',
            '<div class="indexvalue x-html">{FormattedValue}</div>',
            '</tpl>',
            '<tpl default>',
            '<tpl if="Answered == 1">',
            '<div class="unanswered">',
            '<tpl if="Thumbnail"><i class="fa fa-{Thumbnail}"></i></tpl>',
            '&nbsp;{Description}',
            '</div>',
            '<tpl else>',
            '<div class="answered">',
            '<tpl if="Thumbnail"><i class="fa fa-{Thumbnail}"></i></tpl>',
            '&nbsp;{Description}',
            '</div>',
            '<tpl if="FormattedValue != \'\'">',
            '<div class="indexvalue">{FormattedValue}</div>',
            '</tpl>',
            '</tpl>',
            '</tpl>',
            '<tpl switch="ValidationType">',
            '<tpl case="warning">',
            '<span class="validation warning">{ValidationText}</span>',
            '<tpl case="error">',
            '<span class="validation error">{ValidationText}</span>',
            '</tpl>',
            '<tpl if="VIPSMobile.User.getDebug()"><span class="debuginfo">{CallFlowID} | {SortKey} | {Group}</span></tpl>',
            '</div>',
            '</tpl>'
        )

    },

    setup: function (controller) {

        // which panel it is displayed in can be changed by multi panel setting
        if (VIPSMobile.Main.useMultiPanels() && VIPSMobile.User.getMultiPanelOptions()[VIPSMobile.User.MultiPanelOptions.DataLeftPanel] === 'M') {
            this.tbConfig.title = null;
            this.setPanel('right');
        } else {
            this.setPanel('full');
        }

    }

});
