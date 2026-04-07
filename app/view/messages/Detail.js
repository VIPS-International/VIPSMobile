//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define("VIPSMobile.view.messages.Detail", {
    extend: "Ext.form.Panel",
    requires: [
        "VIPSMobile.ux.AudioPlayer",
        "VIPSMobile.ux.VideoPlayer",
        "VIPSMobile.view.messages.DetailItems"
    ],

    tbConfig: {
        title: 'detail',
        items: [{
            text: VIPSMobile.getString("Back"),
            func: "Back",
            ui: "back action",
            addFn: function (controller) {
                return !VIPSMobile.Main.useMultiPanels();
            }
        }, {
            itemId: 'showSentRecipients',
            align: 'right',
            iconCls: 'team',
            iconMask: true,
            func: 'ShowSentRecipients',
            hidden: false
        }, {
            itemId: "reply",
            iconCls: "reply",
            iconMask: true,
            align: "right",
            func: "Compose",
            controller: "Messages"
        }, {
            itemId: "forward",
            iconCls: "forward",
            iconMask: true,
            align: "right",
            func: "Compose",
            controller: "Messages"
        }, {
            itemId: "save",
            iconCls: "heart",
            iconMask: true,
            align: "right",
            func: "Save",
            controller: "Messages"
        }, {
            itemId: "delete",
            iconCls: "trash",
            iconMask: true,
            align: "right",
            ui: "decline",
            func: "Delete",
            controller: "Messages"
        }]
    },

    fsButton: {
        iconCls: "left2",
        func: "Back"
    },

    config: {
        itemId: "messagesdetail",
        layout: "vbox",
        padding: "1em",
        panel: "right",
        cls: 'rightpanel',
        scrollable: null,
        items: [{
            xtype: 'detailitems',
            itemId: 'detailItems',
            flex: 1
        }, {
            docked: 'bottom',
            xtype: 'toolbar',
            itemId: 'composeBar',
            layout: 'hbox',
            hidden: true,
            items: [{
                xtype: "button",
                itemId: "chgCommentType",
                iconCls: "Memo-png",
                iconMask: true,
                text: '',
                ui: "warn",
                func: "ChgReplyType",
                controller: "Messages",
                flex: 1,
                hidden: !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            }, {
                xtype: 'hiddenfield',
                name: 'commentType',
                itemId: 'commentType',
                value: 'memo'
            }, {
                xtype: 'container',
                itemId: 'editContainer',
                layout: 'hbox',
                flex: 8,
                defaults: {
                    flex: 1,
                    listeners: {
                        focus: function (field) {
                            field.parent.setHeight("8.2em");
                            field.setHeight("7em");
                        },
                        blur: function (field) {
                            field.parent.setHeight("2em");
                            field.setHeight("1.6em");
                        }
                    }
                },
                items: [{
                    xtype: 'textareafield',
                    itemId: "Memo",
                    placeHolder: 'Send to all message recipients',
                    maxrows: 4
                }, {
                    xtype: "VoiceInput",
                    itemId: "Voice",
                    hidden: true,
                    name: "voice"
                }, {
                    xtype: "VideoInput",
                    itemId: "Video",
                    hidden: true,
                    name: "video"
                }, {
                    xtype: "FileInput",
                    itemId: "Attachment",
                    hidden: true,
                    name: "attachment"
                }, {
                    xtype: "ImageInput",
                    itemId: "Photo",
                    hidden: true,
                    name: "photo"
                }]
            }, {
                xtype: "button",
                itemId: "sendComment",
                iconCls: "Sent-png",
                iconMask: true,
                text: 'Send',
                ui: "success",
                func: "sendComment",
                controller: "Messages",
                flex: 1
            }]
        }, {
            xtype: 'actionsheet',
            itemId: 'chgCommentTypeSheet',
            hidden: true,
            defaults: {
                func: "ChgReplyTypeSheet"
            },
            items: [{
                iconCls: "Memo-png",
                iconMask: true,
                text: 'Chat',
                cls: 'Memo'
            }, {
                iconCls: "Voice-png",
                iconMask: true,
                text: 'Voice',
                cls: 'Voice',
                hidden: !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            }, {
                iconCls: "Video-png",
                iconMask: true,
                text: 'Video',
                cls: 'Video',

                hidden: true
                //hidden: !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            }, {
                iconCls: "attachment",
                iconMask: true,
                text: 'Attachment',
                cls: 'Attachment'

            }, {
                iconCls: "photo",
                iconMask: true,
                text: 'Photo',
                cls: 'Photo'
            }]
        }],
        controller: null
    },

    setup: function (vMessage, controller) {
        var strInfo, firstMessage, strName, detailItemsStore, detailItemType, mcMessage, detailItemsView;

        this.setController(controller);

        this.Message = Ext.getStore("Messages").getById(vMessage);

        this.down('#commentType').setValue('memo');

        detailItemsView = this.down('#detailItems');

        detailItemsStore = detailItemsView.getStore();
        detailItemsStore.removeAll();

        if (this.Message.get("AllowComments") > 0 && VIPSMobile.User.getAllowChat()) {
            this.down('#composeBar').setHidden(false);
        }

        if (this.Message.get("Message") !== "") {
            detailItemType = this.Message.get("Format");

            if (this.Message.get("BoxKey_Sender") === VIPSMobile.User.getMailbox()) {
                detailItemType = VIPSMobile.model.DetailItem.Types.Sent;
            }

            // show message
            mcMessage = Ext.create('DetailItem', {
                DetailItemID: this.Message.get("MessageKey"),
                MemoDataID: this.Message.get("MemoDataID"),
                TimeCreated: this.Message.get("TimeSent"),
                ParentCalcKey: this.Message.get("MessageKey"),
                DetailItemData: this.Message.get("Message"),
                DetailItemType: detailItemType,
                SenderName: this.Message.get("SenderName"),
                boxkey_sender: this.Message.get("BoxKey_Sender")
            });

            detailItemsStore.add(mcMessage);
        }

        detailItemsView.on('resize', function () {
            this.getController().scrollToBottomOfMessage();
        }, this);

        detailItemsView.on('painted', function () {
            this.getController().scrollToBottomOfMessage();
        }, this);

        this.AddAttachments(detailItemsStore, function () {
            this.AddMemoComments(detailItemsStore, function () { });
        });


    },

    AddMemoComments: function (detailItemsStore, callback) {
        var sql = "SELECT * FROM " + SQLTables.Tables.MemoComments + " WHERE MemoDataID = ?";

        DataFunc.executeSQL({
            sql: sql,
            params: [this.Message.get("MemoDataID")],
            scope: this,
            success: function (tx, results) {
                var row;

                if (results.rows.length > 0) {

                    for (i = 0; i < results.rows.length; i += 1) {

                        row = results.rows.item(i);

                        detailItemsStore.add(Ext.create('DetailItem', {
                            DetailItemID: row.MemoCommentID,
                            TimeCreated: row.TimeCreated,
                            ParentCalcKey: row.ParentCalcKey,
                            DetailItemData: row.MemoComment,
                            DetailItemType: DetailItem.Types[row.MemoCommentType],
                            SenderName: row.SenderName,
                            boxkey_sender: row.boxkey_sender
                        }));
                    }


                }

                if (callback) {
                    callback.apply(this);
                }

            }
        });


    },

    AddAttachments: function (detailItemsStore, callback) {
        var msgPanel, ids, i;
        // add attachment buttons
        if (this.Message.get("Attachment") && this.Message.get("MultiAttachment") !== "[]") {

            if (this.Message.get("MultiAttachment")) {
                ids = JSON.parse(this.Message.get("MultiAttachment"));
                ids.map(function (id) {
                    id.path = "msgsUploads/" + id.path.substr(id.path.lastIndexOf("\\") + 1);
                });
            } else {
                ids = [{
                    name: "Download Attachment",
                    path: "services/Files/" + VIPSMobile.User.getMailbox() + "/" + Message.Formats.Memo + "/" + this.Message.get("Attachment").split(",")
                }];
            }

            for (i = 0; i < ids.length; i++) {
                var record = Ext.create('DetailItem', {
                    DetailItemID: i.toString() + this.Message.get("MessageKey"),
                    TimeCreated: this.Message.get("TimeSent"),
                    ParentCalcKey: this.Message.get("MessageKey"),
                    DetailItemData: ids[i],
                    DetailItemType: VIPSMobile.model.DetailItem.Types.File,
                    SenderName: this.Message.get("SenderName"),
                    boxkey_sender: this.Message.get("BoxKey_Sender")
                });

                if (ids[i].name.lastIndexOf(".mp3") !== -1) {
                    record.set('DetailItemType', VIPSMobile.model.DetailItem.Types.Voice);
                }
                if (ids[i].type.lastIndexOf("image/") !== -1) {
                    record.set('DetailItemType', VIPSMobile.model.DetailItem.Types.Image);
                }

                detailItemsStore.add(record);

            }
        }

        if (callback) {
            callback.apply(this);
        }
    }

});
