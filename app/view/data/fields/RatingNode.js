//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.RatingNode', {
    extend: 'VIPSMobile.view.data.Detail',
    alias: ['VIPSMobile.view.data.fields.GridNode'],

    config: {
        layout: 'vbox',
        items: [{
            xtype: 'container',
            flex: 1,
            layout: 'hbox',
            defaults: {
                xtype: 'container',
                flex: 1,
            },
            items: [{
                itemId: 'lowTextDescripton'
            }, {
                xtype: 'spacer'
                , flex: 4
            }, {
                itemId: 'highTextDescripton',
                layout: {
                    align: 'right'
                },
                style: {
                    'text-align': 'right',
                }
            }]
        }, {
            xtype: 'sliderfield',
            flex:1,
            itemId: 'slider',
            increment: 1,
            listeners: {
                'change': function (me, sl, thumb, newValue, oldValue, eOpts) {
                    me.getParent().onChange(me, sl, thumb, newValue, oldValue, eOpts)
                }
            }
        }, {
            xtype: 'textfield',
            itemId: 'txtSelected',
            label: 'Rating: ',
            flex: 1,
            listeners: {
                'change': function (me, newValue, oldValue, eOpts) {
                    var field = me.getParent();

                    field.down('#slider').setValue(newValue);
                    if (field.getLocalOptions()[newValue]) {
                        field.addSelectedHtml(field.getLocalOptions()[newValue].html);
                    } else {
                        field.addSelectedHtml('<h2>' + newValue + '</h2>');
                    }

                }
            }
        }, {
            xtype: 'fieldset',
            itemId: 'selectedFieldset',
            flex:8,
            items: []
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            margin: '0.5em 0 0 0',
            docked: 'bottom'
        }],
        localOptions: {},

    },

    statics: {

        getFormattedValue: function (node) {
            var value, i;

            value = '';

            for (i = 0; i < node.get('Options').length; i++) {

                if (node.get('Value').toString() === node.get('Options')[i].value.toString()) {
                    value = node.get('Options')[i].text;
                    break;
                }

            }

            if (value !== null) {

                value = value.toString();

                // remove sub heading if set, ie distance label
                if (value.indexOf('<br') > 0) {
                    value = value.substring(0, value.indexOf('<br'));
                }

                return value;

            }

            return value;

        }

    },

    setup: function (controller, node) {
        var optValue,
            optText,
            optHtml,
            minValue = undefined,
            maxValue = undefined,
            nodeValue = parseInt(node.get('Value'), 10) || 1,
            slider = this.down('#slider'),
            lowTextDescripton = this.down('#lowTextDescripton'),
            highTextDescripton = this.down('#highTextDescripton'),
            txtSelected = this.down('#txtSelected');

        // add all the options as radios
        for (var i = 0; i < node.get('Options').length; i++) {
            optValue = parseInt(node.get('Options')[i].value.toString(), 10);
            optHtml = node.get('Options')[i].text;
            var tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = optHtml;
            optText = tmpDiv.textContent;
            minValue = (!minValue || (optValue < minValue)) ? optValue : parseInt(minValue, 10);
            maxValue = (!maxValue || (optValue > maxValue)) ? optValue : parseInt(maxValue, 10);
            this.getLocalOptions()[optValue] = {
                text: optText,
                html: optHtml,
                selected: parseInt(nodeValue, 10) == parseInt(optValue, 10),
            }
        }

        slider.setMinValue(minValue);
        slider.setMaxValue(maxValue);
        slider.setValue(nodeValue || minValue);

        lowTextDescripton.setHtml(this.getLocalOptions()[minValue].text);
        highTextDescripton.setHtml(this.getLocalOptions()[maxValue].text);

        this.addSelectedHtml(this.getLocalOptions()[nodeValue || minValue].html);
        txtSelected.setValue(nodeValue || minValue);

        // call parent setup
        this.callParent(arguments);

    },

    getValue: function () {
        return this.down('#slider').getValue();
    },

    setValue: function (value) {
        this.down('#slider').setValue(value);
    },
    addSelectedHtml(html) {
        var selectedFieldset = this.down('#selectedFieldset');

        selectedFieldset.removeAll(true);
        selectedFieldset.add({
            styleHtmlContent: true,
            layout: {
                align: 'center'
            },
            style: {
                'text-align': 'center',
            },
            html: html
        });
    },

    onChange(me, sl, thumb, newValue, oldValue, eOpts) {
        var txtSelected = this.down('#txtSelected');       
        txtSelected.setValue(newValue);
    }

});
