//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.MultiLineTextNode', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        items: [{
            xtype: 'textareafield',
            cls: 'field-body',
            itemId: 'field',
            style: {
                height: '100%',
            },
            listeners: {
                painted: function (scope, e, a) {
                    scope.query("textarea")[0].focus();
                }
            }
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            docked: 'bottom',
            margin: '0.5em 0 0 0'
        }]
    },

    statics: {

        getFormattedValue: function (node) {

            if (!node.get('Value')) { node.set('Value', ''); }

            return node.get('Value').toString();
        }

    },

    setup: function (controller, node) {
        var itemsHeight = 0,
            textAreaHeight;
          
        // call parent setup
        this.callParent(arguments);
          
        this.on('painted', function () {
          
            // get the info container
            this.baseHeight = this.element.getHeight();

            Ext.iterate(this.items, function (key, index, obj) {
                if (this.items[index].get('itemId') !== 'field') {
                    itemsHeight += this.items[index].element.getHeight();   
                }                
            });

            textAreaHeight = this.baseHeight - itemsHeight - 25; //15 is fudge/padding
            this.getField().setHeight(textAreaHeight);
            
            
        }, this, { single: true });

    },

    getValue: function () {
        return this.getField().getValue();
    },

    setValue: function (value) {
        if (!value) { value = ''; }
        this.getField().setValue(value);
    }

});
