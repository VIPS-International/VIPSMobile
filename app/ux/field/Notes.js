//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.field.Notes', {
    extend: 'Ext.field.Field',
    xtype: 'notesfield',

    config: {
        component: null,
        radioComponent: null,
        textComponent: null
    },

    initialize: function () {
        var i, item, Comp, textComp, radioComp, options, value = '';

        options = this.config.value;
        if (Ext.isArray(options)) {

            this.setComponent({
                xtype: 'panel',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                scrollable: 'vertical',
                height: '250px'
            });
            
            Comp = this.getComponent();
            
            radioComp = Comp.add({
                xtype: 'fieldset',
                name: 'popup'
            });

            for (i = 0; i < options.length; i += 1) {
                item = radioComp.add({
                    xtype: 'radiofield',
                    name: 'option',
                    value: options[i],
                    label: options[i],
                    labelWidth: '80%'
                });

                item.scope = this;

                item.element.on('tap', this.ChangeValueTap, item);
            }

            this.setRadioComponent(radioComp);

            textComp = Comp.add({
                xtype: 'textfield',
                label: 'Notes',
                value: value
            });

            this.setTextComponent(textComp);

        } else {

            this.setComponent({
                xtype: 'textareafield',
                label: false,
                value: options,
                scrollable: false,
                height: '250px'

            });
            
            Comp = this.getComponent();
            
            this.setTextComponent(Comp);
        }



    },

    ChangeValueTap: function () {
        this.scope.getTextComponent().setValue(this.getValue());
    },

    getValue: function () {

        return this.getTextComponent().getValue();

    },

    setValue: function (value) {

        if (this.getTextComponent()) {
            if (Ext.isArray(value)) {
                this.getTextComponent().setValue('');
            } else {
                this.getTextComponent().setValue(value);
            }
        }

    }

});
