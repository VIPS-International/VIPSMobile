//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.charts.LabelChartNode', {
    extend: 'Ext.Component',
    alias: ['LabelChartNode'],

    config: {
        xtype: 'container',
        styleHtmlContent: true,
        listeners: {
            painted: function () {
                this.funcDrawChart();
            }
        },
        node: null
    },

    setup: function (controller, node) {
        this.setHtml('<div id="ChartDiv' + node.internalId + '">' + node.get("Value") + '</div>');
        this.setNode(node);
    },

    funcDrawChart: function (isDefered) {
        var width = parseInt(this.getWidth(), 10),
            height = parseInt(this.getHeight(), 10),
            oldChart = ChartFunc.getCharts()['Chart' + this.getNode().internalId],
            checkTime = new Date(),
            options;

        checkTime.setSeconds(checkTime.getSeconds() - 10);

        const ctx = document.getElementById('Chart' + this.getNode().internalId);
        if (width > 0 && ctx) {
            ctx.width = width;
            ctx.height = height;

            if (oldChart !== undefined && oldChart.cTime > checkTime) {
                //the chart is made don't make it again
                return;
            }

            if (this.getNode().get("JavaScript") !== "") {
                options = JSON.parse(this.getNode().get("JavaScript"));
            }

            ctx.style = {
                display: 'flex',
                "justify-content": "center",
                "align-items": "center",
                "height": height + 'px',
                "width": width + 'px',
                "float": "left",
                ...options
            }

        } else {
            console.debug("defered LabelChartNode");
            if (!isDefered) {
                Ext.defer(function () {
                    this.funcDrawChart(true)
                }, 400, this);
            }
        }
    },

    getValue: function () {
        return "chartnode";
    },

    setValue: function (value) {
        this.setValue(value);
    }

});
