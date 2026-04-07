//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.FloatNode', {
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
                itemId: 'LeadingCharacter',
                html: ''
            }, {
                xtype: "textfield",
                cls: "field-body",
                inputType: 'text',
                itemId: "field",
                flex: 20,
                listeners: {
                    painted: function (scope, e, a) {
                        if(Ext.os.deviceType === "Desktop") { scope.query("input")[0].focus(); }
                    }, 
                    focus: function (scope, e, a) {
                        //console.log(arguments);
                        var floatKeyboard = this.parent.parent.query('#FloatKeyboard')[0]
                        floatKeyboard.setHidden(true);
                    }, 
                    blur: function (scope, e, a) {
                        //console.log(arguments);
                        var floatKeyboard = this.parent.parent.query('#FloatKeyboard')[0]
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
            layout: { type: 'vbox', pack: 'center', align: 'middle' },
            id: 'FloatKeyboard',
            defaults: {
                layout: { type: 'hbox' },
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
                }, {
                    text: '.'
                }]
            }]
        }, {
            xtype: 'button',
            itemId: 'btnDone',
            func: 'Action',
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

            return parseFloat(value);

        },

        getFormattedValue: function (node) {
            var strReturn;

            if (node.get('Value') || node.get('Value') === 0 || node.get('Value') === "0") {
                strReturn = parseFloat(node.get('Value'));
                strReturn = (strReturn % 1) ? strReturn.toFixed(2).toString() : strReturn.toString();
                strReturn = (node.get('LeadingCharacter') || '') + strReturn;
            } else {
                strReturn = "";
            }

            return strReturn;
        }

    },

    getValue: function () {
        return this.getField().getValue();
    },

    setValue: function (value) {

        if (Ext.isNumeric(value)) {
            value = value.toString();
        } else if (value == '.') {
            console.debug('Decimal entered');
        } else {
            value = "";
        }

        this.getField().setValue(value.toString());

    }


});
