//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.CDR', {
    singleton: true,

    requires: ['VIPSMobile.util.DataFunc'],

    Types: {
        Login: 301,
        GotoLocation: 303,
        ListenToMessage: 304,
        SendCopy: 305,  //forward
        EraseMessage: 306,
        Reply: 307,
        SaveMessage: 308,
        SendMessage: 309,
        //NotificationOnOff: 310,
        //PasswordChange: 311,
        //ListCreated: 312,
        //MemberAddedToList: 313,
        //MemberRemovedFromList: 314,
        //GroupListDeleted: 315,
        //PromptLevelChanged: 316,
        //DateTimePlaybackOnOff: 317,
        //GreetingChanged: 318,
        //RecordedNameChanged: 319,
        //NotificationSchedCreated: 320,
        //NotificationSchedDeleted: 321,
        //CallEnd: 322,
        InvalidPasswordEntered: 324,
        //SetupForwarding: 325,
        ApplicationsAccessed: 326,
        //SendSMS: 327,
        //SendSMSFailed: 328,
        //SendDigitalNetworkMessage: 329,
        //ReceivedDigitalNetworkMessage: 330,
        ActionBoxPostData: 331,
        LeaveMailbox: 332,
        //StopApplicationsBillingTimer: 337,
        //DistributionMailboxSend: 338,
        //NetworkMessageReceived: 340,
        //NewVoiceQuestion: 341,
        //NewVoiceQuestionAdded: 342,
        ClearInfo: 343,
        AvilableDatabaseSpace: 344
    },

    config: {
        callKey: 0,
        customerNo: 0,
        port: 0,
        sequence: 0,
        systemId: 0
    },

    constructor: function (config) {
        this.initConfig(config);
        this.setCallKey(DataFunc.getUTCdate());
    },

    add: function (event, messageKey, origin, param1, param2, param3, param4) {
        var objParams;

        // increment the sequence counter
        this.setSequence(this.getSequence() + 1);

        // set the params from passed in or last set values
        objParams = {
            callKey: this.getCallKey(),
            customerNo: this.getCustomerNo(),
            event: event || 0,
            messageKey: messageKey || 0,
            origin: origin || '',
            param1: param1 || 0,
            param2: param2 || 0,
            param3: param3 || 0,
            param4: param4 || 0,
            port: this.getPort(),
            sequence: this.getSequence(),
            systemId: this.getSystemId()
        };

        // send the event to the message queue
        VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.CDR, objParams);

    }

});
