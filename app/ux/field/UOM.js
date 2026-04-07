//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.field.UOM', {
    extend: 'Ext.field.Field',
    xtype: 'uomfield',

    requires: [
        'VIPSMobile.ux.field.Notes'
    ],

    config: {
        component: {
            xtype: 'container',
            layout: { type: 'vbox', pack: 'start' },
            height: 41,
            defaults: {
                height: 41
            }
        },
        quantityComponent: null,
        discountComponent: null,
        overridePriceComponent: null,
        notesComponent: null
    },

    initialize: function () {
        var QuantitySpinner, DiscountSpinner, NotesField, OverridePrice, items = 0;

        this.callParent();

        QuantitySpinner = this.getComponent().add({
            xtype: 'spinnerfield',
            label: this.config.qtyLabel,
            labelWidth: 0,
            value: this.config.value.quantity,
            maxValue: this.config.maxValue,
            minValue: this.config.minValue,
            stepValue: 1,
            listeners: {
                tap: {
                    element: 'element',
                    fn: this.ChangeValueTap,
                    scope: this
                },
                click: {
                    element: 'element',
                    fn: this.ChangeValueTap,
                    scope: this
                },
                change: {
                    fn: this.onChange,
                    scope: this
                }
            }
        });

        items += 1;
        this.setQuantityComponent(QuantitySpinner);

        DiscountSpinner = this.getComponent().add({
            xtype: 'spinnerfield',
            label: 'Discount %',
            labelWidth: 0,
            hidden: (this.config.value.discount === null || this.config.value.discount === undefined),
            disabled: (this.config.value.discount === null || this.config.value.discount === undefined),
            value: this.config.value.discount,
            maxValue: 100,
            minValue: 0,
            stepValue: 0.5,
            listeners: {
                tap: {
                    element: 'element',
                    fn: this.ChangeValueTap,
                    scope: this
                }
            }
        });
        this.setDiscountComponent(DiscountSpinner);
        if (!(this.config.value.discount === null || this.config.value.discount === undefined)) {
            items += 1;
        }

        OverridePrice = this.getComponent().add({
            xtype: 'numberfield',
            label: 'Override Price $',
            labelWidth: 0,
            hidden: (this.config.value.overrideprice === null || this.config.value.overrideprice === undefined),
            value: this.config.value.overrideprice,
            listeners: {
                tap: {
                    element: 'element',
                    fn: this.ChangeValueTap,
                    scope: this
                }
            }
        });
        this.setOverridePriceComponent(OverridePrice);
        if (!(this.config.value.overrideprice === null || this.config.value.overrideprice === undefined)) {
            items += 1;
        }

        NotesField = this.getComponent().add({
            xtype: 'hiddenfield',
            hidden: true,
            value: this.config.value.notes
        });

        if (this.config.value.notes) {
            NotesField.Button = this.getComponent().add({
                xtype: 'button',
                text: 'Add Notes...',
                hidden: (this.config.value.notes === null || this.config.value.notes === undefined),
                listeners: {
                    tap: {
                        element: 'element',
                        fn: this.SetNotesValueTap,
                        scope: this
                    }
                }
            });

            NotesField.Display = this.getComponent().add({
                xtype: 'container',
                docked: 'bottom',
                html: (this.config.value.notes.indexOf('[') === 0) ? '' : '<div style="text-align: right;color: blue">' + this.config.value.notes.replace(/\n/gi, "<br/>") + '</div>'
            });

            items += 2;
        }
        this.setNotesComponent(NotesField);

        this.getComponent().setHeight(items * 41);

    },

    ChangeValueTap: function (scope, target) {
        var UOMName, strType, spinner;

        target = (target.id.indexOf('input') > -1) ? target : target.parentElement;

        if (target.id.indexOf('input') > -1) {

            UOMName = this.uom.Name;
            spinner = Ext.getCmp(scope.delegatedTarget.id);
            strType = spinner.getLabel();

            Ext.Msg.prompt(strType, 'Enter  ' + strType.toLowerCase() + ' of ' + UOMName, function (btn, value) {

                if (btn === 'ok') {

                    // check if the value is a number and positive
                    if (Ext.isNumeric(value) && parseFloat(value, 10) >= 0) {

                        value = parseFloat(value, 10);

                        // make sure the field will accept the value
                        if (spinner.getMaxValue && spinner.getMaxValue() < value) {
                            spinner.setMaxValue(value);
                        }

                        spinner.setValue(value);

                    } else {
                        Ext.Msg.alert(strType, 'Must enter a positive number.');
                    }

                }

            }, this, false, spinner.getValue() || 0, { xtype: 'textfield', inputType: 'number' });

        }

    },
    SetNotesValueTap: function () {
        var options, UOMName;

        try {
            options = JSON.parse(this.getNotesComponent().getValue());
        } catch (ex) {
            options = this.getNotesComponent().getValue().trim();
        }

        UOMName = this.uom.Name;

        Ext.Msg.prompt('Notes', 'Enter notes for ' + UOMName, function (btn, value) {
            var locValue = value;

            locValue = locValue.replace(/\n/gi, "<br/>");

            if (btn === 'ok') {
                this.getNotesComponent().setValue(value);
                this.getNotesComponent().Display.setHtml('<div style="text-align: right;color: blue">' + locValue + '</div>');
            }

        }, this, false, options, { xtype: 'notesfield', value: options });



    },
    getValue: function () {

        return {
            quantity: this.getQuantityComponent().getValue(),
            discount: this.getDiscountComponent().isHidden() ? null : this.getDiscountComponent().getValue(),
            overrideprice: this.getOverridePriceComponent().isHidden() ? null : this.getOverridePriceComponent().getValue(),
            notes: !!(this.config.value.notes) ? this.getNotesComponent().getValue() : null
        };

    },

    setValue: function (value) {
        var objValue;

        if (typeof value !== 'object') {

            objValue = {
                quantity: value,
                discount: null,
                notes: null,
                overrideprice: null
            };

        } else {
            objValue = value;
        }

        if (this.getQuantityComponent()) {
            this.getQuantityComponent().setValue(objValue.quantity);
        }

        if (this.getDiscountComponent()) {
            if (objValue.discount !== null) {
                this.getDiscountComponent().setValue(objValue.discount);
            }
        }

        if (this.getOverridePriceComponent()) {
            if (objValue.overrideprice !== null) {
                this.getOverridePriceComponent().setValue(objValue.overrideprice);
            }
        }

        if (this.getNotesComponent()) {
            if (objValue.notes !== null) {
                this.getNotesComponent().setValue(objValue.notes);
            }
        }

    },

    onChange: function (me, value, startValue) {
        me.fireEvent('change', this, value, startValue);
    }

});
