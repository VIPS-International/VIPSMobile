//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.library.Menu', {
    extend: 'Ext.NestedList',

    tbConfig: {
        title: VIPSMobile.getString('Library'),
        items: [{
            text: VIPSMobile.getString('Back'),
            itemId: 'MenuBack',
            func: 'MenuBack',
            ui: 'back action'
        }, {
            itemId: 'librefresh',
            iconCls: 'refresh',
            iconMask: true,
            align: 'right',
            func: 'Refresh'
        }, {
            itemId: 'NewButton',
            align: 'right',
            text: VIPSMobile.getString('New'),
            ui: 'action',
            func: 'NewFilesButton',
            addFn: function (controller) {
                return controller.getNewFiles().length > 0;
            }
        }, {
            itemId: 'RecentButton',
            align: 'right',
            text: VIPSMobile.getString('Recent'),
            ui: 'action',
            func: 'RecentFilesButton',
            addFn: function (controller) {
                return controller.getRecentFiles().length > 0;
            }
        }]
    },

    grouped: true,

    config: {
        itemId: 'libraryMenu',
        store: 'LibraryItems',
        title: VIPSMobile.getString('Library'),
        panel: 'full',
        displayField: 'text',
        toolbar: { hidden: true },
        selectedCls: '',
        controller: false,
        listeners: {
            itemtap: function (scope, list, index, target, record, e, eOpts) {
                var nestedList = scope;
                
                setTimeout(function(){
                    console.log(nestedList, nestedList.getBackButton()._hidden);
                    nestedList.getController().getMain().down('#MenuBack').setHidden(nestedList.getBackButton()._hidden);    
                }, 200);
                
            }
        }
    },

    setup: function (controller) {

        this.setController(controller);

        this.on('itemtap', function () {
            return controller.markPathAsVisited.apply(controller, arguments);
        });

        this.on('leafitemtap', function () {
            controller.markPathAsVisited.apply(controller, arguments);
            return controller.DisplayItem.apply(controller, arguments);
        });
        
        controller.getMain().down('#MenuBack').setHidden(true);

    },

    getItemTextTpl: function (node) {
        var intEMs = (Ext.Viewport.getWindowWidth() > 600) ? '3.5' : '2';
        
        return [
            '<div class="" style="display:flex;align-items:center;justify-content: flex-start;">',
            '<tpl if="contents">',
            '<div style="flex: 10 10 auto" >{contents}</div>',
            '</tpl>',
            '<tpl if="text">',
            '<div style="width: ' + (parseFloat(intEMs) + 1).toString() + 'em" class="draft answered">',
            '<tpl if="thumbnail">',
            '<span class="librarylistthumb listthumb" style="width:' + intEMs + 'em;height:' + intEMs + 'em;background-image:url({thumbnail})"></span>',
            '<tpl elseif="csClass">',
            '<span style="width:' + intEMs + 'em;height:' + intEMs + 'em;margin:auto;" class="listthumb {csClass}"></span>',
            '</tpl>',
            '</div>',
            '<div style="flex-grow: 1; white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{text}',
            '<tpl if="description">',
            '<div class="indexvalue" style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{description}</div>',
            '</tpl>',
            '</div>',
            '<div style="width: 4em" class="draft answered">',
            '<tpl if="new">',
            '[ ' + VIPSMobile.getString('new') + ' ]',
            '</tpl>',
            '</div>',
            '<tpl if="csClass == \'folder-png\'">',
            '<div style="width: 1em;height: 1em;" class="right-chevron"></div>',
            '</tpl>',
            '</tpl>',
            '</div>',            
        ].join('');
    }

});
