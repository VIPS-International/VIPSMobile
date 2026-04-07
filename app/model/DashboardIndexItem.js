//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.model.DashboardIndexItem', {
    extend: 'Ext.data.Model',

    requires: ['VIPSMobile.CallFlows'],

    config: {

        identifier: 'sequential',

        fields: [
            { name: 'id', type: 'integer' },
            { name: 'Answered', type: 'integer', defaultValue: VIPSMobile.CallFlows.AnswerMethod.Unanswered },
            { name: 'CalculatedValueSQL', type: 'string' },
            { name: 'CallFlowID', type: 'integer' },
            { name: 'ChildNodeIds', defaultValue: [] },
            { name: 'Colour', type: 'integer' },
            { name: 'CustNo', type: 'integer' },
            { name: 'DCNo', type: 'integer' },
            { name: 'Description', type: 'string' },
            { name: 'DefaultValue', type: 'string' },
            { name: 'Dest1SQL', type: 'string' },
            { name: 'Destination1', type: 'integer' },
            { name: 'Destination2', type: 'integer' },
            { name: 'DynamicAsTable', type: 'boolean' },
            { name: 'DynamicListMode', type: 'integer' },
            { name: 'ExcludeFromLoad', type: 'boolean' },
            { name: 'ExcludeFromPrimaryKeyForLoad', type: 'boolean' },
            { name: 'ExcludeFromSave', type: 'boolean' },
            { name: 'ExtraSQLInsertStatement', type: 'string' },
            { name: 'FieldToStoreValue', type: 'string' },
            { name: 'FKColumn', type: 'string' },
            { name: 'FormattedValue', type: 'string', defaultValue: '' },
            { name: 'Group', type: 'string' },
            { name: 'Height', type: 'integer' },
            { name: 'Hidden', type: 'boolean' },
            { name: 'InputMethod', type: 'integer' },
            { name: 'IsGlobal', type: 'integer' },
            { name: 'IsPrimaryKey', type: 'boolean' },
            { name: 'IsPrimaryKeyForThisTableOnly', type: 'boolean' },
            { name: 'IsReadOnly', type: 'boolean' },
            { name: 'JavaScript', type: 'string' },
            { name: 'LastChange', type: 'integer' },
            { name: 'ListNotFoundText', type: 'string' },
            { name: 'ListSQL', type: 'string' },
            { name: 'NarationSQL', type: 'string' },
            { name: 'NextNodeId', type: 'integer' },
            { name: 'NodeTypeDesc', type: 'string' },
            { name: 'OnAcceptAction', type: 'integer' },
            { name: 'OverrideLoadPrevDataSQL', type: 'string' },
            { name: 'Options' },
            { name: 'ParentNodeId', type: 'integer' },
            { name: 'PreviousRecordId', type: 'integer' },
            { name: 'PrevNodeId', type: 'integer' },
            { name: 'ReLoadPreviousEntriesOnChange', type: 'boolean' },
            { name: 'ReCalcValueSQLAgainBeforeSave', type: 'boolean' },
            { name: 'RequiredFields', type: 'string' },
            { name: 'SaveAnswerTypes', type: 'integer' },
            { name: 'SaveSuccessDescription', type: 'string' },
            { name: 'SecondaryDescription', type: 'string' },
            { name: 'SkipSaveIFNull', type: 'boolean' },
            { name: 'SortKey', type: 'string' },
            { name: 'StorageTable', type: 'string' },
            { name: 'SQLWebReportParams', type: 'string' },
            { name: 'TypeID', type: 'integer' },
            { name: 'ValidationSQL', type: 'string' },
            { name: 'Value' },
            { name: 'ValidationText', type: 'string', defaultValue: '' },
            { name: 'ValidationType', type: 'string', defaultValue: '' },
            { name: 'Width', type: 'integer' },
            { name: 'LeadingCharacter', type: 'string' },
            { name: 'MaxInputLength', type: 'integer' }
        ]

    },

    isAnswered: function () {
        return (this.get('Answered') !== 0 && this.get('Answered') !== VIPSMobile.CallFlows.AnswerMethod.Unanswered);
    },

    getNodeViewType: function () {
        var strNodeXtype;

        if (this.get('TypeID') === CallFlowNode.Types.DynamicNode && !this.get('DynamicAsTable')) {
            strNodeXtype = CallFlowNode.DynamicListModes[this.get('DynamicListMode')];
        } else if (this.get('TypeID') === CallFlowNode.Types.DynamicNode && this.get('DynamicAsTable')) {
            strNodeXtype = 'TableNode';
        } else {
            strNodeXtype = this.get('NodeTypeDesc');
        }

        return strNodeXtype;

    },

    getNextNode: function () {
        return this._nextNode;
    },
    setNextNode: function (value) {
        var id = 0;
        if (value) {
            id = value.getId();
        }
        this._nextNode = value;
        this.set('NextNodeId', id);
    },

    getPrevNode: function () {
        return this._prevNode;
    },
    setPrevNode: function (value) {
        var id = 0;
        if (value) {
            id = value.getId();
        }
        this._prevNode = value;
        this.set('PrevNodeId', id);
    },

    getParentNode: function () {
        return this._parentNode;
    },
    setParentNode: function (value) {
        var id = 0;
        if (value) {
            id = value.getId();
        }
        this._parentNode = value;
        this.set('ParentNodeId', id);
    },

    getChildNodes: function () {
        return this._childNodes || [];
    },
    setChildNodes: function (value) {
        var nodes, i;

        this._childNodes = value;

        nodes = Ext.clone(value);
        for (i = 0; i < nodes.length; i++) {
            nodes[i] = nodes[i].getId();
        }
        this.set('ChildNodeIds', nodes);

    },

    // find the first child with the given value
    getChildByValue: function (value) {
        var i;

        if (this._childNodes) {

            for (i = 0; i < this._childNodes.length; i++) {
                if (this._childNodes[i].get('Value') === value) {
                    return this._childNodes[i];
                }
            }

        }

        return null;

    }

});
