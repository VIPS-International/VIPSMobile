//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.model.DetailItem', {
    extend: 'Ext.data.Model',
    alternateClassName: ['DetailItem'],

    config: {

        idProperty: 'DetailItemID',

        fields: [
            { name: 'DetailItemID', type: 'integer' },
            { name: 'MemoDataID', type: 'integer' },
            { name: 'TimeCreated', type: 'integer' },
            { name: 'ParentCalcKey', type: 'integer' },
            { name: 'DetailItemData' },
            { name: 'DetailItemType', type: 'integer' },
            { name: 'SenderName', type: 'string' },
            { name: 'boxkey_sender', type: 'integer' }
        ]
    },

    statics: {
        Types: {
            Voice: 1, 1: 'Voice',
            voice: 1, 1: 'voice',
            Video: 2, 2: 'Video',
            video: 2, 2: 'video',
            Memo: 3, 3: 'Memo',            
            memo: 3, 3: 'memo',
            Comment: 3, 3: 'Comment',
            comment: 3, 3: 'comment',
            File: 4, 4: 'File',            
            file: 4, 4: 'file',
            Attachment: 4, 4: "Attachment",
            attachment: 4, 4: "attachment",
            Image: 5, 5: 'Image',
            image: 5, 5: 'image',
            Photo: 5, 5: "Photo",
            photo: 5, 5: "photo",
            Sent: 6, 6: 'Sent',
            sent: 6, 6: 'sent',
            Deleted: 7, 7: 'Deleted',
            deleted: 7, 7: 'deleted',
            
        }
    }

});
