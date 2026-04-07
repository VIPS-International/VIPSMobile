//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.controller.Groups', {
    extend: 'Ext.app.Controller',

    config: {

        // don't think CommDistMember model or store is needed anymore
        models: ['CommDistMember', 'MailGroup', 'MailGroupHead'],
        stores: ['CommDistMembers', 'MailGroup', 'MailGroupHead'],

        views: [
            'group.Detail',
            'group.MailGroup',
            'group.Menu'
        ],

        routes: {
            'Groups': 'route',
            'Groups/:listno': { action: 'route', conditions: { ':listno': '[0-9]+' } },
            'Groups/:listno/:memberno': { action: 'route', conditions: { ':listno': '[0-9]+', ':memberno': '[0-9]+' } }
        },

        refs: {
            detail: {
                selector: '#groupDetail'
            },
            mailGroup: {
                selector: '#mailgroup'
            },
            main: {
                selector: '#mainview'
            }
        },

        currentGroup: 0,
        currentMember: 0

    },

    setup: function () {

        // create the commdist cache table if needed
        DataFunc.executeSQL({
            sql: 'CREATE TABLE IF NOT EXISTS CommDistMembers (CommDistBox INTEGER, Mailbox INTEGER)'
        });

        // Populate the messages when sync done
        VIPSMobile.Sync.addAfterSync('VPSdbdboMailGroupHead', this.populateMailGroupHeadStore, this);
        this.populateMailGroupHeadStore();

        // refresh the groups
        this.onRefreshTap(false);

        // listen for sync freq changes to update badge
        VIPSMobile.User.on('syncfrequencychanged', this.ShowSyncOffLabel, this);

    },

    populateMailGroupHeadStore: function (results) {

        // only update if called from setup or records changed
        if (results === undefined || results.records === undefined || results.records.length > 0) {
            this.getMailGroupHeadStore().populateFromSQL('VPSdbdboMailGroupHead');
        }

    },

    route: function (groupNo, memberNo) {

        // setup app if needed
        VIPSMobile.Main.SetupApplication(this, function () {

            // wait for the stores to be loaded
            this.getMailGroupHeadStore().waitForLoad(function () {

                // check if the group exists (possible to get link to group that doesn't exist)
                if (groupNo && this.findGroup(groupNo) < 0) { groupNo = 0; }
                if (memberNo && this.findMember(groupNo, memberNo) < 0) { memberNo = 0; }

                if (!groupNo) {

                    // show the menu
                    VIPSMobile.Main.showView(this, 'VIPSMobile.view.group.Menu');
                    this.ShowSyncOffLabel(VIPSMobile.User, VIPSMobile.User.getSyncFrequency());

                } else {

                    if (!memberNo) {

                        // show the group
                        this.showGroup(groupNo);


                    } else {

                        // show the member
                        this.showGroupMember(groupNo, memberNo);

                    }

                }

                this.setCurrentGroup(groupNo);
                this.setCurrentMember(memberNo);

            }, this);

        });

    },

    findGroup: function (groupNo) {
        return this.getMailGroupHeadStore().findBy(function (record) {
            return (record.get('ListNo').toString() === groupNo);
        });
    },

    findMember: function (groupNo, memberNo) {
        return this.getMailGroupStore().find('ListMember', memberNo);
    },

    showGroupMember: function (groupNo, memberNo) {
        var member, view;

        // find the member
        member = this.getMailGroupStore().findRecord('ListMember', memberNo);

        // show the view
        view = VIPSMobile.Main.showView(this, 'VIPSMobile.view.group.Detail');
        view.setup(member);

    },

    ShowSyncOffLabel: function (user, freq) {
        this.getApplication().fireEvent('setBadgeText', '#groupsrefresh', (freq < 0) ? 'off' : false);
    },

    onBackTap: function () {
        this.setCurrentGroup(0);
        this.redirectTo('Groups');
    },

    onDetailBackTap: function () {
        this.setCurrentMember(0);
        this.redirectTo('Groups/' + this.getCurrentGroup());
    },

    onSendBackTap: function () {
        this.redirectTo('Groups/' + this.getCurrentGroup() + '/' + this.getCurrentMember());
    },

    onRefreshTap: function (vForceSync) {

        VIPSMobile.Main.setMask(this, 'Refreshing...');

        if (vForceSync === undefined) { vForceSync = true; }

        // Get Mailboxes
        VIPSMobile.Sync.doMany({
            tableNames: [
                'MyVIPSdboMailboxes',
                'VPSdbdboMailbox',
                'VPSdbdboMailGroupHead',
                'VPSdbdboMailGroup'
            ],
            forceSync: vForceSync,
            scope: this
        });

    },

    onGroupsMenuItemTap: function (list, index) {
        var item;

        item = list.getStore().getAt(index);
        this.redirectTo('Groups/' + item.get('ListNo'));

    },

    onMailgroupItemTap: function (list, index) {
        var item;

        item = list.getStore().getAt(index);

        this.redirectTo('Groups/' + this.getCurrentGroup() + '/' + item.get('ListMember'));
        return;

        //if (!this.getDetail()) {
        //    this.getContainer().add({ xtype: 'GroupDetail' });
        //}

        //title = this.getMailGroup().down('titlebar').getTitle();
        //title = Ext.util.Format.ellipsis(title, 16);
        //this.getDetail().down('titlebar').setTitle(title);

        //this.getDetail().setup(item.raw);
        //this.getContainer().setActiveItem(this.getDetail());

    },

    showGroup: function (groupNo) {
        var strSQL;

        // clear the store
        this.getMailGroupStore().removeAll();

        // get all the members for the list
        strSQL = 'SELECT ListMember, X.ApplicationType, M.FirstName AS FirstName, M.LastName AS LastName, M.SMSReplyEmail AS Email, ' +
            'M.MobileNumber AS Mobile FROM VPSdbdboMailGroup MG LEFT JOIN VPSdbdboMailbox X ON MG.ListMember=X.BoxKey LEFT JOIN MyVIPSdboMailboxes M ' +
            'ON MG.ListMember=M.Mailbox WHERE ListNo=' + groupNo; // + '';

        DataFunc.executeSQL({
            sql: strSQL,
            scope: this,
            success: function (tx, results) {

                // get all the results as an array
                results = DataFunc.GetResultsArray(results);

                // add all the members
                this.addMember(results, 0);

            }
        });

    },

    addMember: function (members, index) {

        // check if any more members to add
        if (index < members.length) {

            // check if the mailbox is a commdist box
            if (members[index].ApplicationType !== 'C') {

                this.getMailGroupStore().add(members[index]);
                this.addMember(members, index + 1);

            } else {
                this.expandCommDist(members, index);
            }

        } else {

            // hide any masks
            VIPSMobile.Main.setMask(this, false);

            // show the view
            VIPSMobile.Main.showView(this, 'VIPSMobile.view.group.MailGroup');
        }

    },

    expandCommDist: function (members, index) {
        var i, objResponse, strSQLs;

        // show mask
        VIPSMobile.Main.setMask(this, 'Expanding distribution box...');

        // call web service to check for any changes to comm dist
        Ext.Ajax.request({
            url: VIPSMobile.ServiceURL + 'Groups/GetCommDistMembers',
            headers: { 'Content-Type': 'application/json' },
            jsonData: {
                Mailbox: VIPSMobile.User.getMailbox(),
                CommDistBox: members[index].ListMember
            },
            scope: this,
            success: function (response, opts) {

                objResponse = response.responseObject;

                if (objResponse.success) {

                    strSQLs = [];

                    // delete any current members for the comm dist box
                    strSQLs.push({
                        sql: 'DELETE FROM CommDistMembers WHERE CommDistBox=?',
                        params: members[index].ListMember
                    });

                    // add all the returned members
                    for (i = 0; i < objResponse.members.length; i++) {
                        strSQLs.push({
                            sql: 'INSERT INTO CommDistMembers (CommDistBox, Mailbox) VALUES (?, ?)',
                            params: [members[index].ListMember, objResponse.members[i]]
                        });
                    }

                    DataFunc.executeMany({
                        statements: strSQLs,
                        scope: this,
                        callback: function () {
                            this.addCommDistMembers(members, index);
                        }
                    });

                } else {

                    console.log(objResponse.trace);
                    this.addCommDistMembers(members, index);

                }

            }, failure: function () {
                this.addCommDistMembers(members, index);
            }

        });

    },

    addCommDistMembers: function (members, index) {
        var strSQL, store, i;

        // get the mailbox details for the comm dist members
        strSQL = 'SELECT Mailbox AS ListMember, FirstName AS FirstName, LastName AS LastName, SMSReplyEmail AS Email, ' +
            'MobileNumber AS Mobile FROM MyVIPSdboMailboxes WHERE Mailbox IN (SELECT Mailbox FROM CommDistMembers WHERE CommDistBox=' +
            members[index].ListMember + ')';

        DataFunc.executeSQL({
            sql: strSQL,
            scope: this,
            success: function (tx, results) {

                store = this.getMailGroupStore();
                for (i = 0; i < results.rows.length; i++) {
                    store.add(results.rows.item(i));
                }

                this.addMember(members, index + 1);


            },
            failure: function (tx, ex) {

                console.error('Error getting commdist members for ' + members[index].ListMember, ex);
                this.addMember(members, index + 1);

            }

        });

    },

    onComposeTap: function () {
        var member;

        member = this.getDetail().getMember();

        this.redirectTo('Messages/compose/' + member.get('ListMember'));

    },

    onSendTap: function () {
        var ctlMessages, me = this;

        ctlMessages = this.getApplication().getController('Messages');

        ctlMessages.sendMessage(this.getCompose().getValues(), function () {
            me.onSendBackTap();
        });

    },

    onEmailTap: function () {
        window.location = 'mailto:' + this.getDetail().getMember().get('Email');
    },

    onCallTap: function () {
        window.location = 'tel:' + this.getDetail().getMember().get('Mobile');
    },

    getHelpCategories: function (view) {
        var categories, viewClass;

        categories = [];

        // add the view name
        viewClass = Ext.getClassName(view);
        viewClass = viewClass.substring(viewClass.indexOf('view') + 5);
        categories.push(viewClass);

        // add the default controller category
        categories.push('Groups');

        return categories;

    }

});
