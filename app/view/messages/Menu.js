//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.messages.Menu', {
    extend: 'Ext.dataview.List',

    requires: [
        'VIPSMobile.util.ProfilePics',
        'VIPSMobile.ux.plugin.ListPagingLocal'
    ],

    tbConfig: {
        title: VIPSMobile.getString('Messages'),
        items: [{
            itemId: 'msgrefresh',
            iconCls: 'refresh',
            iconMask: true,
            html: ' Sync',
            func: 'Refresh'
        }, {
            iconCls: 'compose',
            iconMask: true,
            html: ' New',
            itemId: 'NewCompose',
            func: 'Compose'
        }, {
            iconCls: 'arrow_down',
            iconMask: true,
            html: ' Filter',
            align: 'right',
            func: 'Sort'
        }]
    },

    config: {
        itemId: 'messagesMenu',
        store: 'LocalMessages',
        grouped: true,
        loadingText: '',
        panel: 'left',
        scrollToTopOnRefresh: false,
        //selectedCls: '',
        emptyText: VIPSMobile.getString('No messages to display'),
        cls: 'clientbackground rightborder',

        plugins: [{
            xclass: 'plugin.listpaginglocal',
            autoPaging: false,
            nextPageCallback: function (pageSize, page, callback) {
                var store = Ext.getStore("Messages"),
                    storeRange, totalCount,
                    pageStart = pageSize * (page - 1),
                    pageEnd = (page * pageSize) - 1;

                storeRange = store.getRange(pageStart, pageEnd);
                totalCount = store.getCount();

                callback(storeRange, totalCount);

            },
            loadMoreText: 'Load More Messages...',
            noMoreRecordsText: 'End of Messages'
        }],

        itemTpl: new Ext.XTemplate(
            '<div style="display:-webkit-box;" class="{[this.statusClass(values)]}">',
            '   <div class="x-button reset" style="border: 0;">',
            '       <span class="{[VIPSMobile.util.ProfilePics.getClass(values.BoxKey_Sender)]}" />',
            '   </div>',
            '   <p class="msg-header">',
            '       {[this.name(values)]}<br />',
            '       <tpl if="Subject">{Subject}</tpl>',
            '   </p>',
            '   <tpl if="Status==8"><div class="x-button reset">',
            '       <span class="x-button-icon x-shown heart"></span>',
            '   </div></tpl>',
            '   <tpl if="Attachment"><div class="x-button reset">',
            '       <span class="x-button-icon x-shown attachment"></span>',
            '   </div></tpl>',
            '   <div class="x-button x-iconalign-top reset msg-info">',
            '       <span class="x-button-icon x-shown {[this.formatClass(values)]}"></span>',
            '       <span>{MessageCommentCount}</span>',
            '   </div>',
            '</div>',
            {
                statusClass: function (values) {
                    var strStatus;

                    strStatus = Message.Statuses[values.Status];
                    
                    return strStatus;

                },
                formatClass: function (values) {
                    var strFormat;

                    if (Message.Formats[values.Format]) {
                        strFormat = Message.Formats[values.Format];
                    } else {
                        strFormat = 'Memo';
                    }

                    return strFormat + '-png';

                },
                name: function (values) {
                    var name;

                    if (VIPSMobile.User.getMessageSort() && VIPSMobile.User.getMessageSort().owner === Message.Statuses.Sent) {
                        name = values.OwnerName;
                        if (!name) { name = values.BoxKey_Owner; }
                    } else {
                        name = values.SenderName;
                        if (!name) { name = values.BoxKey_Sender; }
                    }
                    if (name === 0) { name = 'Outside Caller'; }
                    return name;

                },
                timeString: function (values) {
                    var timeSent, strReturn;

                    timeSent = Ext.Date.parseDate(values.TimeSent, DataFunc.DATE_FORMAT);
                    if (timeSent) {
                        if (timeSent.isToday() || (VIPSMobile.User.getMessageSort() && VIPSMobile.User.getMessageSort().field === Message.SortFields.TimeSent)) {
                            strReturn = Ext.Date.format(timeSent, 'g:i A'); //time
                        } else {
                            strReturn = Ext.Date.format(timeSent, 'j/m/y'); //short date
                        }
                    } else {
                        strReturn = '12:00 AM';
                    }

                    return strReturn;

                }
            }
        ),

        controller: null

    }

});
