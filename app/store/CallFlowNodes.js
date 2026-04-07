//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.store.CallFlowNodes', {
    extend: 'Ext.data.Store',

    config: {

        model: 'VIPSMobile.model.CallFlowNode',

        groupField: 'DCNo'

    }

});
