//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.params.ListNode', {
    extend: 'Ext.field.Select',

    config: {
        labelWrap: true,
        labelWidth: '50%',
        controller: null,
        param: true,
        node: null
    },

    setup: function (controller, node) {
        
        this.setController(controller);
        this.setNode(node);

        this.setLabel(node.get('Description'));
        this.setOptions(node.get('Options'));
        
        if (node.get('Value')) {
            this.setValue(node.get('Value'));
        }

        this.on('change', function (item, newValue, oldValue, eOpts) {
            this.getController().onAcceptValueChange(node, this.getValue(), oldValue);
        }, this);
    }
});
