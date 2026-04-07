//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.TableNode', {
    extend: 'VIPSMobile.view.data.Detail',

    tbConfig: {
        title: 'Data',
        items: [{
            text: VIPSMobile.getString('Cancel'),
            ui: 'action back',
            func: 'Index'
        }, {
            text: VIPSMobile.getString('Done'),
            ui: 'action',
            align: 'right',
            func: 'Action',
            addFn: function (controller) {
                // shouldn't show this if coming from cart
                return true;
            },
            disabledFn: function (controller, view) {
                return view.getNodeIndex() === 0;
            }
        }, {
            xtype: 'button',
            itemId: 'closeCf',
            align: 'right',
            text: 'X'
        }]
    },

    config: {
        itemId: 'datadetail',
        node: null,
        controller: null,
        items: [{
            margin: '0.5em',
            //xtype: 'formpanel',
            //fullscreen: true,
            //scrollable: 'vertical',
            //docked: 'body',
            //height: '80%',
            width: '100%',
            itemId: 'tableForm'
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
            var strReturn, strValue, tableNode, valueNode;
            
            if (node.get('CalculatedValueSQL') !== "" && node.get('Value') !== "" & node.getChildNodes().length === 0) {
                strReturn = node.get('Value');
            } else {

                strReturn = '<table class="x-html">';

                for (i = 0; i < node.getChildNodes().length; i++) {
                    tableNode = node.getChildNodes()[i];
                    valueNode = tableNode.getNextNode();

                    if (valueNode && valueNode.get('Value') > 0) {
                        strValue = valueNode.get('Value');
                        strReturn += '<tr><td>' + tableNode.get('Description') + '</td><td>' + strValue + '</td></tr>';
                    }
                }
                strReturn += '</table>';
            }

            return strReturn;

        }
    },

    setup: function (controller, node) {
        
        this.setNode(node);
        this.setController(controller);

        var cnt = this.down('#tableForm'),
            opt, tableNode, valueNode;
        

        node.set('Options', false);
        
        // add all the options as table 
        for (i = 0; i < node.getChildNodes().length; i++) {
            tableNode = node.getChildNodes()[i];
            valueNode = tableNode.getNextNode();

            valueNode.set('Description', tableNode.get('Description'));
            // prepend the value if in debug mode
            strLabel = tableNode.text;
            if (VIPSMobile.User.getDebug()) {
                strLabel += '(' + tableNode.value.toString() + ')';
            }

            strNodeXtype = valueNode.getNodeViewType();

            if (valueNode.get('IsReadOnly')) {
                strNodeXtype = 'LabelNode';
            }

            // check if the field type exists
            if (VIPSMobile.view.data.fields.table[strNodeXtype]) {
                // create the view
                view = Ext.create('VIPSMobile.view.data.fields.table.' + strNodeXtype);
                view.setup(this.getController(), valueNode);
                cnt.add(view);
            } else {
                console.log('node type not found - ' + strNodeXtype + ' for ' + tableNode.get('Description'));

                view = Ext.create('VIPSMobile.view.data.fields.table.IntegerNode');
                view.setup(this.getController(), valueNode);
                cnt.add(view);
            }

        }
        
        // call parent setup
        this.callParent(arguments);

    },

    getValue: function (){
        var node, strReturn, strValue, tableNode, valueNode;
    
            strReturn = '<table>'
            
            node = this.getNode();

            for (i = 0; i < node.getChildNodes().length; i++) {
                tableNode = node.getChildNodes()[i];
                valueNode = tableNode.getNextNode();
                if (valueNode && valueNode.get('Value')){
                    strValue = valueNode.get('Value');
                    strReturn += '<tr><td>' + tableNode.get('Description') + '</td><td>' + strValue + '</td></tr>';    
                }
            }
            strReturn += '</table>'

            return strReturn;

    },

    setValue: Ext.emptyFn

});
