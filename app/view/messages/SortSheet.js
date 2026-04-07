//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.messages.SortSheet', {
    extend: 'Ext.picker.Picker',

    requires: ['VIPSMobile.model.Message'],

    config: {
        itemId: 'msgsortsheet',
        func: 'SetSort',
        hidden: true,
        slots: [{
            name: 'field',
            title: VIPSMobile.getString('Field'),
            data: [
                { text: VIPSMobile.getString('Date'), value: 1 }, //VIPSMobile.model.Message.SortFields.TimeSent },
                { text: VIPSMobile.getString('Name'), value: 2 }, //VIPSMobile.model.Message.SortFields.SenderName },
                { text: VIPSMobile.getString('Type'), value: 3} //VIPSMobile.model.Message.SortFields.Format }
            ]
        }, {
            name: 'owner',
            title: VIPSMobile.getString('Sender'),
            data: [
                {
                    text: VIPSMobile.getString('Received'),
                    value: [
                        1, //Message.Statuses.Unheard,
                        2, //Message.Statuses.Skipped,
                        4, //Message.Statuses.Heard,
                        8 //Message.Statuses.Saved
                    ]
                },
                { text: VIPSMobile.getString('Only Favourite'), value: 8}, //Message.Statuses.Saved },
                { text: VIPSMobile.getString('Deleted'), value: 64} //Message.Statuses.Deleted }
            ]
        }]
    }

});
