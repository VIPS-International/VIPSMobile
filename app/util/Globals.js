//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.Globals', {

    require: ['VIPSMobile.Version'],

    flags: {
        Read: 1,
        Write: 2,
        ClearOnSave: 4,
        DiscardClear: 8
    },

    config: {
        values: {}
    },

    constructor: function (config) {
        var ls;

        this.initConfig(config);

        // load from local storage if set
        if (localStorage[VIPSMobile.Version.getLSPrefix() + 'globals']) {

            ls = JSON.parse(localStorage[VIPSMobile.Version.getLSPrefix() + 'globals']);

            // for backwards compatibility
            if (ls.values) {
                this.setValues(ls.values);
            } else {
                this.setValues(ls);
            }

        }

    },

    getValue: function (key) {
        return this.getValues()[key];
    },

    setValue: function (key, value) {

        if (value) {
            this.getValues()[key] = value;
        } else {
            delete this.getValues()[key];
        }

        this.save();

    },

    clearForCallFlow: function (callflow) {
        var i, field, changed;

        if (Ext.isNumber(callflow)) {
            callflow = VIPSMobile.CallFlows.get(callflow);
        }

        // get all the globals for the call flow
        DataFunc.executeSQL({
            sql: 'SELECT DISTINCT FieldToStoreValue FROM VIPSMobileDatadboCallFlowDef WHERE CustNo=? AND DCNo=? AND IsGlobal&?',
            params: [callflow.getCustNo(), callflow.getDCNo(), VIPSMobile.CallFlows.globals.flags.ClearOnSave],
            scope: this,
            success: function (tx, results) {

                changed = false;

                for (i = 0; i < results.rows.length; i++) {

                    field = results.rows.item(i).FieldToStoreValue;

                    if (this.getValue(field)) {
                        this.setValue(field, null);
                        changed = true;
                    }

                }

                // save the globals if they changed
                if (changed) { this.save(); }

            },
            failure: function (tx, ex) {
                console.error('Error clearing globals for ' + callflow.getCallFlowID(), ex);
            }
        });

    },

    // save globals to local storage
    save: function () {

        localStorage[VIPSMobile.Version.getLSPrefix() + 'globals'] = Ext.encode({
            values: this.getValues()
        });

    }

});
