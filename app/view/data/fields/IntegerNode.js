//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.IntegerNode', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        items: [{
            xtype: 'container',
            itemId: "fieldset",
            layout: {
                type: "hbox",
                align: "stretch",
                pack: "start"
            }, items: [{
                xtype: "numberfield",
                cls: "field-body",
                inputType: 'number',
                itemId: "field",
                flex: 20,
                listeners: {
                    change: function (scope, newValue, oldValue, eOpts) {
                        if (newValue !== oldValue) {
                            var tmpInt = parseInt(newValue, 10);
                            if (isNaN(tmpInt)) {
                                tmpInt = "";
                            }
                            scope.setValue(tmpInt);
                        }
                    },
                   painted: function (scope, e, a) {
                        if(Ext.os.deviceType === "Desktop") { scope.query("input")[0].focus(); }
                    }, 
                    focus: function (scope, e, a) {
                        //console.log(arguments);
                        var floatKeyboard = this.parent.parent.query('#NumberKeyboard')[0]
                        floatKeyboard.setHidden(true);
                    }, 
                    blur: function (scope, e, a) {
                        //console.log(arguments);
                        var floatKeyboard = this.parent.parent.query('#NumberKeyboard')[0]
                        floatKeyboard.setHidden(false);
                    },
                    action: function (scope, e) {
                        e.preventDefault();
                        e.event.stopImmediatePropagation();
                        e.stopPropagation();
                        VIPSMobile.app.getController("Data").onActionTap();
                    }
                }
            }]
        }, {
            layout: { type: 'vbox', pack: 'center', align: 'stretch' },
            itemId: 'NumberKeyboard',
            defaults: {
                layout: { type: 'hbox', align: 'middle' },
                defaults: {
                    xtype: 'button',
                    func: 'Keyboard',
                    ui: 'light',
                    height: 43,
                    width: '30%',
                    margin: '.4em'
                }
            },
            items: [{
                items: [{ text: 1 }, { text: 2 }, { text: 3 }]
            }, {
                items: [{ text: 4 }, { text: 5 }, { text: 6 }]
            }, {
                items: [{ text: 7 }, { text: 8 }, { text: 9 }]
            }, {
                items: [{
                    iconCls: 'backspace',
                    iconMask: true,
                    func: 'BackSpace',
                    ui: 'decline back',
                    width: '28%',
                    margin: '.4em .4em .4em 1em'

                }, {
                    text: '0'
                }]
            }]
        }, {
            xtype: 'button',
            func: 'Action',
            itemId: "btnDone",
            ui: 'action',
            text: 'Done',
            margin: '0.5em 0 0 0'
        }]
    },

    statics: {

        getTypedValue: function (value) {

            if (value === null || value === "") {
                return null;
            }

            return parseInt(value, 10);

        },

        getFormattedValue: function (node) {
            if (node.get('Value') || node.get('Value') === 0 || node.get('Value') === "0") {
                return parseInt(node.get('Value'), 10).toString();
            }

            return "";
        }

    },

    getValue: function () {
        return this.getField().getValue();
    },

    setValue: function (value) {

        if (Ext.isNumeric(value)) {
            value = parseInt(value, 10).toString();
        } else {
            value = "";
        }

        this.getField().setValue(value.toString());

    }

});
