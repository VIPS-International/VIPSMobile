//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.params.DateNode', {    
    extend: 'Ext.field.Text',

    config: {
        inputType: 'date',
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
        
        this.element.query('.x-field-input')[0].setAttribute('style', 'border: 1px solid #999');
        
        if (node.get('Value')) {            
            this.setValue(node.get('Value'));
        }

        this.on('change', function (item, newValue, oldValue, eOpts) {            
            this.getController().onAcceptValueChange(node, this.getValue(), oldValue);
        }, this);       

    },

    getValue: function () {
        var value, inputEl = this.element.dom.getElementsByTagName('Input')[0];        
        
        value =  inputEl.value;
        
        if (value === "" || value === null) {
            return null;
        }
        value = Ext.Date.parseDate(value, 'Y-m-d');

        return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);

    },
    
    setValue: function (value) {
        // convert date to picker object value
        value = VIPSMobile.view.data.fields.DateNode.ConvertValueToDate(value);
        var inputEl = this.element.dom.getElementsByTagName('Input')[0];
        
        inputEl.value = value.getFullYear() + '-' + DataFunc.lpad((value.getMonth() + 1), 2) + '-' + DataFunc.lpad(value.getDate(), 2);
    }
});
