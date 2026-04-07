//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.table.GridNode', {
    extend: 'Ext.field.Field',

    config: {
        items: [{
            xtype: 'fieldset',
            itemId: 'radios'
        }]

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
        var cnt, i, strLabel, radio, tapFn;

        // add all the options as radios
        for (i = 0; i < node.get('Options').length; i++) {

            // prepend the value if in debug mode
            strLabel = node.get('Options')[i].text;
            if (VIPSMobile.User.getDebug()) {
                strLabel += '(' + node.get('Options')[i].value.toString() + ')';
            }

            radio = cnt.add({
                xtype: 'radiofield',
                name: node.get('FieldToStoreValue') + node.get('id'),
                cls: 'Data',
                label: strLabel,
                labelWidth: '75%',
                labelWrap: true,
                value: node.get('Options')[i].value,
                func: 'Action'
            });

            // listen for tap event instead of check so progress when already checked and tapped again
            radio.element.on('tap', tapFn, radio);

        }

        // call parent setup
        this.callParent(arguments);

    },

    getValue: function () {
        var radio;

        radio = this.down('radiofield[checked]');

        if (radio) {
            return radio.getValue();
        } 
        
        return null;
        
    },

    setValue: function (value) {
        var radio;

        // find the radio with the given value
        radio = this.down('radiofield[value="' + value + '"]');
        if (radio) {

            // update the radio disabling events to keep from cascading
            radio.suspendEvents();
            radio.setChecked(true);
            radio.resumeEvents();

            // scroll to the value
            if (radio.isPainted()) {
                this.scrollToValue();
            } else {
                radio.on('painted', this.scrollToValue, this, { single: true });
            }

        }

    },

    // scroll to the value to make sure it's visible
    scrollToValue: function () {
        var radio;

        try {

            radio = this.down('radiofield[checked]');

            // check if need to scroll
            if (radio.element.getY() > this.element.getHeight()) {

                if (this.getScrollable()) {
                    //this.getScrollable().getScroller().scrollTo(0, radio.element.getY()-this.element.getY());
                    this.getScrollable().getScroller().scrollTo(0, (radio.element.getY() - this.element.getHeight()));
                }

            }

        } catch (ex) {
            console.error('RatingNode.scrollToValue() Error', ex.message);
        }

    }

});
