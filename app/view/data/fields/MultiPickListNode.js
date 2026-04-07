//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.MultiPickListNode', {
    extend: 'VIPSMobile.view.data.Detail',

    checkedField: null,
    config: {
        layout: {
            type: 'vbox',
            align: 'stretch',
            pack: 'start'
        },
        items: [{
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            margin: '0.5em 0 0 0',
            docked: 'bottom'
        }]
    },

    statics: {
        
        getTypedValue: function (value) {

            if (value && typeof(value) === "object" && value.indexOf('ALL') !== -1) {
                value = value.splice(1);
            }

            return value;

        },
        // used as a tooltip essentially
        getFormattedValue: function (node) {
            //node.get('Value').join(',') + '<br />

            var value, option, i;

            value = '';
            if (node.get('Options')) {
                for (i = 0; i < node.get('Options').length; i++) {
                    if (Ext.isArray(node.get('Value'))) {
                        if (node.get('Value').indexOf(node.get('Options')[i].value) > -1) {
                            if (value.length > 0) {
                                value += ', ';
                            }
                            option = node.get('Options')[i].text;
                            if (option.indexOf(' - ') > 0) {
                                option = option.substring(0, option.indexOf(' - '));
                            }
                            value += option;
                        }
                    } else {
                        if (node.get('Value') === node.get('Options')[i].value) {
                            value = node.get('Options')[i].text;
                            break;
                        }
                    }

                }
            }

            if (value !== null) {

                value = value.toString();

                // remove sub heading if set, ie distance label
                if (value.indexOf('<br') > 0) {
                    value = value.substring(0, value.indexOf('<br'));
                }
                
                if (value.indexOf('ALL,') > 0) {
                    value = value.substring(0, 4);
                }

                return value;

            }
            return 'Tap To Add';

        }

    },

    setup: function (controller, node) {

        // call parent setup
        this.callParent(arguments);
        
        var i, strLabel, childValues, checkField, value, arrOptions;

        this.checkedField = null;
        this.node = node;
        
        // get all the values into an array to check while building list
        value = node.get("Value");
        if (Ext.isArray(value)) { 
            childValues = value; 
        } else if (typeof value === "string") {
            childValues = value.split(",");            
        } else {
            childValues = [];
        }

        arrOptions = node.get('Options');

        if (arrOptions.length > 5) {
            checkField = this.add({
                xtype: 'checkboxfield',
                name: 'ALL' + node.get('id'),
                label: 'Select All',
                labelWidth: '75%',
                labelWrap: true,
                checked: (childValues.length === arrOptions.length),
                listeners: {
                    change: function (obj, newIsChecked, oldWasChecked) {
                        var checkBoxes = obj.parent.query('checkboxfield');
                        
                        // Loop all but Select All                            
                        for (i = 1; i < checkBoxes.length; i++) {
                            checkBoxes[i].setChecked(newIsChecked);
                        }
                        
                    }
                }
            });
            checkField.VIPSValue = 'ALL';        
        }

        // add all the options as radios
        for (i = 0; i < arrOptions.length; i++) {

            // prepend the value if in debug mode
            strLabel = arrOptions[i].text;
            if (VIPSMobile.User.getDebug()) {
                strLabel += '(' + arrOptions[i].value.toString() + ')';
            }

            checkField = this.add({
                xtype: 'checkboxfield',
                name: node.get('FieldToStoreValue') + node.get('id'),
                label: strLabel,
                labelWidth: '75%',
                labelWrap: true,
                checked: childValues.indexOf(arrOptions[i].value) >= 0
                //, listeners: {
                //    change: function (obj) {
                //        var selectAllCheckBox = obj.parent.down("checkboxfield[VIPSValue='ALL']"),
                //            checkBoxes = obj.parent.query('checkboxfield'),
                //            intCountChecked = 0,
                //            newIsChecked = obj.getChecked();
                //        
                //        console.log(arguments);
                //
                //        // Loop all but Select All                            
                //        for (i = 1; i < checkBoxes.length; i++) {
                //            intCountChecked += checkBoxes[i].getChecked() ? 1 : 0;
                //        }
                //
                //        if(!newIsChecked && intCountChecked==0){
                //            selectAllCheckBox.setChecked(newIsChecked);
                //        } else if(newIsChecked){
                //            selectAllCheckBox.setChecked(newIsChecked);
                //        }
                //    }
                //}
            });
            checkField.VIPSValue = arrOptions[i].value;
                     
        }

        this.setScrollable('vertical');


    },

    getValue: function () {
        return Ext.pluck(this.query('checkboxfield[checked=true]'), 'VIPSValue');
    },

    setValue: function (value) {
        var i, check;

        // make sure it's an array
        if (Ext.isArray(value)) { 
            childValues = value; 
        } else if (typeof value === "string") {
            childValues = value.split(",");            
        } else {
            childValues = [];
        }
        // check all the given nodes
        for (i = 0; i < childValues.length; i++) {

            check = this.down('checkboxfield[VIPSValue=' + childValues[i] + ']');
            if (check) { check.setChecked(true); }

        }

    }

});
