//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.data.Store', {
    override: 'Ext.data.Store',

    // add a pluck to the store
    pluck: function (field) {
        var i, values;

        values = [];

        for (i = 0; i < this.getCount() ; i++) {
            values.push(this.getAt(i).get(field));
        }

        return values;

    },

    // sql proxies were crap so use this to populate stores from a sql table
    populateFromSQL: function (tableNameOrSql, callbackFn, scope) {
        var objResults, idProp, curIds, i, item, index;

        objResults = {
            added: 0,
            updated: 0,
            deleted: 0
        };

        // get the id property
        idProp = this.getModel().getIdProperty();

        // get the current item ids
        curIds = this.pluck(idProp);

        // check if first param is sql or a table
        if (tableNameOrSql) {
            tableNameOrSql = tableNameOrSql.trim();
        } else {
            tableNameOrSql = '';
        }

        if (tableNameOrSql.toUpperCase().indexOf('SELECT') !== 0) {
            tableNameOrSql = 'SELECT * FROM ' + tableNameOrSql;
        }

        // get the records in the table
        DataFunc.executeSQL({
            sql: tableNameOrSql,
            scope: this,
            success: function (tx, results) {

                // loop through all the records
                for (i = 0; i < results.rows.length; i++) {

                    // get the item from store
                    item = this.getById(results.rows.item(i)[idProp]);

                    // check if item is already in store
                    if (!item) {

                        // add the item to the store
                        this.add(results.rows.item(i));
                        objResults.added += 1;

                    } else {

                        item.set(results.rows.item(i));
                        objResults.updated += 1;

                        // remove the id from the current ids since still valid
                        index = curIds.indexOf(item.getId());
                        if (index >= 0) { curIds.remove(index); }

                    }

                }

                // remove any old items
                for (i = 0; i < curIds.length; i++) {
                    this.remove(this.getById(curIds[i]));
                    objResults.deleted += 1;
                }

                // set the store as loaded
                this.setIsLoaded();

                // execute call back
                if (callbackFn) { callbackFn.apply(scope || this, [this, objResults]); }

            },
            failure: function (tx, ex) {

                console.log('Error populating ' + tableNameOrSql, ex);
                if (callbackFn) { callbackFn.apply(scope || this, [this, ex]); }

            }

        });

    },

    // set the store as loaded and fire load event
    // useful for when manually populate store but still want to mark as loaded
    setIsLoaded: function () {
        this.loaded = true;
        this.fireEvent('load', this, this.getRange(), true);
    },

    // wait for the store to load then execute the callback
    waitForLoad: function (callbackFn, scope) {

        if (this.isLoaded()) {
            callbackFn.apply(scope || this, [this]);
        } else {
            this.on('load', callbackFn, scope, { single: true });
        }

    }

});
