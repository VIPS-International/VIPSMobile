//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.table.LengthOfTimeNode', {    
    extend: 'Ext.field.Field',
    xtype: 'tableLengthOfTimeNode',

    config: {
        component: {
            xtype: 'container',
            layout: 'hbox',
            defaults: {
                xtype: 'textfield',                
                labelWidth: '1.7em',
                inputType: 'tel',
                style: {
                   'border': '1px solid black'
                }
            },
            items:[{   
                itemId: 'hours',
                label: 'H:'
            }, {
                itemId: 'mins',
                label: 'M:'
            }]        
        },  
        hours: null,
        mins: null,                    
        label:'label',        
        labelWrap: true,
        labelWidth: '33%',
        controller: null,
        node: null
    },
    
    getValue(){
        return computeValue();
    },

    setValue() {
        var cmp = this.getComponent(),
            value = parseInt(this.getNode().get('Value'), 10);

        this.getHours().setValue(parseInt(value/60, 10));
        this.getMins().setValue(parseInt(value%60, 10));

    },

    setup: function (controller, node) {

        this.setController(controller);
        this.setNode(node);
        var cmp = this.getComponent();

        this.setHours(cmp.query("#hours")[0]);
        this.setMins(cmp.query("#mins")[0]);

        this.setLabel(node.get('Description'));
                
        if (node.get('Value')) {
            this.setValue(node.get('Value'));
        }

        var fnChangeValue = function (item, newValue, oldvalue, eOpts) {
            var tmpValue = this.computeValue(item, newValue, oldvalue);

            this.getController().getCallFlow().SetNodeValue(this.getNode(), tmpValue, VIPSMobile.CallFlows.AnswerMethod.User);

        };

        this.getHours().on('change', fnChangeValue, this);       
        this.getMins().on('change', fnChangeValue, this);       

    },

    computeValue: function (item, newValue, oldvalue){
        var tmpValueHrs = this.getHours().getValue(),
            tmpValueMins = this.getMins().getValue();

        return (parseInt(tmpValueHrs*60, 10)||0) + (parseInt(tmpValueMins, 10)||0);

    }

});
