//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.SQLWebReportNode', {
    extend: 'VIPSMobile.view.data.Detail',

    tbConfig: {
        title: 'Reports',
        items: [{
            text: VIPSMobile.getString('Back'),
            ui: 'back action',
            func: 'Index'
        }, {
                text: VIPSMobile.getString('Excel'),
                ui: 'action',
                align: 'right',
                func: 'ReportInExcel'
        }, {
                text: VIPSMobile.getString('PDF'),
                ui: 'action',
                align: 'right',
                func: 'ReportInPDF'
        }, {
            text: VIPSMobile.getString('Fullscreen'),
            ui: 'action',
            align: 'right',
            func: 'QuestionFullScreen'
        }]
    },

    config: {
        callFlowID: null,
        controller: null,
        scrollable: 'both',
        padding: '.6em',
        cls: 'rightpanel',
        panel: 'right'
    },

    setup: function (controller, node) {

        if (node) {
            this.callParent(arguments);
            this.generate(controller, node);
            this.setController(controller);
        }

    },

    generate: function (controller, node) {
        var values;

        // remember the call flow id
        this.setCallFlowID(VIPSMobile.CallFlows.getCurrent(controller).getCallFlowID());

        values = DataFunc.ReplaceValueTags(node, node.get('SQLWebReportParams'), true);

        VIPSMobile.Main.setMask('Data', 'Preparing...');

        this.GetReport(node.get('CallFlowID'), values);

    },

    GetReport: function (CallFlowID, Params) {

        Ext.Ajax.request({
            url: VIPSMobile.ServiceURL + 'Reports/GetReportHTML',
            timeout: 300000,
            headers: { 'Content-Type': 'application/json' },
            jsonData: {
                "Mailbox": VIPSMobile.User.getMailbox(),
                "CallFlowID": CallFlowID,
                "Params": Params,
                "OutputFormat" : 'HTML'
            },
            scope: this,
            success: this.SetupReportDetail,
            failure: this.SetupReportDetail
        });

    },

    SetupReportDetail: function (response) {
        var objResponse, strHtml,
            me = this;

        if (response && response.status === 200) {

            objResponse = response.responseObject;

            if (objResponse.success && objResponse.trace === '') {

                strHtml = objResponse.report; //atob(objResponse.report);
                strHtml = strHtml.replace("overflow:auto;", "backgroud-color: White;");

                // save the html 
                this.SaveReport(strHtml);

            } else {

                // show the error
                strHtml = '<strong>Error rendering report</strong><br /><br /><p>' + objResponse.trace + '</p>';
            }

        } else {

            strHtml = 'Report not available';

        }

        this.setHtml(strHtml);

        Ext.iterate(this.element.dom.querySelectorAll('img'), function (i) {
            i.src = i.src + '&_dc=' + Date.now().toString();
        });

        Ext.iterate(this.element.dom.querySelectorAll('a'), function (aHref) {

            aHref.onclick = function (e) {

                var el,
                    id = this.getAttribute('href');

                e.preventDefault();

                if (id.indexOf('#') !== -1) {

                    id = id.substring(1);

                    el = me.element.dom.querySelector('*[id="' + id + '"]');

                    var offset = 0;

                    offset = el.getBoundingClientRect().top + window.pageYOffset - el.ownerDocument.documentElement.clientTop;

                    //el.scrollIntoView();

                    me.getScrollable().getScroller().scrollTo(0, offset - 75, true);

                } else if(me.getNode().get("Destination1")) {
                    var controller = me.getController(),
                        node = controller.getCallFlow().CreateChildNode(me.getNode(), me.getNode().get("Destination1")),
                        strSearch = this.search.slice(1),
                        strParams = node.get("SQLWebReportParams"),
                        params = {};

                    strSearch.split("&").forEach(function (strParam) {
                        var key = strParam.split("=")[0],
                            value = strParam.split("=")[1];

                        strParams = strParams.replace(new RegExp('\\[' + key + '\\]', 'gi'), value);

                    });

                    node.set("SQLWebReportParams", strParams);



                    controller.showReport(node);
                }

                return false;
            };

        });

        VIPSMobile.Main.setMask('Data', false);

    },

    SaveReport: function (vHTML) {
        var lstSQL, reportId;

        reportId = DataFunc.getdate();
        lstSQL = [];

        // delete any reports above maximum number
        lstSQL.push('DELETE FROM SavedReports WHERE ROWID NOT IN (SELECT ROWID FROM SavedReports WHERE CallFlowID='
            + this.getCallFlowID() + ' ORDER BY SavedAt LIMIT ' + (VIPSMobile.User.getSavedReportsCount() - 1) + ')');

        // add this report to the table
        lstSQL.push({
            sql: 'INSERT INTO SavedReports (CallFlowID, SavedAt, ReportHTML) VALUES (?, ?, ?)',
            params: [this.getCallFlowID(), reportId, vHTML]
        });

        DataFunc.executeMany({
            statements: lstSQL,
            scope: this,
            callback: function () {
                //VIPSMobile.CallFlows.get(this.getCallFlowID()).getSavedReports().push(reportId);

                // repopulate the report ids
                VIPSMobile.CallFlows.get(this.getCallFlowID()).GetSavedReportIds();

            }
        });

    },

    showSaved: function (html) {
        this.setHtml(html);
        this.setValue(html);
    },

    getValue: function () {
        return this.getHtml();
    },

    setValue: Ext.emptyFn

});
