//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.dashboard.Detail', {
    extend: 'Ext.dataview.component.DataItem',
    xtype: 'dashboardlistitem',

    config: {
        description: {
            cls: ''
        },
        field: {
            cls: '',
        },
        layout: {
            type: 'vbox',
            align: 'center'
        },
        grid: function () {
            var grid;
            if (window.innerWidth > 1000) {
                grid = 6
            } else if (window.innerWidth > 800) {
                grid = 4
            } else {
                grid = -1
            }
            return grid;
        }()
    },    
    updateRecord: function (record) {
        var backgroundColour = '#ccc';

        if (record) {
            var view = VIPSMobile.view.dashboard.params[record.get('NodeTypeDesc')] || VIPSMobile.view.dashboard.charts[record.get('NodeTypeDesc')];
            if (view) {
                var cmp = Ext.create(view),
                    width = (this.calcWidth(this.getRecord().get('Width')) - 30),
                    height = this.calcHeight(this.getRecord().get('Height'));
                cmp.setWidth(width + 'px');
                if (this.getRecord().get("Height") > 0) {
                    cmp.setHeight(height + 'px');
                } else {
                    backgroundColour = '#fff';
                }

                cmp.setup(this.getDataview().getController(), this.getRecord(), width, height);

                if (record.get('Options') && record.get('Options')[0]) {
                    backgroundColour = record.get('Options')[0].text;
                }                
                this.setStyle({
                    padding: ".2em",
                    margin: ".3em",
                    "border": "2px solid " + backgroundColour, //#333",
                    "border-radius": '.3em',
                    //"background-color": "#b3e5fc" //backgroundColour
                });
                this.setField(cmp);
                if (cmp.setLabelWidth === undefined) {
                    this.getDescription().setHtml(this.getRecord().get('Description'));
                }
            }
        }
    },
    calcWidth: function (w) {
        if (this.getGrid() > 0) {
            return ((window.innerWidth - 30) / this.getGrid()) * (w || 1);
        }
        return window.innerWidth - 30;
    },
    calcHeight: function (h) {
        return this.calcWidth(h) * (1 / 1.6);
    },
    applyDescription: function (config) {
        return Ext.factory(config, Ext.Component, this.getDescription());
    },
    updateDescription: function (newDescription, oldDescription) {
        if (newDescription) {
            this.add(newDescription);
        }

        if (oldDescription) {
            this.remove(oldDescription);
        }
    },
    applyField: function (config) {
        if (this.getRecord()) {
            this.setWidth(this.calcWidth(this.getRecord().get('Width')) + 'px');
        }
        return Ext.factory(config, Ext.Component, this.getField());
    },
    updateField: function (newField, oldField) {
        if (newField) {
            this.add(newField);
        }
        if (oldField) {
            this.remove(oldField);
        }
    },
});
