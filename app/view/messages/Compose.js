//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define("VIPSMobile.view.messages.Compose", {
    extend: "Ext.form.Panel",

    requires: [
        "VIPSMobile.ux.FileInput",
        "VIPSMobile.ux.ImageInput",
        "VIPSMobile.ux.VoiceInput",
        "VIPSMobile.ux.VideoInput"
    ],

    tbConfig: {
        title: VIPSMobile.getString("Compose"),
        items: [{
            text: VIPSMobile.getString("Back"),
            func: "ComposeBack",
            ui: "back action"
        }, {
            text: VIPSMobile.getString("Send"),
            iconCls: "Sent-png",
            iconMask: true,
            func: "Send",
            align: "right",
            ui: "action"
        }]
    },

    config: {
        itemId: "messagescompose",
        scrollable: "vertical",
        margin: ".5em",
        panel: "right",
        cls: 'rightpanel',
        allowComments: false,

        items: [{
            xtype: "fieldset",
            defaults: {
                labelWidth: "20%"
            },
            layout: "vbox",
            items: [
                {
                    xtype: "textfield",
                    itemId: "recips",
                    name: "recips",
                    autoComplete: false,                    
                    required: true,
                    label: VIPSMobile.getString("Recipients"),
                    placeHolder: VIPSMobile.getString("Add recipients")
                }, {
                    xtype: "container",
                    name: "lstRecips",
                    width: "100%",

                    defaults: {
                        layout: {
                            type: "hbox",
                            align: "start",
                            pack: "start"
                        },
                        defaults: {
                            xtype: "button",
                            ui: "decline-round small",
                            margin: ".1em"
                        }
                    },
                    style: "border-bottom: 1px solid #DDD;"
                }, {
                    xtype: "textfield",
                    itemId: "subject",
                    name: "subject",
                    required: true,
                    label: VIPSMobile.getString("Subject"),
                    placeHolder: VIPSMobile.getString("Enter subject")
                }, {
                    itemId: "attachments"
                }, {
                    itemId: "images"
                }, {
                    xtype: "hiddenfield",
                    name: "replyId"
                }, {
                    xtype: 'hiddenfield',
                    name: 'MessageType'
                }, {
                    xtype: "container",
                    itemId: "memo",
                    name: "memo",
                    items: [{
                        xtype: "textareafield",
                        itemId: "body",
                        name: "body",
                        labelWidth: "15em",
                        placeHolder: VIPSMobile.getString("Enter message"),
                        listeners: {
                            focus: function (cmp, event) {
                                var textArea = event.target;
                                textArea.setAttribute("scroll", "auto");
                            }
                        }
                    }]
                }, {
                    xtype: "VoiceInput",
                    itemId: "voice",
                    hidden: true,
                    name: "voice"
                }, {
                    xtype: "VideoInput",
                    itemId: "video",
                    hidden: true,
                    name: "video"
                }]

        }, {
            xtype: "list",
            itemId: "smartSearch",
            cls: "listdir",
            height: "10em",
            width: "15em",
            scrollable: "vertical",
            store: "SmartSearchItems",
            hidden: true,

            itemTpl: "{name}"
        }]

    }

});
