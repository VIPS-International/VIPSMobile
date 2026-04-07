//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.ChangeLog', {
    singleton: true,

    requires: ['VIPSMobile.Version'],

    get: function () {

        return [{
            ver: VIPSMobile.Version.get(),
            changes: [
                'Upgraded to Sencha Touch 2.4',
                'Created tablet profile for multi panel display',
                'Added MapNode call flow node type',
                'Added alpha version of LibraryItemNode call flow node type',
                'Added Auto Advance toggle to multi panel Index view',
                'Added initFn config option to toolbar items to allow them to be set up after added',
                'If ExcludeFromSave is set for the start node of a callflow, it will not save drafts'
            ]
        }, {
            ver: 'Be 131002.165027',
            changes: [
                'Added Barcode node',
                "Signature node doesn't have pop up, sign right on the detail form",
                'Signature no longer includes background colour',
                'Added in a lot of console.debug statements to Main controller',
                'Moved change log into seperate file to reduce svn conflicts',
                'Fixed bug of library not updating visit time affecting new tag',
                'Make starting database 4.9 mb to handle iOS 7 bug',
                'When minify, put line breaks back in and show line numbers for errors',
                'Checks for previous version local storage values on log in if user not found'
            ]
        }, {
            ver: 'Be 130910.152952',
            changes: [
                'Remembers the last debug statement and submits it with any errors',
                'Answered for call flow nodes is now a bitwise field instead of just a boolean describing where the value came from',
                'On version updates, clears all the last sync times for all the tables to make sure they update when code does',
                'Was removing messages from the queue as long as it was sent to server, not only if successfully processed'
            ]
        }, {
            ver: 'Be 130829.103551',
            changes: [
                'Updated to Sencha Touch 2.1.1',
                'Remembers view and restores when reload app.  Times out after 60 minutes by default (set against user).',
                'Added Calendar tab',
                'Added in application help',
                'Updated VIPSMobileServices to VS2012/MVC and split into two DLLs to allow calling of same code from VIPSAssistant',
                'Files are requested through file handler rather than being served directly through IIS (allows files to be served directly from SQL)',
                'Only ever one view created at a time to reduce DOM size',
                'Uses a seperate database for beta and testing to keep data from cross contaminating when changing between versions',
                'Store encoded password on phone, not clear text after successful login',
                'Messages will remember grouping method between logins',
                'Can view sent messages',
                'Added Change Log view (this)',
                'Return a string of tabs to show and their order rather than Allow toggles and hard coded order',
                'Returns theme to use when logging in',
                'executeMany update to use executeSQL and take same type of arguments structure',
                'Added full screen button',
                'No longer use Sencha control to listen to events but auto add listeners when show views',
                "Checks version in background.  Shows alert when new version found asking user to relog",
                'Smart search list hidden when recipients text loses focus',
                'Can set default values for when someone logs in for first time based on community',
                'Added support for SyncNode which forces a sync of values from StorageTable when built',
                'Can change overall font size for app',
                'Check Online settings button shows latency in ms',
                'Rearranged settings form to get more common options closer to top',
                'Shows site if not on live in top right corner.',
                'Updated service code to insert errors into Event Log to be notified of more errors',
                'Moved the VIPSMobile.data enumerations into respective classes and reference them that way',
                'Added signature node',
                'Log IP addresses in mobile ids login',
                'Converted message queue type to be an enumeration instead of a string for db efficiency when querying',
                'Preliminary work on multiple panel view by altering profiles and adding options to titlebar buttons to set which profiles they are visible in',
                'Titlebar buttons have an addFn which if it is set, needs to return true to have the button added to the titlebar',
                'For desktop, checks the aspect ratio of the window to determine if should emulate the phone or tablet profile',
                'Changed media playback buttons in messages to be more norm of Play/Pause and Stop',
                "When change a value in a call flow, only rebuilds from the first node that uses the value rather than from the node that sets the value.",
                'Themes and drafts are now stored in SQL storage instead of localStorage',
                'Data menu items can have a thumbnail set against them',
                'Keeps track of all requests by mailbox to log total data sent.  Stored in MailboxRequestAmounts table.',
                'Localization code added to support multiple languages or possibly different labels based on customer.',
                'Added HaveLocation, CurLat, CurLong, VersionElement and VersionNumber variables to ReplaceValueTags() based on if have current location',
                'Previous and Next butons on message detail',
                'Added version element to all local storage key names and the database name'
            ],
            issues: [
                "Will have to tweak the colours for the various skins.  Colours based off of the default color which likely won't always work.",
                "Clearing image for ImageNodes isn't great.  Set value, go out, come in, clear not shown.",
                'New flag for library isnt done.  Items not being set, folders need to be tested',
                'Thumbnail for library items not being used'
            ]
        }, {
            ver: 'Li 130107.103207',
            changes: [
                'Added slide to delete messages'
            ]
        }, {
            ver: 'Li 130102.174259',
            changes: [
                "Check to make sure all the tables exist when entering a call flow and don't allow them in if not all found",
                'Changed CallDate to being set to mailbox local time',
                'Cleaned up GetSaveTables() in Data controller so easier to debug',
                'Only add extraSQL and identity to table info if actually set',
                'Fixed bug of quantity being an array when multiple UoM had the same price',
                'Save button can have CalculatedValueSQL set which gets set when the button is pressed',
                "Deleting globals for orders still wasn't working so when click PlaceOrder, finds last node on same level as the start node to act as Save Button"
            ]
        }, {
            ver: 'Li 121219.163352',
            changes: [
                'Fixed deleting globals for orders in data tab'
            ]
        }, {
            ver: 'Li 121211. 91639',
            changes: [
                'Implemented SkipSaveIFNull option from call flow nodes',
                'Checks QueueMessageLogOverrides table when reprocessing a entry',
                'SubmitDate is UTC in QueueMessageLog'
            ]
        }, {
            ver: 'Li 121211. 91639',
            changes: [
                'Implemented SkipSaveIFNull option from call flow nodes',
                'Checks QueueMessageLogOverrides table when reprocessing a entry',
                'SubmitDate is UTC in QueueMessageLog'
            ]
        }, {
            ver: 'Li 121108.143026',
            changes: [
                'Created CartNode for loading previous/future orders',
                'Changes to display "list not found" text for useallitemsasoptions option for dynamic nodes',
                'Mesages compose tab, changed message label body to message'
            ]
        }, {
            ver: 'Li 121030.151026',
            changes: [
                'Swap heights and widths away from pixels to ems'
            ]
        }, {
            ver: 'Li 121029.111335',
            changes: [
                'Checks to make sure all CDR params are integers.  Had problem where someone entered *275 as password so was trying to put it in Param1 for CDR event'
            ]
        }, {
            ver: 'Li 121025.152050',
            changes: [
                'Clear the draft when save is pressed',
                'Video thumbnails in the Library now display',
                'Empty lists (dynamic/selection) now show an "empty list" text.',
                'Added cart to call flows',
                'Changed all toolbars to titlebars so title is properly centred'
            ]
        }, {
            ver: 'Li 120917.111149',
            changes: [
                "If draft appears to be invalid, refresh the list, then reapply the draft up to three times.  If still invalid, send draft to VIPS and tell user it's invalid."
            ]
        }, {
            ver: 'Li 120912.112204',
            changes: [
                "Removed VerboseErrors option since wasn't being used anyway",
                'Send us a copy of the draft when less than two nodes are displayed or any descriptions are null'
            ]
        }, {
            ver: 'Li 120906.115244',
            changes: [
                'Use two data detail views and toggle between them'
            ]
        }, {
            ver: 'Li 120830.100924',
            changes: [
                "Don't set the LastSyncTime for sql tables until all the statements have been run incase it crashes in the middle of a run",
                'Animate Prev/Next transitions on data details form'
            ]
        }, {
            ver: 'Li 120823.104252',
            changes: [
                'Use SyncLock while processing messages to keep from processing the same message twice',
                'Added services version to settings page'
            ]
        }, {
            ver: 'Li 120817. 84843',
            changes: [
                'Fixed message sorting',
                'When picking a recipient from smart search, checks to see if the mailbox is already in the recipients before adding'
            ]
        }, {
            ver: 'Li 120816.144341',
            changes: [
                'In call flow, make sure the node is part of the current call flow',
                'Question description is now 0.8em in size to allow more of the max of 200 characters to fit',
                'Can scroll the entire panel for integer and float node types'
            ]
        }, {
            ver: 'Li 12.0816. 91143',
            changes: [
                "All toolbar buttons have 'action' UI set by default for consistency",
                'Compose view redone improving space usage',
                'Update report call flows to show saved reports in button on toolbar and call flow node generates the report without detail view',
                'Fixed clicking label not setting checked value for OOS questions',
                'Fixed replying to messages'
            ]
        }, {
            ver: 'Li 12.0808.164223',
            changes: [
                'Commands can now be sent to phone which are checked for every five minutes if online',
                'Check if location info is disabled before using current location',
                'Larger font used on tablet devices',
                'Added Support for the AllowGroups Flag in DB, was using Number of Groups allowed and CanNotSendToSystemList',
                'Layout upgrade for List and Multi Select Nodes'
            ]
        }, {
            ver: 'Li 12.0724.092836',
            changes: [
                'Only send ten message queue items at a time giving priority to new, unresponsive then errored messages',
                "Gets primary key index and any other indexes whose names start with 'mob_'",
                'Limit the console log to last 100 entries',
                'Added mask when click Admin tables on settings overview',
                'Found an event to listen to for clicking an already checked item in list to accept the value and continue',
                'Fixed dates from syncing'
            ]
        }, {
            ver: 'Li 12.0718.092836',
            changes: [
                'Show upload/download amounts on settings page'
            ]
        }, {
            ver: 'Li 12.0712.152813',
            changes: [
                'Syncing upgraded to PrepareBatch2 fixes issue with multi filters and slow update of deleted records (index on temp table)',
                'CDR updates',
                'Handels errors of the Proccess Que better'
            ]
        }, {
            ver: 'Li 12.0626.165349',
            changes: [
                'Roll back to undo node updates index list properly',
                "Saving to local database was using model version of sql tables instead of newer class methods so wasn't working"
            ]
        }, {
            ver: 'Li 12.0620.121700',
            changes: [
            'When going into a call flow, checks if any of the needed tables had sync errors and if so, asks if want to resync them',
            "Getting messages wasn't clearing the flag for new messages so was crashing when adding a message from middle of list"
            ]
        }, {
            ver: 'Li 12.0615.115616',
            changes: [
                'Added more CDR event log',
                'Fixed bug with showing saved reports after relogging'
            ]
        }, {
            ver: 'Li 12.0614. 85629',
            changes: [
                'Added "Reset Application" button to login view',
                'Call flow globals are now saved to local storage'
            ]
        }, {
            ver: 'Li 12.0613.100657',
            changes: [
                'Added Show Debug Info setting to toggle showing extra info to help debug',
                'Set the seed for the sequential identifier for index items when reloading from a draft so new nodes are sorted properly'
            ]
        }, {
            ver: 'Li 12.0601.154024',
            changes: [
                'If UseLocation is set and ListSQL returns values in 3rd and 4th columns and they are numbers, the list of options is sorted by distance assuming the 3rd value is latitude and 4th value is longitude',
                'Properly sets group string again fixing issue when go back to a previous group string'
            ]
        }, {
            ver: 'Li 12.0525.113042',
            changes: [
                "Don't show syncing mask while checking if should sync tables",
                'CDR records written to VIPSMobileData.dbo.CDR table.  Not many events in code yet but can start adding them now',
                'Node Tree is integrated with index items so no longer need to update two values'
            ]
        }, {
            ver: 'Li 12.0510. 91343',
            changes: [
                'Clear Global variables on save upto "Undo node" or top of Call Flow.',
                'Force sync - only availble when tapping on "refresh/sync" buttons',
                'Change of mailbox when logging in bug fix',
                'Message Badge Text now reports correct value, is updated',
                'If never got table, sync even if frequency set to never'
            ]
        }];

    }

});

