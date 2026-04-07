//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define("VIPSMobile.controller.Messages", {
    extend: "Ext.app.Controller",

    requires: ["VIPSMobile.SQLTables"],

    BACKGROUND_SYNC_FREQ: 5.25 * 60 * 1000,

    config: {

        models: ["Message", "SmartSearchItem", "DetailItem"],
        stores: ["Messages", "LocalMessages", "SmartSearchItems", "DetailItems"],
        views: [
            "messages.Compose",
            "messages.Detail",
            "messages.Menu",
            "messages.SortSheet"
        ],

        routes: {
            "Messages": "route",
            "Messages/:msgkey": {
                action: "route",
                conditions: {
                    ":msgkey": "[0-9]+"
                }
            },
            "Messages/compose": "composeMessage",
            "Messages/compose/:recip": {
                action: "composeMessage",
                conditions: {
                    ":recip": "[0-9]+"
                }
            },
            "Messages/reply/:replyId": {
                action: "replyToMessage",
                conditions: {
                    ":replyId": "[0-9]+"
                }
            },
            "Messages/forward/:replyId": {
                action: "forwardMessage",
                conditions: {
                    ":replyId": "[0-9]+"
                }
            }
        },

        refs: {
            compose: {
                selector: "#messagescompose"
            },
            detail: {
                selector: "#messagesdetail"
            },
            lstRecips: {
                selector: "container[name=lstRecips]"
            },
            menu: {
                selector: "#messagesMenu"
            },
            recips: {
                selector: "#recips"
            },
            smartSearch: {
                selector: "#smartSearch"
            },
            sortSheet: {
                selector: "#msgsortsheet"
            }
        },

        backgroundSync: null,
        currentMsgKey: null,
        profilePics: {},
        recipsPerLine: 3,
        returningFromMessageId: 0,
        hub: {}

    },

    setup: function () {

        // Populate the messages when sync done
        //VIPSMobile.Sync.addAfterSync(SQLTables.Tables.Messages, Ext.EmptyFn, this);

        this.doRefresh(false, false, function () {
            VIPSMobile.Main.setMask(this, false);
        });

        // listen for sync freq changes to update badge
        VIPSMobile.User.on("syncfrequencychanged", this.ShowSyncOffLabel, this);

        this.joinHub();

    },

    joinHub: function (callback) {

        // Connect to the SignalR Hub and configure the Proxy
        this.setHub($.connection.vipshub);
        var me = this;

        this.getHub().client.updateCommentsOnMemo = function (msg) {
            me.onUpdateCommentsOnMemoEvent(msg);
        }
        this.getHub().client.deleteCommentComplete = function (msg) {
            me.onDeleteCommentComplete(msg);
        }

        $.connection.hub.start()
            .done(function () {

                me.joinGroups();

                console.log('Now connected, connection ID=' + $.connection.hub.id);

                if (callback) {
                    callback.apply(me);
                }

            })
            .fail(function () {
                console.log('Could not Connect!, Failed to start the hub connection', arguments);
            });
    },

    populateMessagesStore: function (results) {

        // only update if called from setup or records changed
        if (results === undefined || results.records === undefined || results.records.length > 0) {

            var sql = "SELECT M.MessageKey, M.BoxKey_Owner, M.OwnerName, M.Format, M.Message, M.Status," +
                " M.BoxKey_Sender, M.SenderName, M.Subject, M.TimeSent, M.TimeDeleted, M.Attachment, M.CallerID," +
                " M.MessageLength, M.ReplyID, M.RowVer, M.MultiAttachment, M.MemoDataID, " +
                " IFNULL(MC.MaxCommentTimeCreated, M.TimeSent) as MaxCommentTimeCreated, MessageCommentCount, " +
                " X.ProfileURL AS SenderProfilePic, M.AllowComments FROM " + SQLTables.Tables.Messages +
                " M LEFT JOIN " + SQLTables.Tables.MyVIPSMailboxes + " X ON M.BoxKey_Sender=X.Mailbox " +
                " LEFT JOIN (SELECT MAX(TimeCreated) as MaxCommentTimeCreated, MemoDataID, COUNT(TimeCreated)+1 as MessageCommentCount " +
                " FROM MyVipsdboMemoComments GROUP BY MemoDataID) MC ON MC.MemoDataID = M.MemoDataID" +
                " UNION ALL SELECT S.MessageKey, S.boxkey_owner, S.OwnerName, S.Format, S.MemoData, S.Status," +
                " S.Boxkey_sender, S.SenderName, S.Description, S.TimeCreated as TimeSent, S.TimeDeleted, S.Attachment," +
                " S.CallerID, S.MessageLength, S.ReplyID, S.RowVer, S.MultiAttachment, S.MemoDataID, " +
                " IFNULL(MC.MaxCommentTimeCreated, S.TimeCreated) as MaxCommentTimeCreated, MessageCommentCount," +
                " X.ProfileURL, S.AllowComments FROM " + SQLTables.Tables.SentMessages +
                " S LEFT JOIN " + SQLTables.Tables.MyVIPSMailboxes + " X ON S.BoxKey_Sender = X.Mailbox " +
                " LEFT JOIN (SELECT MAX(TimeCreated) as MaxCommentTimeCreated, MemoDataID, COUNT(TimeCreated)+1 as MessageCommentCount" +
                " FROM MyVipsdboMemoComments GROUP BY MemoDataID) MC ON MC.MemoDataID = S.MemoDataID" +
                " WHERE " +
                VIPSMobile.User.getMailbox() + " NOT IN (SELECT BoxKey_Owner FROM " + SQLTables.Tables.SentMessageRecipients +
                " SR WHERE SR.MemoDataID = S.MemoDataID)";

            this.getMessagesStore().populateFromSQL(sql, function () {
                this.getMessagesStore().filter();
                this.getMessagesStore().sort();
                this.getLocalMessagesStore().loadPage(this.getLocalMessagesStore().currentPage);
                this.SetMessageBadgeText();

                this.joinGroups();

            }, this);
        }

    },

    joinGroups: function () {
        var me = this,
            fn = function () {
                me.getMessagesStore().queryBy(function (item) {
                    if (item.get("AllowComments")) {
                        console.debug("joined group: " + item.get("MessageKey"));
                        me.getHub().server.joinGroup(item.get("MessageKey"));
                    }
                }, me);
            }

        if ($.connection.hub && $.connection.hub.state === $.signalR.connectionState.connected) {
            fn();
        } else {
            this.joinHub(fn);
        }

    },

    getSentRecipient: function (row) {
        return "<li style=\"display:-webkit-box;\">" +
            "<div>" +
            this.statusClass(row) +
            "</div><div style=\"padding-left: 10px;padding-right: 10px;\">" +
            row.BoxKey_Owner +
            "</div><div style=\"-webkit-box-flex:2.0;\">" +
            row.OwnerName +
            "</div></li>";
    },

    statusClass: function (values) {
        var strStatus;

        if (Message.Statuses[values.Status]) {
            strStatus = Message.Statuses[values.Status];
        } else {
            strStatus = "Heard";
        }

        return strStatus;

    },

    // show menu if no msgKey passed in, otherwise show the given message
    route: function (msgKey) {

        // setup app if needed
        VIPSMobile.Main.SetupApplication(this, function () {

            // wait for the messages store to be loaded
            this.getMessagesStore().waitForLoad(function () {

                // if message key not passed in, go to last message key
                //if (!msgKey) msgKey = this.getCurrentMsgKey();

                // check if the message exists (possible to get link to message that doesn"t exist)
                if (msgKey && !this.getMessagesStore().getById(msgKey)) {
                    msgKey = 0;
                }

                // remember the message key
                this.setCurrentMsgKey(msgKey);

                if (!msgKey) {
                    this.showMenu();
                    this.getLocalMessagesStore().loadPage(this.getLocalMessagesStore().currentPage);
                } else {
                    this.showMessage(msgKey);
                }

            }, this);

        });

    },

    showMenu: function () {
        var view;

        // clear the messages pane if one hasn"t been set
        if (!this.getCurrentMsgKey()) {
            VIPSMobile.Main.clearView("Right");
        }

        // show the menu
        view = VIPSMobile.Main.showView(this, "VIPSMobile.view.messages.Menu");

        this.ShowSyncOffLabel(VIPSMobile.User, VIPSMobile.User.getSyncFrequency());

        // check if returning to index from a message
        if (this.getReturningFromMessageId()) {
            view.scrollToItem(this.getReturningFromMessageId());
            this.setReturningFromMessageId(0);
        }

    },

    showMessage: function (msgKey) {
        var view, store, index, item, menu;

        view = VIPSMobile.Main.showView(this, "VIPSMobile.view.messages.Detail");
        view.setup(msgKey, this);

        item = this.getMessagesStore().getById(msgKey);

        if (VIPSMobile.Main.useMultiPanels) {
            this.getSentRecipients(function (results) {               
                var btnMembers = VIPSMobile.Main.getTitlebarRight().down('#showSentRecipients');
                if (VIPSMobile.Main.getTitlebarRight() && VIPSMobile.Main.getTitlebarRight().setTitle && results.rows.length > 0) {
                    VIPSMobile.Main.getTitlebarRight().setTitle((item.get("Subject") || "No Subject"));

                    btnMembers.setHidden(false);
                    btnMembers.setText('(' + (results.rows.length + 1) + ')');

                } else {
                    btnMembers.setHidden(true);
                }
            });
        }

        index = this.getMessagesStore().indexOf(item);
        menu = this.getMenu();
        if (menu) {
            store = menu.getStore();
            if (store.getCount() > 0 && index + 1 > store.getCount() - 1) {
                store.loadPage(store.currentPage + 1);
            }
        }

    },

    scrollToBottomOfMessage: function () {
        var msg = this.getMessagesStore().getById(this.getCurrentMsgKey());
        if (msg.get("MessageCommentCount") > 3) {
            this.getDetail().down('#detailItems').getScrollable().getScroller().scrollTo(Infinity, Infinity);
        }
    },

    showLeftContent: function () {
        this.showMenu();
    },

    showRightContent: function (leftView) {

        if (this.getMessagesStore().getCount > 0) {

            leftView.selectRange(0, 0, false);
            this.route(this.getMessagesStore().getAt(0).get("MessageKey"));
        }
    },

    composeMessage: function (recip) {


        VIPSMobile.Main.SetupApplication(this, function () {
            var me = this;

            if (this.getCompose()) {
                this.getCompose().destroy();
            }

            var MessageTypeActionSheet = Ext.create('Ext.Sheet', {
                modal: true,
                centered: true,
                width: '50%',
                height: '30%',
                defaults: {
                    xtype: 'button'
                },
                items: [{
                    text: 'Memo',
                    handler: function (btn) {
                        locCallback(btn.getText().toLowerCase());
                    }
                }]
            })

            var locCallback = function (messageType) {
                var view = me.showComposeView(messageType);
                view.CDREvent = VIPSMobile.CDR.Types.SendMessage;

                MessageTypeActionSheet.hide();

                // add recipient(s) if passed in
                if (recip) {

                    // get the name for the mailbox
                    DataFunc.executeSQL({
                        sql: "SELECT FirstName || ' ' || LastName FROM VPSdbdboMailbox WHERE BoxKey=?",
                        params: [recip],
                        scope: me,
                        success: function (tx, results) {
                            me.addComposeRecipient(DataFunc.GetScalarValue(results), recip);
                        }
                    });

                }
                view.show();
            }

            if (navigator.mediaDevices.getUserMedia) {
                MessageTypeActionSheet.add({
                    text: 'Voice',
                    handler: function (btn) {
                        locCallback(btn.getText().toLowerCase());
                    }
                });
            }
            if (VIPSMobile.User.getAllowChat()) {
                MessageTypeActionSheet.add({
                    text: 'Chat',
                    handler: function (btn) {
                        locCallback(btn.getText().toLowerCase());
                    }
                })
            }

            Ext.Viewport.add(MessageTypeActionSheet);
            MessageTypeActionSheet.show();

        });

    },

    forwardMessage: function (replyId) {
        this.replyToMessage(replyId, true);
    },

    replyToMessage: function (replyId, isFoward) {
        var view, msgReplyTo, strMessageSubject, strMessageText, strFrom, strSent;

        VIPSMobile.Main.SetupApplication(this, function () {

            view = this.showComposeView('memo');
            view.CDREvent = VIPSMobile.CDR.Types.Reply;

            msgReplyTo = this.getMessagesStore().getById(replyId);

            if (msgReplyTo) {

                strMessageSubject = (!isFoward) ? "Re: " : "Fw: ";
                strMessageSubject += msgReplyTo.get("Subject").replace(/re:/gi, '').replace(/fw:/gi, '');

                strFrom = 'From: ' + msgReplyTo.get("SenderName");
                strSent = 'Sent: ' + Ext.Date.parseDate(msgReplyTo.get("TimeSent"), DataFunc.DATE_FORMAT).toLocaleString();

                strMessageText = '\n\n\n\n' + strFrom + '\n';
                strMessageText += strSent + '\n';
                strMessageText += msgReplyTo.get("Message").replace(/<br\/>/gi, '\n');

                strMessageText = strMessageText.replace(/&amp;/gi, "&");
                strMessageText = strMessageText.replace(/&quot;/gi, "'");

                if (strMessageText.indexOf("</") !== -1) {
                    var div = document.createElement('div');
                    div.innerHTML = strMessageText;
                    strMessageText = div.innerText;
                }

                view.setValues({
                    recips: "",
                    replyId: msgReplyTo.get("MessageKey"),
                    subject: strMessageSubject,
                    body: strMessageText
                });

                if (!isFoward) {
                    this.addComposeRecipient(msgReplyTo.get("SenderName"), msgReplyTo.get("BoxKey_Sender"));
                }

            }

        });

    },

    showComposeView: function (messageType) {
        var view;

        // create the view
        view = Ext.create("VIPSMobile.view.messages.Compose");

        // resize the text area when container changes size
        view.on("resize", this.resizeTextArea, this);

        // check if user is allowed to send attachments
        if (VIPSMobile.User.getAllowMemoAttachments()) {

            this.addAttachment(view, "#attachments", "FileInput");
            this.addAttachment(view, "#images", "ImageInput");

        } else {

            // destroy the attachment controls
            view.down("#attachments").destroy();

        }

        this.getCompose().down('#memo').setHidden(true);
        this.getCompose().down('#voice').setHidden(true);

        if (messageType === "chat") {
            this.getCompose().setAllowComments(true);
            messageType = "memo";
        } else {
            this.getCompose().setAllowComments(false);
        }

        this.messageType = messageType;

        this.currentView = this.getCompose().down('#' + messageType);
        this.currentView.setHidden(false);

        if (this.currentView.init) {
            this.currentView.init();
        }

        this.resizeTextArea();

        // show the view
        VIPSMobile.Main.showView(this, view);

        return view;

    },

    addAttachment: function (view, vContainer, vXtype) {
        var cntAttachments, cntAttachment,
            container = vContainer,
            xtype = vXtype;

        cntAttachments = view.down(container);

        cntAttachment = cntAttachments.add({
            xtype: xtype,
            name: xtype + cntAttachments.items.length,
            minHeight: "2em"
        });

        // show a mask while loading the image (progress would be nice but doesn"t seem possible without reader)
        cntAttachment.on({
            beginload: {
                fn: function () {
                    VIPSMobile.Main.setMask(this, "Loading...");
                },
                scope: this
            },
            load: {
                fn: function () {
                    VIPSMobile.Main.setMask(this, false);

                    // add another attachment
                    this.addAttachment(view, container, xtype);

                    this.resizeTextArea();
                },
                scope: this
            }
        });
    },

    ShowSyncOffLabel: function (user, freq) {
        this.getApplication().fireEvent("setBadgeText", "#msgrefresh", (freq < 0) ? "off" : false);
    },

    onRefreshTap: function () {

        this.doRefresh(true, true, function () {
            VIPSMobile.Main.setMask(this, false);
        });

    },

    doRefresh: function (vForceSync, vForceMessagesSync, vCallback) {
        var me;

        // if there is a Callback probably means there is something else to do, so is not a background sync
        if (vCallback) {
            // VIPSMobile.Main.setMask(this, "Refreshing...");
        }

        me = this;

        VIPSMobile.Sync.doMany({
            tableNames: [
                VIPSMobile.SQLTables.Tables.Messages,
                VIPSMobile.SQLTables.Tables.SentMessages,
                VIPSMobile.SQLTables.Tables.SentMessageRecipients,
                VIPSMobile.SQLTables.Tables.MemoComments,
                VIPSMobile.SQLTables.Tables.Mailbox,
                VIPSMobile.SQLTables.Tables.MailGroupHead,
                VIPSMobile.SQLTables.Tables.MailGroup,
                VIPSMobile.SQLTables.Tables.MyVIPSMailboxes
            ],
            forceSync: vForceMessagesSync,
            scope: this,
            callback: function () {

                this.populateMessagesStore(function () {

                    this.SetMessageBadgeText();

                    if (vCallback) {
                        vCallback.apply(this);
                    }

                }, this);
            }
        });

        // create and start background sync task
        if (!this.getBackgroundSync()) {
            this.setBackgroundSync(setInterval(function () {
                me.doRefresh(false, true);
            }, this.BACKGROUND_SYNC_FREQ));
        }

    },

    onSortTap: function () {
        var sheet, container;

        sheet = this.getSortSheet();

        // create the sort sheet if needed
        if (!sheet) {

            sheet = Ext.create("VIPSMobile.view.messages.SortSheet");
            VIPSMobile.Main.applyHandlerToAllItems(this, sheet);

            container = Ext.Viewport.down("#content");
            container.add(sheet);

        }

        // Set the value for the sort sheet
        sheet.setValue(VIPSMobile.User.getMessageSort());

        // show the sort sheet
        sheet.show();

    },

    onSetSortChange: function () {
        var value, blnPickFirst, msg, view;

        value = this.getSortSheet().getValue();

        // if multipanel and switching owner setting, pick first message
        blnPickFirst = (VIPSMobile.Main.useMultiPanels() && (VIPSMobile.User.getMessageSort() && VIPSMobile.User.getMessageSort().owner !== value.owner));

        // remember the sort method
        VIPSMobile.User.setMessageSort(value);
        VIPSMobile.User.save();

        // filter and sort the store
        this.getMessagesStore().filter();
        this.getMessagesStore().sort();


        this.getLocalMessagesStore().currentPage = 1;
        this.getLocalMessagesStore().loadPage(this.getLocalMessagesStore().currentPage);

        // pick the first message if needed
        if (blnPickFirst) {

            msg = this.getMessagesStore().getAt(0);
            if (msg) {
                this.getMenu().select(msg);

                view = VIPSMobile.Main.showView(this, "VIPSMobile.view.messages.Detail");
                view.setup(msg.get("MessageKey"), this);
            }
        }

    },

    onListItemSwipe: function (list, index, target, record, event, options) {
        var me, base, butDelete, removeDeleteButton, deleteContainer;

        me = this;

        try {

            // swipe event fires for up and down now
            if (event.direction === "left" || event.direction === "right") {

                base = target.element.down(".msg-time");

                // create new p element to hold the button
                deleteContainer = base.dom.cloneNode();
                deleteContainer.id = "DeleteBtn";
                base.getParent().dom.appendChild(deleteContainer);

                //Hide target p element
                base.dom.setAttribute("style", "display: none");

                // create the delete button
                butDelete = Ext.create("Ext.Button", {
                    ui: "decline",
                    cls: "msg-delete",
                    iconCls: "delete_black1",
                    iconMask: true,
                    style: "margin-top:-2em;",
                    renderTo: deleteContainer,
                    handler: function (btn, event) {
                        me.deleteMessage(list.getStore().getAt(index));
                        event.stopEvent();
                    }
                });

                // function to remove the delete button
                removeDeleteButton = function () {
                    Ext.Anim.run(butDelete, "fade", {
                        after: function () {
                            base.dom.removeAttribute("style");
                            var parentEl = butDelete.element.getParent();
                            parentEl.destroy();
                        },
                        out: true
                    });
                };

                // remove the delete button when something else touched
                list.on({
                    single: true,
                    buffer: 250,
                    itemtouchstart: removeDeleteButton
                });
                list.element.on({
                    single: true,
                    buffer: 250,
                    touchstart: removeDeleteButton
                });

            }

            // keep item tap event from firing
            event.stopEvent();

        } catch (ex) {
            console.error("Messages.onListItemSwipe() Error", ex.message);
        }

    },

    onMessagesMenuItemTap: function (list, index) {
        var store, item;

        // when called from prev/next buttons on detail, list isn"t set
        if (list) {
            store = list.getStore();
        } else {
            store = this.getMessagesStore();
        }

        // get the message item
        item = store.getAt(index);

        // check if it"s a received message
        if ([1, 2, 4].indexOf(item.get("Status")) !== -1) {

            // update the message status
            this.setMessageStatus(item, Message.Statuses.Heard);

            // add cdr record
            VIPSMobile.CDR.add(VIPSMobile.CDR.Types.ListenToMessage, item.get("MessageId"));

        }

        this.redirectTo("Messages/" + item.get("MessageKey"));

    },

    setMessageStatus: function (vMessage, vStatus) {
        var objStatus;

        // check if the status has changed
        if (vMessage.get("Status") !== vStatus) {

            // add the queue item
            objStatus = {
                messageKey: vMessage.get("MessageKey"),
                format: vMessage.get("Format"),
                newStatus: vStatus
            };
            if (objStatus.format !== Message.Formats.Sent) {

                VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.MsgStatus, objStatus);

                // update the local messages store
                vMessage.set("Status", vStatus);

                // update the db
                DataFunc.executeSQL({
                    sql: "UPDATE " + SQLTables.Tables.Messages + " SET Status=? WHERE MessageKey=?",
                    params: [vStatus, vMessage.getId()],
                    scope: this,
                    success: function () {
                        this.SetMessageBadgeText();
                        if (vStatus === Message.Statuses.Deleted) {
                            this.onBackTap();
                        }
                    }
                });


            }
        }

    },

    onBackTap: function () {
        this.setReturningFromMessageId(this.getCurrentMsgKey());
        this.setCurrentMsgKey(0);
        this.redirectTo("Messages");
    },

    onComposeBackTap: function () {
        this.redirectTo("Messages");
    },

    onPrevTap: function () {
        var index;

        // get the index of the current message
        index = this.getCurrentMessageIndex();

        // check if not on first message
        if (index > 0) {
            this.onMessagesMenuItemTap(null, index - 1);
        }

    },

    onNextTap: function () {
        var index;

        // get the index of the current message
        index = this.getCurrentMessageIndex();

        // check if not on last message
        if (index < this.getMessagesStore().getCount() - 1) {
            this.onMessagesMenuItemTap(null, index + 1);
            var store = this.getMenu().getStore();
            if (index + 1 > store.getCount() - 1) {
                store.loadPage(store.currentPage + 1);
            }
        }
    },

    getCurrentMessageIndex: function () {
        var message, index;

        // check if have detail view and it is showing a message
        if (this.getDetail() && this.getDetail().Message) {

            // get the current message
            message = this.getDetail().Message;

            // get the index of the current message
            index = this.getMessagesStore().find(message.getIdProperty(), message.getId());

        } else {

            index = -1;

        }

        return index;

    },

    onComposeTap: function (btn) {
        var strRedirect, target;

        // set the redirect path
        if (btn.getItemId() !== "NewCompose" && this.getCurrentMsgKey()) {
            target = btn._iconCls;
            strRedirect = target + "/" + this.getCurrentMsgKey();
        } else {
            strRedirect = "compose";
        }

        // redirect to given page
        this.redirectTo("Messages/" + strRedirect);

    },
    onRecipsAction: function () {
        var value, item;

        this.searchForRecips(function (tx, results) {

            if (results.rows.length > 0) {

                item = results.rows.item(0);

                // check if the recipient is already added
                if (!this.recipInList(item.Mailbox)) {
                    // add the mailbox to the list
                    value = {
                        mailbox: item.Mailbox,
                        name: item.FirstName + " " + item.LastName
                    };

                    this.addComposeRecipient(value.name, value.mailbox);

                }

            }

        });

    },

    onRecipsKeyUp: function () {
        var value;

        // only check on at least two characters or four digits
        value = this.getRecips().getValue();
        if (value.length > 3 || (!Ext.isNumeric(value) && value.length > 1)) {

            // create delayed task if needed
            if (!this.getRecips().delayedTask) {
                this.getRecips().delayedTask = Ext.create("Ext.util.DelayedTask", function () {
                    this.searchForRecips(function (tx, results) {

                        if (results.rows.length > 0) {

                            this.setSmartSearch(results);

                            if (this.getSmartSearch().getStore().getCount() && this.getSmartSearch().getHidden()) {
                                this.getSmartSearch().showBy(this.getRecips());
                            }

                        } else {

                            this.getSmartSearch().hide();

                        }

                    });
                }, this);
            }

            this.getRecips().delayedTask.delay(250);

        } else {

            this.getSmartSearch().hide();

        }

    },

    searchForRecips: function (callback) {
        var strSQL;

        // build the query
        if (this.getRecips().getValue().length > 0) {

            strSQL = "SELECT Boxkey as Mailbox, FirstName as FirstName, LastName as LastName FROM VPSdbdboMailbox "
                + "WHERE BoxKey Like ?1 ";
            if (VIPSMobile.User.getAllowAlphaSearch()) {
                strSQL += "OR FirstName LIKE ?1 OR LastName LIKE ?1 ";
            }
            strSQL += "UNION SELECT ListNo as Mailbox, ListNo as FirstName, ListDesc as LastName "
                + "FROM VPSdbdboMailGroupHead WHERE ListNo Like ?1 OR ListDesc Like ?1";
            if (VIPSMobile.User.getCannotSendToSysList()) {
                strSQL += "AND VPSdbdboMailGroupHead.ListNo < 31";
            }

            DataFunc.executeSQL({
                sql: strSQL,
                params: ["%" + this.getRecips().getValue() + "%"],
                scope: this,
                success: callback
            });

        }

    },

    setSmartSearch: function (results) {
        var store, i, item;

        store = this.getSmartSearch().getStore();

        store.removeAll();

        for (i = 0; i < results.rows.length; i += 1) {

            item = results.rows.item(i);

            // check if the recipient is already added
            if (!this.recipInList(item.Mailbox)) {

                // add the mailbox to the list
                store.add({
                    mailbox: item.Mailbox,
                    name: item.FirstName + " " + item.LastName
                });

            }

        }

    },

    onSubjectFocus: function () {
        this.getSmartSearch().hide();
    },
    onBodyFocus: function () {
        this.getSmartSearch().hide();
    },

    onSmartSearchItemTap: function (list, index) {
        var item;

        item = list.getStore().getAt(index);

        this.addComposeRecipient(item.data.name, item.data.mailbox);
    },

    addComposeRecipient: function (name, mailbox) {
        var lstRecips, btnRecip, count, container, index, width;

        // add the recipient
        if (!this.recipInList(mailbox)) {

            lstRecips = this.getLstRecips();
            lstRecips.setHidden(false);

            count = lstRecips.query("button").length;

            index = parseInt(count / this.getRecipsPerLine(), 10);
            container = lstRecips.getItems().items[index];

            if (!container) {
                container = lstRecips.add({
                    xtype: "container",
                    flex: 1
                });
            }
            width = (1 / this.getRecipsPerLine() * 100);

            btnRecip = container.add({
                handler: this.onRemoveRecipient,
                text: name,
                value: mailbox,
                width: width.toFixed(1).toString() + "%"
            });
            btnRecip.mailbox = mailbox;

            this.resizeTextArea();

        }

        this.getCompose().setValues({
            recips: ""
        });

        this.getSmartSearch().hide();
    },

    recipInList: function (mailbox) {
        return !!this.getLstRecips().down("button[value=" + mailbox + "]");
    },

    onRemoveRecipient: function (btn) {
        btn.getParent().remove(btn);
    },

    onSendTap: function () {
        var msg, cdrEvent, objAttachment, objAttachments, i, attMsg, files = [];

        // get the message info
        msg = this.getCompose().getValues();
        msg.sender = VIPSMobile.User.getMailbox();
        msg.replyId = msg.replyId % 100000000;
        msg.attachments = [];
        msg.allowComments = this.getCompose().getAllowComments();

        if (msg.subject === "") {
            Ext.Msg.alert(VIPSMobile.getString("Send Message"), VIPSMobile.getString("You must enter a Subject"));
        } else {
            if (this.currentView && this.currentView.getValue) {
                attMsg = this.currentView.getValue();
                if (attMsg) {
                    msg.attachments.push(attMsg);
                }
            } else {
                // clean the message body
                msg.body = Ext.String.htmlEncode(msg.body);
                msg.body = msg.body.replace(/\n/gi, "<br/>");
            }

            // add the attachment
            objAttachments = this.getCompose().down("#attachments");
            if (objAttachments) {
                files = files.concat(objAttachments.innerItems);
            }

            objAttachments = this.getCompose().down("#images");
            if (objAttachments) {
                files = files.concat(objAttachments.innerItems);
            }

            if (files) {
                for (i = 0; i < files.length; i += 1) {
                    objAttachment = files[i];
                    if (objAttachment && objAttachment.getValue()) {
                        msg.attachments.push(objAttachment.getValue());
                    }
                }
            }

            // get the CDR event
            cdrEvent = this.getCompose().CDREvent;

            // validate the values
            this.validRecipients(msg, function () {

                // add the message to the queue
                VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.NewMessage, msg);

                // add a CDR record for each recipient
                for (i = 0; i < msg.recips.length; i += 1) {
                    VIPSMobile.CDR.add(cdrEvent, null, msg.recips[i], null, null, null, 3);
                }

                // go back to the menu
                this.onBackTap();


            });
        }
    },

    onSendCommentTap: function () {
        //console.log(arguments);
        var msg = {}, detail, values, msgBody;

        detail = this.getDetail();

        msg.sender = VIPSMobile.User.getMailbox();
        msg.calcKey = detail.Message.get('MessageKey');
        msg.commentType = detail.down('#commentType').getValue();
        msg.attachments = [];

        if (msg.commentType !== "memo" && this.currentView) {
            attMsg = this.currentView.getValue();
            if (attMsg) {
                msg.attachments.push(attMsg);
            }
            if (this.currentView.clearImage) {
                this.currentView.clearImage();
            }
            if (this.currentView.clearFile) {
                this.currentView.clearFile();
            }
            if (this.currentView.clearVoice) {
                this.currentView = Ext.create('VIPSMobile.ux.VoiceInput');
            }

        } else {
            // clean the message body
            msgBody = detail.down('#Memo').getValue();
            msg.newComment = Ext.String.htmlEncode(msgBody);
            msg.newComment = msgBody.replace(/\n/gi, "<br/>");

            if (msg.newComment === "") {
                msg = false;
                Ext.Msg.alert("Error", "Please enter some text to send a comment");
            } else {
                //clear the values on the comment fields
                detail.down('#Memo').setValue('');
                detail.down('#commentType').setValue('memo');
            }

        }

        // add the comment to the queue
        // VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.NewComment, msg);

        // Send the Comment using SignalR, so the comment gets pushed to anybody that has opened the message
        if (msg) {
            var me = this;
            fn = function () {
                me.getHub().server.sendNewComment(VIPSMobile.User.getMailbox(), msg)
                    .done(function () {
                        //console.log(msg);
                    })
                    .fail(function () {
                        //console.log(arguments);
                    });
            }

            if ($.connection.hub && $.connection.hub.state === $.signalR.connectionState.disconnected) {
                this.joinHub(fn)
            } else {
                fn();
            }

        }

    },
    onDeleteCommentComplete: function (msg) {

        this.onUpdateCommentsOnMemoEvent(msg);

    },

    onUpdateCommentsOnMemoEvent: function (msg) {
        //console.log(msg);

        var strInsert, strSelect, strParams, intField, params = [], msgParentCalcKey, msgMemoDataID;

        strInsert = "INSERT OR REPLACE INTO MyVipsdboMemoComments (";
        strParams = "";
        intField = 0;

        // loop through each field to build the statements
        for (var key in msg) {
            if (msg.hasOwnProperty(key)) {

                if (intField > 0) {
                    strInsert += ",";
                    strParams += ",";
                }

                strInsert += key;
                strParams += "?";

                params.push(msg[key]);

                intField++;
            }
        }
        strInsert += ") VALUES (" + strParams + ")";

        msgMemoDataID = msg.MemoDataID;

        DataFunc.executeSQL({
            sql: strInsert,
            params: params,
            scope: this,
            success: function () {

                strSelect = "SELECT MessageKey FROM " + SQLTables.Tables.Messages + " WHERE MemoDataID = ?";
                strSelect += " UNION SELECT MessageKey FROM " + SQLTables.Tables.SentMessages + " WHERE MemoDataID = ?";
                params = [msgMemoDataID, msgMemoDataID];

                DataFunc.executeSQL({
                    sql: strSelect,
                    params: params,
                    scope: this,
                    success: function (tx, results) {
                        var row;

                        msgParentCalcKey = DataFunc.GetScalarValue(results);

                        if (msgParentCalcKey === parseInt(this.getCurrentMsgKey(), 10)) {
                            this.showMessage(msgParentCalcKey);
                        } else {
                            VIPSMobile.Main.PlayAudioAlert(true);
                            var statements = [];

                            statements.push({
                                sql: "UPDATE " + SQLTables.Tables.Messages + " SET Status = 1 WHERE MessageKey = ?",
                                params: [msgParentCalcKey]
                            });
                            statements.push({
                                sql: "UPDATE " + SQLTables.Tables.SentMessages + " SET Status = 1 WHERE MessageKey = ?",
                                params: [msgParentCalcKey]
                            });

                            DataFunc.executeMany({
                                statements: statements,
                                scope: this,
                                callback: function (tx, results) {
                                    this.populateMessagesStore(true);
                                    item = this.getMessagesStore().getById(msgParentCalcKey);
                                    item.set("Status", 1);
                                }
                            });
                        }


                    }
                });
            }
        });

    },
    validRecipients: function (msg, vCallback) {
        var i, strSQL, lstSQL, blnValid;

        // get the Recipeints from text field
        if (msg.recips.trim().length > 0) {
            msg.recips = msg.recips.split(";");
            for (i = 0; i < msg.recips.length; i += 1) {
                msg.recips[i] = parseInt(msg.recips[i], 10);
            }
        } else {
            msg.recips = [];
        }

        // add Recipeints from selected list
        msg.recips = msg.recips.concat(Ext.pluck(this.getLstRecips().query("button"), "mailbox"));

        if (msg.recips.length > 0) {

            // set all SQL to check all Recipeints
            lstSQL = [];
            for (i = 0; i < msg.recips.length; i += 1) {

                // check if recip is for a mailbox or list
                strSQL = "SELECT BoxKey FROM VPSdbdboMailbox WHERE BoxKey=?1 UNION " +
                    "SELECT ListNo FROM VPSdbdboMailGroupHead WHERE ListNo=?1";
                if (VIPSMobile.User.getCannotSendToSysList()) {
                    strSQL += "AND ListNo < 31";
                }

                lstSQL.push({
                    sql: strSQL,
                    params: [msg.recips[i]]
                });

            }

            DataFunc.executeMany({
                statements: lstSQL,
                scope: this,
                callback: function (statements) {

                    // to be valid, all queries must have returned records
                    blnValid = true;
                    for (i = 0; i < statements.length; i += 1) {
                        if (statements[0].results.rows.length === 0) {
                            blnValid = false;
                        }
                    }

                    if (blnValid) {
                        vCallback.apply(this);
                    } else {
                        Ext.Msg.alert(VIPSMobile.getString("Send Message"), VIPSMobile.getString("Recipient seems to be invalid."));
                    }

                }
            });

        } else {
            Ext.Msg.alert(VIPSMobile.getString("Send Message"), VIPSMobile.getString("No Recipeints set."));
        }

    },

    onChgReplyTypeTap: function () {
        var detail = this.getDetail(),
            sheet = detail.down('#chgCommentTypeSheet'),
            button = detail.down('#chgCommentType');

        sheet.setHidden(false);

    },
    onChgReplyTypeSheetTap: function (btn, event) {
        var detail = this.getDetail(),
            sheet = detail.down('#chgCommentTypeSheet'),
            button = detail.down('#chgCommentType'),
            editContainer = detail.down('#editContainer'),
            newType = btn.getCls()[0];

        sheet.setHidden(true);
        button.setIconCls(newType + '-png');
        detail.down('#commentType').setValue(newType.toLowerCase());

        Ext.iterate(editContainer.items.keys, function (key) {
            editContainer.down('#' + key).setHidden(true);
        });

        editContainer.down('#' + newType).setHidden(false);
        this.currentView = editContainer.down('#' + newType);
        if (this.currentView.init) {
            this.currentView.init();
        }

    },
    onDeleteTap: function () {
        this.updateMessage(this.getCurrentMsgKey(), Message.Statuses.Deleted, VIPSMobile.CDR.Types.EraseMessage);
    },

    onSaveTap: function () {
        this.updateMessage(this.getCurrentMsgKey(), Message.Statuses.Saved, VIPSMobile.CDR.Types.SaveMessage);
    },

    updateMessage: function (msg, vStatus, vCDR) {
        // if just passed in message key, get the message
        if (!Ext.isObject(msg)) {
            msg = this.getMessagesStore().getById(msg);
        }

        var task = Ext.create("Ext.util.DelayedTask", function () {
            var fileName;

            // update the message status
            this.setMessageStatus(msg, vStatus);

            // get the filename for the cdr record
            switch (msg.get("Format")) {
                case Message.Formats.Memo:
                    fileName = null;
                    break;
                case Message.Formats.Video:
                    fileName = msg.get("Message");
                    break;
                case Message.Formats.Voice:
                    fileName = msg.get("Message");
                    break;
                default:
                    fileName = null;
            }

            // add a cdr record
            VIPSMobile.CDR.add(vCDR, msg.get("MessageKey"), fileName, null, null, null, msg.get("Format"));

        }, this);

        task.delay(500);

        if (this.getCurrentMsgKey() === msg.get("MessageKey").toString() && vStatus === VIPSMobile.CDR.Types.EraseMessage) {
            this.onBackTap();
        }

    },

    resizeTextArea: function () {
        var cmpBody, intHeight, intLineHeight;

        try {

            // get the message body text area
            cmpBody = this.getCompose().down("textareafield[name=\"body\"]");

            // calculate the desired height for the text area
            intHeight = this.getCompose().element.getHeight() - cmpBody.element.getY();

            // find the line height
            intLineHeight = DataFunc.measureString("M", cmpBody).height;

            // need to set max rows to adjust height
            cmpBody.setMaxRows(intHeight / intLineHeight);

            this.getSmartSearch().setHeight(this.getCompose().element.getHeight() - this.getSmartSearch().element.getY() - 100);

        } catch (ex) {
            console.error("Messages.resizeTextArea() Error", ex.message);
        }

    },

    SetMessageBadgeText: function () {
        var sql = "SELECT COUNT(*) FROM " + SQLTables.Tables.Messages + " WHERE BoxKey_Owner=? AND Status=?";

        // query db since store may be filtered
        DataFunc.executeSQL({
            sql: sql,
            params: [VIPSMobile.User.getMailbox(), Message.Statuses.Unheard],
            scope: this,
            success: function (tx, results) {
                VIPSMobile.app.fireEvent("setBadgeText", "Messages", DataFunc.GetScalarValue(results));
            },
            failure: function () {
                // probably haven"t sync"d so table doesn"t exist
                VIPSMobile.app.fireEvent("setBadgeText", "Messages", 0);
            }
        });

    },

    getHelpCategories: function (view) {
        var categories, viewClass;

        categories = [];

        // add the view name
        viewClass = Ext.getClassName(view);
        viewClass = viewClass.substring(viewClass.indexOf("view") + 5);
        categories.push(viewClass);

        // add the default controller category
        categories.push("Messages");

        return categories;

    },

    onRecordTap: function () {
        this.currentView.toggleRecording();
    },

    onRecordPlayTap: function () {
        this.currentView.togglePlaying();
    },
    onImageTap: function (btn) {
        var link = Ext.getDom("hidden_link"),
            clickevent = new MouseEvent("click");

        link.href = btn.config.href;
        link.target = "_blank";
        
        clickevent.initEvent("click", true, false);
        link.dispatchEvent(clickevent);        
    },
    onAttachmentTap: function (btn) {
        var link = Ext.getDom("hidden_link"),
            clickevent = new MouseEvent("click");

        link.href = btn.config.href;
        link.target = "_blank";

        if (!(parseInt(iOSversion().join(''), 10) >= 1300)) {
            link.download = btn.config.download;
        }

        clickevent.initEvent("click", true, false);
        link.dispatchEvent(clickevent);
    },

    getSentRecipients: function (callback) {
        var detail = this.getDetail(),
            memoDataID = detail.Message.get("MemoDataID"),
            localCallback = callback;

        DataFunc.executeSQL({
            sql: "SELECT * FROM " + SQLTables.Tables.SentMessageRecipients + " SR WHERE SR.MemoDataID = ? ORDER BY OwnerName",
            params: [memoDataID],
            scope: this,
            success: function (tx, results) {

                if (localCallback) {
                    localCallback.apply(this, [results]);
                }
            }
        });
    },

    onShowSentRecipientsTap: function () {
        //console.log(arguments);

        this.getSentRecipients(function (results) {
            var table = '<table style="width: 100%;max-width: 100%;margin-bottom: 1rem;">',
                tableCellStart = '<td style="padding: .3rem;border-top: 1px solid #dee2e6;">';


            for (i = 0; i < results.rows.length; i++) {
                var dr = results.rows.item(i);

                table += '<tr>';
                if (dr.boxkey_sender === VIPSMobile.User.getMailbox()) {
                    table += tableCellStart + Message.Statuses[dr.Status] + '</td>';
                }
                table += tableCellStart + dr.OwnerName + '</td></tr>';
            }
            table += '<tr>' + tableCellStart + 'Sender</td>' + tableCellStart + results.rows.item(0).SenderName + '</td></tr>';
            table += '</table>';

            if (!this.SentRecipientsOverLay) {
                this.SentRecipientsOverLay = Ext.Viewport.add({
                    xtype: 'panel',
                    modal: true,
                    hideOnMaskTap: true,
                    scrollable: 'vertical',
                    centered: true,
                    width: Ext.filterPlatform('ie10') ? '100%' : Ext.os.deviceType === 'Phone' ? 260 : 400,
                    height: Ext.filterPlatform('ie10') ? '30%' : Ext.os.deviceType === 'Phone' ? 220 : 400,
                    html: table,
                    items: [{
                        docked: 'top',
                        xtype: 'toolbar',
                        title: 'Members'
                    }]
                });

            } else {
                this.SentRecipientsOverLay.setHtml(table);
            }

            this.SentRecipientsOverLay.show();

        });
    }

});
