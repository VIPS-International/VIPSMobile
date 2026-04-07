//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.charts.TableChartNode', {
    extend: 'Ext.Container',
    alias: ['TableChartNode'],

    config: {
        scrollable: 'vertical',
        node: null
    },

    setup: function (controller, node) {
        var value = node.get("Value"),
            colListOrder;
        const fiveConsecutiveNumbers = new RegExp(/[0-9]{5,}$/g);

        this.setNode(node);

        console.debug(node.get("Value"));
        var rows, data = node.get("Value");

        if (this.getNode().get("JavaScript") !== "") {
            colListOrder = JSON.parse(this.getNode().get("JavaScript"));
        } else {
            colListOrder = [];
            Ext.iterate(data[0], function (key, value) {
                colListOrder.push(key);
            });
        }

        rows = '<div class="table-header">';
        for (var i = 0; i < colListOrder.length; i++) {
            rows += '<div class="header-item">' + colListOrder[i] + "</div>";
        }

        rows += '</div><div class="table-content">'
        for (var i = 0; i < data.length; i++) {
            rows += '<div class="table-row">';
            for (var j = 0; j < colListOrder.length; j++) {
                value = data[i][colListOrder[j]];
                value += "";
                value = value.toString().replaceAll(fiveConsecutiveNumbers, ChartFunc.niceNumber(value.toString().match(fiveConsecutiveNumbers)));
                rows += '<div class="table-data">' + value + "</div>";
            }
            rows += '</div>'
        }
        rows += "</div>";

        this.add({ html: '<div class="table" id="Chart' + node.internalId + '" style="float: left;">' + rows + '</div>' });

    },

    getValue: function () {
        return "chartnode";
    },

    setValue: function (value) {
        this.setValue(value);
    }

});
