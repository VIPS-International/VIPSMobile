//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.store.Messages', {
    extend: 'Ext.data.Store',

    config: {

        model: 'VIPSMobile.model.Message',

        sorters: [{
            property: 'TimeSent',
            direction: 'DESC'
        }],

        filters: [{
            filterFn: function (item) {
                var messageSort = VIPSMobile.User.getMessageSort(),
                    statuses;

                //console.log(statuses,item.get('Status'));

                if (messageSort && !Ext.isArray(messageSort.owner)) {
                    statuses = [messageSort.owner];
                } else {
                    statuses = [
                        Message.Statuses.Unheard,
                        Message.Statuses.Skipped,
                        Message.Statuses.Heard,
                        Message.Statuses.Saved,
                        Message.Statuses.Sent
                    ];
                }

                return statuses.indexOf(item.get('Status')) !== -1;

            }

        }],

        grouper: {
            sorterFn: function (record1, record2) {
                var messageSort = VIPSMobile.User.getMessageSort(),
                    result, blnDesc, field, recordField;

                if (messageSort && messageSort.field) {
                    field = messageSort.field;
                } else {
                    field = 1;
                }

                // compare the values based on the sort property
                switch (field) {
                    case Message.SortFields.Format:
                        recordField = 'Format';
                        blnDesc = true;
                        break;
                    case Message.SortFields.SenderName:
                        recordField = 'SenderName';
                        blnDesc = false;
                        break;
                    default:
                        recordField = 'MaxCommentTimeCreated';
                        blnDesc = true;
                        break;
                }

                result = record1.get(recordField) > record2.get(recordField) ? 1 : record1.get(recordField) === record2.get(recordField) ? 0 : -1;
                
                // invert result if sorting direction is descending
                if (blnDesc) {
                    result *= -1;
                }

                // return the result
                return result;


            },
            groupFn: function (record) {
                var messageSort = VIPSMobile.User.getMessageSort(), field;

                if (messageSort && messageSort.field) {
                    field = messageSort.field;
                } else {
                    field = 1;
                }
                switch (field) {
                    case Message.SortFields.Format: return Message.Formats[record.get('Format')];
                    case Message.SortFields.SenderName: return record.get('SenderName') || 'Unknown';
                    default: return Ext.Date.format(Ext.Date.parseDate(record.get('MaxCommentTimeCreated'), DataFunc.DATE_FORMAT), 'l, j F Y');
                }

            }
        }

    }

});
