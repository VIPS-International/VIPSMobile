//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.charts.PieChartNode', {
    extend: 'Ext.Component',
    alias: ['PieChartNode'],

    config: {
        xtype: 'container',
        listeners: {
            resize: function () {
                this.resizeChart();
            },
        },
        node: null,
        chart: null,
        ctx: null
    },

    setup: function (controller, node, width, height) {
        this.setNode(node);
        var ctx = document.createElement('canvas')
        ctx.id = 'Chart' + this.getNode().internalId;
        ctx.width = width || 300;
        ctx.height = height || 188;

        this.setCtx(ctx);
        this.element.dom.appendChild(ctx);
        this.funcDrawChart();
    },
    resizeChart: function () {
        var width = parseInt(this.getWidth(), 10),
            height = parseInt(this.getHeight(), 10);

        this.getCtx().width = width;
        this.getCtx().height = height;
        this.getCtx().style = "display: block; box-sizing: border-box; height: " + height + "px; width: " + width + "px;"

        this.getChart().aspectRatio = width / height;
        this.getChart().resize();
        this.getChart().update();

    },
    funcDrawChart: function (isDefered) {
        var options;
                
        const ctx = this.getCtx();
        console.debug(ctx, this.getChart());

        if (this.getNode().get("JavaScript") !== "") {
            options = JSON.parse(this.getNode().get("JavaScript"));
        }

        var aspectRatio = (this.getNode().get("Width") / this.getNode().get("Height")) * 1.6
        const myChart = new Chart(ctx, {
            type: 'pie',
            plugins: [ChartDataLabels],
            data: ChartFunc.get1DDatasets(this.getNode().get("Value")),
            options: {
                scales: false,
                responsive: false,
                maintainAspectRatio: false,
                aspectRatio: aspectRatio,
                ...options
            }
        });

        this.setChart(myChart);

    },

    getValue: function () {
        return "chartnode";
    },

    setValue: function (value) {
        this.setValue(value);
    }

});
