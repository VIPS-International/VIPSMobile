//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.UseListItemsAsOptions', {
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

        // used as a tooltip essentially
        getFormattedValue: function (node) {
            //node.get('Value').join(',') + '<br />

            var value, option, i;

            value = '';
            if (node.get('Options')) {
                for (i = 0; i < node.get('Options').length; i++) {
                    if (Ext.isArray(node.get('Value'))) {
                        for (j = 0; j < node.get('Value').length; j++) {
                            if (node.get('Value')[j].toString() === node.get('Options')[i].value.toString()) {
                                if (value.length > 0) {
                                    value += ', ';
                                }
                                option = node.get('Options')[i].text;
                                if (option.indexOf(' - ') > 0) {
                                    option = option.substring(0, option.indexOf(' - '));
                                }
                                value += option;
                            }
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

                return value;

            }
            return 'Tap To Add';

        }

    },

    setup: function (controller, node) {
        var i, strLabel, childValues, checkField;

        this.checkedField = null;
        this.node = node;

        // get all the child values into an array to check while building list
        childValues = [];
        if (node.getChildNodes().length > 0) {
            for (i = 0; i < node.getChildNodes().length; i++) {
                childValues.push(node.getChildNodes()[i].get('Value').toString());
            }
        }

        // add all the options as radios
        for (i = 0; i < node.get('Options').length; i++) {

            // prepend the value if in debug mode
            strLabel = node.get('Options')[i].text;
            if (VIPSMobile.User.getDebug()) {
                strLabel += '(' + node.get('Options')[i].value.toString() + ')';
            }

            checkField = this.add({
                xtype: 'checkboxfield',
                name: node.get('FieldToStoreValue') + node.get('id'),
                label: strLabel,
                labelWidth: '75%',
                labelWrap: true,
                checked: childValues.indexOf(node.get('Options')[i].value) >= 0,
                // disabled: childValues.indexOf(node.get('Options')[i].value) >= 0,
                func: 'Dynamic'
            });
            checkField.VIPSValue = node.get('Options')[i].value;

        }

        this.setScrollable('vertical');

        // call parent setup
        this.callParent(arguments);

    },

    getValue: function () {
        return Ext.pluck(this.query('checkboxfield[checked=true]'), 'VIPSValue');
    },

    setValue: function (value) {
        var i, check;

        // make sure it's an array
        if (!Ext.isArray(value)) { value = [value]; }

        // check all the given nodes
        for (i = 0; i < value.length; i++) {

            check = this.down('checkboxfield[VIPSValue=' + value[i] + ']');
            if (check) { check.setChecked(true); }

        }

    }

});
