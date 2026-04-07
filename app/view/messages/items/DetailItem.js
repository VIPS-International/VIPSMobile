//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.messages.items.DetailItem', {
    extend: 'Ext.dataview.component.DataItem',
    alias: 'widget.detailitem',

    config: {
        style: "border: 1px solid #eee; border-radius: .4em",
        styleHtmlContent: true,
        msgStyle: ''
    },

    constructor: function () {

        this.callParent(arguments);

        var record = this.getRecord()
            , values = record.data
            , store = record.stores[0]
            , dateFormat
            , index
            , prevRecord
            , blnSenderChange;

        index = store.indexOf(record);
        prevRecord = store.getAt(index - 1);
        blnSenderChange = !prevRecord || (prevRecord && prevRecord.data.boxkey_sender !== values.boxkey_sender);

        this.setStyle({
            "background-color": VIPSMobile.User.getMailbox() === values.boxkey_sender ? '#0d85fe' : '#e5e5ea',
            "width": "90%",
            "float": VIPSMobile.User.getMailbox() === values.boxkey_sender ? 'right' : 'left',
            "margin-top": blnSenderChange ? '1.5em' : 'auto'
        });


        this.setMsgStyle('color:' + (VIPSMobile.User.getMailbox() === values.boxkey_sender ? '#ffffff' : '#000000'));

        if (blnSenderChange) {
            
            this.add({
                html: '<div class="reset" style="width: 100%; display: flex">' +
                '<div style="flex: 8">' +
                '<span class="' + VIPSMobile.util.ProfilePics.getClass(values.boxkey_sender) + '" style="width: 2.5em;height: 2.5em;display: inline-block"></span>&nbsp;' +
                '<span style="font-size: 125%;vertical-align:top;' + this.getMsgStyle() + '">' + values.SenderName + '</span>' +
                '</div>' +
                '</div>'
            });
        }
        
        if(typeof values.DetailItemData === "string"){
            var tmpDetail = values.DetailItemData.toLowerCase();

            if (tmpDetail.indexOf(".jpg") >= 0 || tmpDetail.indexOf(".png") >= 0 || tmpDetail.indexOf(".jpeg") >= 0){
                values.DetailItemType = VIPSMobile.model.DetailItem.Types.Image;
            }
        }
        switch (values.DetailItemType) {
            case VIPSMobile.model.DetailItem.Types.Voice:
                this.SetVoice(values);
                break;
            case VIPSMobile.model.DetailItem.Types.Video:
                this.SetVideo(values);
                break;
            case VIPSMobile.model.DetailItem.Types.Memo:
                this.SetMemo(values);
                break;
            case VIPSMobile.model.DetailItem.Types.File:
                this.SetFile(values);
                break;
            case VIPSMobile.model.DetailItem.Types.Image:
                this.SetImage(values);
                break;
            case VIPSMobile.model.DetailItem.Types.Sent:
                this.SetSent(values);
                break;
            case VIPSMobile.model.DetailItem.Types.Deleted:
                this.SetMemo(values);
                break;
            default:
                this.SetMemo(values);
        }

        this.add({
            html: '<div style="font-size: xx-small;float: right;' + this.getMsgStyle() + '">' + this.getMsgDate(values) + '</div>',
            style: this.getMsgStyle()
        });

    },

    getMsgDate: function (values) {
        var msgDate = Ext.Date.parseDate(values.TimeCreated, DataFunc.DATE_FORMAT),
            dateDiff = DataFunc.datediff('dd', msgDate, new Date());

        if (msgDate.isToday()) {
            dateFormat = "\\T\\o\\d\\a\\y " + Ext.Date.patterns.ShortTime;
        } else if (dateDiff < 7) {
            dateFormat = Ext.Date.patterns.InLast7Days;
        } else if (dateDiff < 365) {
            dateFormat = Ext.Date.patterns.ThisYear;
        } else {
            dateFormat = Ext.Date.patterns.ShortDateAndTime;
        }
        return Ext.Date.format(msgDate, dateFormat);
    },

    SetSent: function (values) {
        var isVoiceMessage = new RegExp(/[mw]_\d{4}_\d{6}_\d{6}_.{2}$/gm),
            isVideoMessage = new RegExp(/v_\d{4}_\d{6}_\d{6}_.{2}$/gm);

        if (values.DetailItemData.match(isVoiceMessage)) {
            this.SetVoice(values);
        } else {
            this.SetMemo(values);
        }
    },

    SetVoice: function (values) {
        //this.setHtml('Voice');
        var strHref, strType, ctl;

        // the comments store the JSON info in the same place as the memo text
        // and the attachment data is a string that needs to be JSON parsed
        if (typeof (values.DetailItemData) === "string" && values.DetailItemData.indexOf("{") === -1) {
            var strMsg = values.DetailItemData;
            values.DetailItemData = {
                path: "audio/" + strMsg.replace('.mp3', '') + '.mp3',
                type: "audio/mp3"
            };

        } else if (typeof (values.DetailItemData) === "string" && values.DetailItemData.indexOf("{") > 0) {
            values.DetailItemData = JSON.parse(values.DetailItemData)[0];
            values.DetailItemData.path = "msgsUploads/" + values.DetailItemData.path.substr(values.DetailItemData.path.lastIndexOf("\\") + 1);
        }

        strHref = values.DetailItemData.path;
        strType = values.DetailItemData.type;

        ctl = Ext.create('VIPSMobile.ux.AudioPlayer', {
            href: strHref,
            type: strType
        });

        this.add(ctl);
        ctl._setupControls();
    },
    SetVideo: function (values) {
        var strHref, strType, ctl;

        // comments store the JSON info in the same place as the memo text
        // and the attachment data is a string that needs to be JSON parsed
        if (typeof values.DetailItemData === "string" && values.DetailItemData.indexOf("{") === -1) {
            var strMsg = values.DetailItemData;
            strMsg = strMsg.substring(0, strMsg.lastIndexOf("."));

            values.DetailItemData = {
                path: "video/" + strMsg + ".m4v",
                type: "video/mp4"
            };

        } else if (typeof (values.DetailItemData) === "string" && values.DetailItemData.indexOf("{") > 0) {
            values.DetailItemData = JSON.parse(values.DetailItemData)[0];
            values.DetailItemData.path = "msgsUploads/" + values.DetailItemData.path.substr(values.DetailItemData.path.lastIndexOf("\\") + 1);
        }

        strHref = values.DetailItemData.path;
        strType = values.DetailItemData.type;

        ctl = Ext.create('VIPSMobile.ux.VideoPlayer', {
            width: '90%',
            height: 'auto',
            href: strHref,
            type: strType
        });

        this.add(ctl);
        ctl._setupControls();

    },

    SetMemo: function (values) {
        var strMsgData = values.DetailItemData;

        if (strMsgData.indexOf("</") === -1) {
            strMsgData = this.getReplacedLinks(strMsgData);
            strMsgData = strMsgData.replace(/\n/gi, '<br/>');
        }
        
        strMsgData = strMsgData.replace(/&lt;br\/&gt;/gi, '<br/>');
        strMsgData = strMsgData.replace(/&amp;lt;br\/&amp;gt;/gi, '<br/>');
        strMsgData = strMsgData.replace(/&amp;/gi, "&");
        strMsgData = strMsgData.replace(/&amp;quot;/gi, "'");
        
        this.add({
            html: '<div style="font-size: 1.4em;">' + strMsgData + '</div>',
            style: this.getMsgStyle()
        });

    },

    SetFile: function (values) {
        if (typeof values.DetailItemData === "string") {
            values.DetailItemData = JSON.parse(values.DetailItemData)[0];
            values.DetailItemData.path = "msgsUploads/" + values.DetailItemData.path.substr(values.DetailItemData.path.lastIndexOf("\\") + 1);
        }
        if(values.DetailItemData.type ==  "audio/mp3") {
            this.SetVoice(values);
        } else if(values.DetailItemData.type ==  "video/mp4") {
            this.SetVideo(values);
        } else {
            this.add({
                xtype: "button",
                text: values.DetailItemData.name,
                href: values.DetailItemData.path,
                download: values.DetailItemData.name,
                width: this.element.getWidth() - 10,
                func: 'Attachment',
                labelCls: "allowWrap", // this overrides the detfault label class so no style get applied
                cls: 'margin5'
            });
        }
    },

    SetImage: function (values) {

        if (typeof values.DetailItemData === "string") {
            values.DetailItemData = JSON.parse(values.DetailItemData)[0];
            values.DetailItemData.path = "msgsUploads/" + values.DetailItemData.path.substr(values.DetailItemData.path.lastIndexOf("\\") + 1);
        }
                
        this.add({
            xtype: "button",
            text: '<div style="width: 100%;text-align: center"><img style="max-width: 80%" src="' + values.DetailItemData.path + '" /></div>',
            href: values.DetailItemData.path,
            download: values.DetailItemData.name,
            width: this.element.getWidth() - 10,
            func: 'Image',
            labelCls: "allowWrap", // this overrides the detfault label class so no style get applied
            cls: 'margin5'
        });
    },

    getReplacedLinks: function (strMsgData) {       

        return linkifyStr(strMsgData, {});

    }
});
