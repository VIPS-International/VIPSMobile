//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.Message', {
    extend: 'Ext.data.Model',
    alternateClassName: ['Message'],

    config: {

        idProperty: 'MessageKey',

        fields: [
            { name: 'Attachment', type: 'string' },
            { name: 'BoxKey_Owner', type: 'integer' },
            { name: 'BoxKey_Sender', type: 'integer' },
            { name: 'Format', type: 'integer' },
            { name: 'MessageKey', type: 'integer' },
            { name: 'Message', type: 'string' },
            { name: 'MemoDataID', type: 'integer' },
            { name: 'MultiAttachment', type: 'object' },
            { name: 'OwnerName', type: 'string' }, // not populated yet
            { name: 'SenderName', type: 'string' },
            { name: 'SenderProfilePic', type: 'string' },
            { name: 'Status', type: 'integer' },
            { name: 'Subject', type: 'string' },
            { name: 'TimeSent', type: 'integer' },
            { name: 'MessageCommentCount', type: 'integer' },
            { name: 'MaxCommentTimeCreated', type: 'integer' },
            { name: 'AllowComments', type: 'boolean' }
            
        ]

    },

    statics: {

        Formats: {
            Voice: 1, 1: 'Voice',
            Video: 2, 2: 'Video',
            Memo: 3, 3: 'Memo',
            SMS: 4, 4: 'SMS',
            Sent: 6, 6: 'Sent',
            Email: 5, 5: 'Email'
        },

        Statuses: {
            Unheard: 1, 1: 'Unheard',
            Skipped: 2, 2: 'Skipped',
            Heard: 4, 4: 'Heard',
            Saved: 8, 8: 'Saved',
            ReturnConfirm: 16, 16: 'ReturnConfirm',
            NotDelivered: 32, 32: 'NotDelivered',
            Deleted: 64, 64: 'Deleted',
            Sent: 128, 128: 'Sent'
        },

        SortFields: {
            TimeSent: 1, 1: 'TimeSent',
            SenderName: 2, 2: 'SenderName',
            Format: 3, 3: 'Format'
        }

    }

});
