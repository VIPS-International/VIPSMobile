//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.CallFlows', {
    mixins: ['Ext.mixin.Observable'],
    alternateClassName: ['CallFlows'],
    singleton: true,

    requires: [
        'VIPSMobile.SQLTables',
        'VIPSMobile.Sync',
        'VIPSMobile.util.CallFlow',
        'VIPSMobile.util.DataFunc',
        'VIPSMobile.util.Globals'
    ],

    AnswerMethod: {
        Unanswered: 1, 1: 'Unanswered',
        Previous: 2, 2: 'Previous',
        Default: 4, 4: 'Default',
        Calculated: 8, 8: 'Calculated',
        Global: 16, 16: 'Global',
        User: 256, 256: 'User'
    },

    config: {
        byId: {},
        byCustNoDCNo: {},
        currentBySection: {}
    },

    constructor: function (config) {
        var strSQL;

        this.initConfig(config);

        // create the globals object
        this.globals = Ext.create('VIPSMobile.util.Globals');

        // create any needed sql tables
        strSQL = [
            'CREATE TABLE IF NOT EXISTS DataDrafts (CallFlowID INTEGER, StartNodeID INTEGER, SavedAt INTEGER, Nodes TEXT, Cart TEXT, PRIMARY KEY (CallFlowID asc))'
        ];
        DataFunc.executeMany({
            statements: strSQL,
            scope: this            
        });

        // Whenever call flow nodes sync, update the call flows
        VIPSMobile.Sync.addAfterSync(SQLTables.Tables.CallFlowDef, this.processNodes, this);

    },

    // can get by callflowid or custno, dcno
    get: function (callflowCustId, DCNo) {

        if (!DCNo) {
            return this.getById()[callflowCustId];
        }

        return this.getByCustNoDCNo()[callflowCustId + '_' + DCNo];

    },

    // get the current call flow for the given controller.  section can be string or controller instance
    getCurrent: function (section) {
        var id, cf;

        if (section === undefined) { section = VIPSMobile.Main.getCurrentSection(); }

        if (Ext.isObject(section)) { section = section.getSection(); }

        id = this.getCurrentBySection()[section];
        if (id) { cf = this.get(id); }

        return cf;

    },
    setCurrent: function (section, callflow) {

        if (Ext.isObject(section)) { section = section.getSection(); }

        if (callflow) {

            if (Ext.isObject(callflow)) { callflow = callflow.getCallFlowID(); }

            this.getCurrentBySection()[section] = callflow;

        } else {

            delete this.getCurrentBySection()[section];

        }

    },

    count: function () {
        return Object.keys(this.getById()).length;
    },

    // update the data menu when sync is done
    processNodes: function (results) {
        var cf, cfConfigs;

        // only update if called from setup or records changed
        if (results === undefined || results.records.length > 0) {

            // delete any drafts for changed nodes
            if (results && results.records) {
                this.DeleteDraftsOnNodeChanges(results.records);
            }

            // populate the call flow nodes store
            Ext.getStore('CallFlowNodes').populateFromSQL(SQLTables.Tables.CallFlowDef, function () {

                // get all the call flow configs based on nodes
                cfConfigs = this.getCallflowConfigs();

                // create all the call flow objects
                Ext.iterate(cfConfigs, function (id, config) {

                    // create or update the call flow object
                    cf = this.get(config.CallFlowID);
                    if (!cf && config.callFlowID) {

                        // create the call flow object
                        cf = Ext.create('VIPSMobile.util.CallFlow', config);

                        // set reference to call flow by id and custno, dc no
                        this.getById()[config.callFlowID] = cf;
                        this.getByCustNoDCNo()[config.custNo + '_' + config.DCNo] = cf;


                    } else {

                        // update 'has' values incase new node added
                        cf.setHasMapNode(config.hasMapNode);
                        cf.setHasSQLReportNode(config.hasSQLReportNode);
                        cf.setHasProductNode(config.hasProductNode);

                    }

                }, this);

                // fire the updated event so data controllers can update
                this.fireEvent('updated');

            }, this);

        }

    },

    getCallflowConfigs: function () {
        var i, cfConfigs, nodes, key;

        cfConfigs = {};

        // get all the call flow nodes
        nodes = Ext.getStore('CallFlowNodes').getRange();

        // get all the call flow configs based on nodes
        for (i = 0; i < nodes.length; i++) {

            // get the key for the call flow
            key = nodes[i].get('CustNo') + '_' + nodes[i].get('DCNo');

            // create the call flow object if needed
            if (!cfConfigs[key]) {
                cfConfigs[key] = {
                    custNo: nodes[i].get('CustNo'),
                    DCNo: nodes[i].get('DCNo')
                };
            }

            // based on the node type, set call flow info
            switch (nodes[i].get('TypeID')) {
                case CallFlowNode.Types.LocationNode: cfConfigs[key].hasMapNode = true; break;
                case CallFlowNode.Types.MapNode: cfConfigs[key].hasMapNode = true; break;
                case CallFlowNode.Types.SQLWebReportNode: cfConfigs[key].hasSQLReportNode = true; break;
                case CallFlowNode.Types.ProductDetail: cfConfigs[key].hasProductNode = true; break;
                case CallFlowNode.Types.StartNode:
                    cfConfigs[key].callFlowID = nodes[i].get('CallFlowID');
                    cfConfigs[key].description = nodes[i].get('Description');
                    cfConfigs[key].secondaryDescription = nodes[i].get('SecondaryDescription');
                    cfConfigs[key].thumbnail = nodes[i].get('Thumbnail');
                    cfConfigs[key].colour = DataFunc.GetColourRGBFromVBColour(nodes[i].get('Colour'));
                    cfConfigs[key].calculatedValueSQL = nodes[i].get('CalculatedValueSQL');
                    cfConfigs[key].inputMethod = nodes[i].get('InputMethod');
                    break;
            }

        }

        return cfConfigs;

    },

    // delete drafts for any call flows where the nodes have changed
    DeleteDraftsOnNodeChanges: function (records) {
        var i, cf;

        // loop through each record
        for (i = 0; i < records.length; i++) {

            // get the call flow
            cf = this.get(records[i].CustNo, records[i].DCNo);

            // clear the draft if call flow found
            if (cf) { cf.DeleteDraft(); }

        }

    },

    // check if the call flow is ready to be used (ie loaded, draft set, etc)
    callflowReady: function (callflowId, callbackFn, scope) {
        var cf, blnReady, me;

        // check if the call flow is ready
        cf = this.get(callflowId);
        if (cf) {
            blnReady = cf.getReady();
        } else {
            blnReady = false;
        }

        if (blnReady) {

            callbackFn.apply(scope);

        } else {

            me = this;
            setTimeout(function () {
                me.callflowReady(callflowId, callbackFn, scope);
            }, 100);

        }

    }

});
