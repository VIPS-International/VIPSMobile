//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.ScanNode', {
    extend: 'VIPSMobile.view.data.Detail',

    requires: ['VIPSMobile.store.KeyValueItems'],

    checkedField: null,
    config: {

        items: [{
            xtype: 'textfield',
            itemId: 'entry'
        }, {
            xtype: 'list',
            itemId: 'entiesList',
            store: 'KeyValueItems',
            itemTpl: '{value}',
            selectedCls: '',
            flex: 1
        }],

        layout: 'vbox'

    },

    statics: {

        // used as a tooltip essentially
        getFormattedValue: function (node) {
            return 'Click to add more';
        }

    },

    setup: function (controller, node) {
        var store, i;

        //this.checkedField = null;
        //this.node = node;
        //me = this;

        // clear current store
        store = this.down('#entiesList').getStore();
        store.removeAll();

        // get all the child values into an array to check while building list
        for (i = 0; i < node.getChildNodes().length; i++) {
            store.add({
                value: node.getChildNodes()[i].get('FormattedValue'),
                key: node.getChildNodes()[i].get('Value')
            });
        }

        this.setScrollable('vertical');

        this.down('#entry').on('action', this.onEntryAction, this);
        this.down('#entry').focus();

        // call parent setup
        this.callParent(arguments);

    },

    onEntryAction: function (field) {
        var node, value, strSQL;

        node = this.getNode();
        value = field.getValue();

        // check if already in the list
        if (!this.valueInList(value)) {

            if (this.getNode().get('CalculatedValueSQL')) {

                strSQL = node.get('CalculatedValueSQL');
                DataFunc.PrepareQuery(node, strSQL);
                strSQL = strSQL.replace(new RegExp('\\[' + node.get('FieldToStoreValue') + '\\]', 'gi'), value);

                DataFunc.executeSQL({
                    sql: strSQL,
                    scope: this,
                    success: function (tx, results) {

                        if (results.rows.length > 0) {
                            this.addEntryToList(value, DataFunc.GetScalarValue(results));
                        } else {
                            Ext.Msg.alert('bob', 'Not Found');
                        }

                    },
                    failure: function (tx, ex) {
                        console.error('UseManualKeyEntry.onEntryAction() error', node);
                        this.addEntryToList(value, value);
                    }
                });

            } else {

                this.addEntryToList(value, value);

            }

        }

        // clear entry box
        this.down('#entry').setValue('');
        this.down('#entry').focus();

    },

    valueInList: function (value) {
        var store, index;

        store = this.down('#entiesList').getStore();
        index = store.find('key', value);

        return (index >= 0) ? store.getAt(index) : null;

    },

    addEntryToList: function (key, value) {

        // add the product to the list
        this.down('#entiesList').getStore().add({
            value: value,
            key: key
        });

    },

    getValue: function () {
        return '';
    },

    setValue: Ext.emptyFn

});
