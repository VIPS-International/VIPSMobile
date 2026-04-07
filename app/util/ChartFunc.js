//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later



Ext.define('VIPSMobile.util.ChartFunc', {
    alternateClassName: ['ChartFunc'],
    singleton: true,

    requires: ['VIPSMobile.SQLTables', 'VIPSMobile.util.DataFunc'],

    config: {
        charts: {},
        backgroundColors: [
            'rgba(138,43,226,.2)',
            'rgba(210,105,30,.2)',
            'rgba(100,149,237,.2)',
            'rgba(220,20,60,.2)',
            'rgba(47,79,79,.2)',
            'rgba(0,206,209,.2)',
            'rgba(255,215,0,.2)',
            'rgba(218,165,32,.2)',
            'rgba(240,255,240,.2)',
            'rgba(255,105,180,.2)',
            'rgba(255,255,240,.2)',
            'rgba(32,178,170,.2)',
            'rgba(176,196,222,.2)',
            'rgba(128,128,0,.2)',
            'rgba(255,165,0,.2)',
            'rgba(255,69,0,.2)',
            'rgba(152,251,152,.2)',
            'rgba(221,160,221,.2)',
            'rgba(176,224,230,.2)',
            'rgba(255,255,0,.2)',
            'rgba(154,205,50,.2)',
        ],
        borderColors: [
            'rgba(138,43,226,1)',
            'rgba(210,105,30,1)',
            'rgba(100,149,237,1)',
            'rgba(220,20,60,1)',
            'rgba(47,79,79,1)',
            'rgba(0,206,209,1)',
            'rgba(255,215,0,1)',
            'rgba(218,165,32,1)',
            'rgba(240,255,240,1)',
            'rgba(255,105,180,1)',
            'rgba(255,255,240,1)',
            'rgba(32,178,170,1)',
            'rgba(176,196,222,1)',
            'rgba(128,128,0,1)',
            'rgba(255,165,0,1)',
            'rgba(255,69,0,1)',
            'rgba(152,251,152,1)',
            'rgba(221,160,221,1)',
            'rgba(176,224,230,1)',
            'rgba(255,255,0,1)',
            'rgba(154,205,50,1)',
        ]
    },

    constructor: function (config) {
        this.initConfig(config);
    },
    setColourPallet: function () {
        var strSQL = "SELECT * FROM " + SQLTables.Tables.ColourPallet + " ORDER BY SortOrder";
        DataFunc.executeSQL({
            sql: strSQL,
            scope: this,
            success: function (tx, results) {
                var colors = [];

                for (i = 0; i < results.rows.length; i++) {
                    colors.push(results.rows.item(i).Colour);
                }

                this.setBackgroundColors(colors);
                this.setBorderColors(colors);
            }
        });
    },
    getBackgroundColor: function (index) {
        var colors = this.getBackgroundColors();

        if (index !== undefined) {
            return colors[index]
        } else {
            return colors;
        }
    },    
    getBorderColor: function (index) {
        var colors = this.getBorderColors();

        if (index !== undefined) {
            return colors[index]
        } else {
            return colors;
        }

    },
    get2DDatasets: function (value) {
        var datasets = [], i, j, labels = [], objReturn;

        if (value == null) {
            return;
        }
        if (!Ext.isArray(value)) {
            value = [value];
        }
        //flatten objects to 2D arrays of values
        for (i = 0; i < value.length; i++) {
            var objDataset = false;
            for (j = 0; j < datasets.length; j++) {
                if (datasets[j].label === value[i].label) {
                    objDataset = datasets[j];
                }
            }
            if (!objDataset) {
                objDataset = {
                    label: value[i].label,
                    type: value[i].type,
                    data: [],
                    backgroundColor: value[i].backgroundColor || ChartFunc.getBackgroundColor(datasets.length),
                    borderColor: value[i].borderColor || ChartFunc.getBorderColor(datasets.length),
                    borderWidth: 1
                }
                datasets.push(objDataset);
            }
            objDataset.data.push(value[i].data);
            if (labels.indexOf(value[i].labels) === -1) {
                labels.push(value[i].labels);
            }
        }

        objReturn = {
            labels: labels,
            datasets: datasets
        }

        console.debug("ChartFunc.getDatasets", objReturn, value);

        return objReturn;

    },

    get1DDatasets: function (value) {
        var datasets = [], i, j, labels = [], objReturn;

        if (value == null) {
            return;
        }

        if (!Ext.isArray(value)) {
            value = [value];
        }
        //flatten objects to 2D arrays of values
        for (i = 0; i < value.length; i++) {
            var objDataset = false;
            for (j = 0; j < datasets.length; j++) {
                if (datasets[j].label === value[i].label) {
                    objDataset = datasets[j];
                }
            }
            if (!objDataset) {
                objDataset = {
                    label: value[i].label,
                    type: value[i].type,
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }
                datasets.push(objDataset);
            }
            objDataset.data.push(value[i].data);
            objDataset.backgroundColor.push(value[i].backgroundColor || ChartFunc.getBackgroundColor(objDataset.data.length-1));
            objDataset.borderColor.push(value[i].borderColor || ChartFunc.getBorderColor(objDataset.data.length-1));

            if (labels.indexOf(value[i].labels) === -1) {
                labels.push(value[i].labels);
            }
        }

        objReturn = {
            labels: labels,
            datasets: datasets
        }

        console.debug("ChartFunc.getDatasets", objReturn);

        return objReturn;

    },

    getDatasets: function (value) {
        var objDatasets = {}, objDataset, dataset, datasets = [], i, returnArray = [], labels = [], groupCount = 0, objReturn;

        //flatten objects to 2D arrays of values
        for (i = 0; i < value.length; i++) {
            dataset = [];
            Ext.iterate(value[i], function (key, value, index) {
                dataset.push(value);
            });
            datasets.push(dataset);
        }

        for (i = 0; i < datasets.length; i++) {

            if (datasets[i].length > 2) {
                objDataset = objDatasets[datasets[i][1]]
                //group by second argument and create dataset obj
                if (!objDataset) {
                    objDataset = {
                        label: datasets[i][1],
                        data: [datasets[i][0]],
                        backgroundColor: ChartFunc.getBackgroundColor(groupCount),
                        borderColor: ChartFunc.getBorderColor(groupCount),
                        borderWidth: 1
                    }
                    objDatasets[datasets[i][1]] = objDataset;
                    groupCount += 1;
                } else {
                    objDataset.data.push(datasets[i][0]);
                }

                if (labels.indexOf(datasets[i][2]) === -1) {
                    labels.push(datasets[i][2]);
                }
            } else {
                if (!objDataset) {
                    objDataset = {
                        data: [datasets[i][0]],
                        backgroundColor: ChartFunc.getBackgroundColor(),
                        borderColor: ChartFunc.getBorderColor(),
                        borderWidth: 1
                    }
                    objDatasets['1d'] = objDataset;
                } else {
                    objDataset.data.push(datasets[i][0]);
                }
                if (labels.indexOf(datasets[i][1]) === -1) {
                    labels.push(datasets[i][1]);
                }
            }
        }

        //flatten dataset object into simple arrays
        Ext.iterate(objDatasets, function (key, value) {
            returnArray.push(value);
        })

        objReturn = {
            labels: labels,
            datasets: returnArray
        }

        console.debug("ChartFunc.getDatasets", objReturn);

        return objReturn;

    },

    niceNumber: function (x) {
        const units = ['', ' K', ' M', ' B', ' T'];
        let l = 0, n = parseInt(x, 10) || 0;
        while (n >= 1000 && ++l) {
            n = n / 1000;
        }
        return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + units[l]);
    }

});
