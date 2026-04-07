//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.CartNode', {
    extend: 'VIPSMobile.view.data.Detail',

    // don't think any of this is used since cart nodes are/will always be hidden

    config: {
        scrollable: 'vertical',
        layout: {
            type: 'vbox',
            align: 'stretch',
            pack: 'start'
        }
    },

    statics: {

        getFormattedValue: function (node) {
            return node.get('Value')[0];
        }

    },

    checkedField: null,

    setup: function (controller, node) {
        var i, strLabel, me, radio, tapFn;

        this.checkedField = null;
        me = this;

        tapFn = function () {
            me.setField(this);
            this.fireEvent('tap', this);
        };

        // add all the options as radios
        for (i = 0; i < node.get('Options').length; i++) {

            // prepend the value if in debug mode
            strLabel = node.get('Options')[i].text;
            if (VIPSMobile.User.getDebug()) {
                strLabel += '(' + node.get('Options')[i].value.toString() + ')';
            }

            radio = this.add({
                xtype: 'radiofield',
                name: node.get('FieldToStoreValue') + node.get('id'),
                label: strLabel,
                labelWidth: '75%',
                labelWrap: true,
                value: node.get('Options')[i].value
            });

            // listen for tap event instead of check so progress when already checked and tapped again
            radio.element.on('tap', tapFn , radio);

        }

        // call parent setup
        this.callParent(arguments);

    },

    setField: function (check) {
        this.checkedField = check;
    },

    getValue: function () {
        if (this.checkedField) {
            return this.checkedField._value;
        } 
        return null;        
    },

    setValue: function (value) {
        var index, items;
        items = this.getItems().items;

        index = 0;
        while (index < items.length) {

            if (items[index]._value === value) {

                this.checkedField = items[index];
                this.checkedField.suspendEvents();
                this.checkedField.setChecked(true);
                this.checkedField.resumeEvents();

                if (this.checkedField.isPainted()) {
                    this.scrollToValue();
                } else {
                    this.on('painted', this.scrollToValue, this);
                }

                index = items.length;

            } else {
                index++;
            }

        }

    },

    // scroll to the value to make sure it's visible
    scrollToValue: function () {
        var fullHeight, itemHeight, intScrollTo;

        try {

            // remove the event listener
            this.un('painted', this.scrollToValue, this);

            itemHeight = this.checkedField.element.getHeight();
            fullHeight = this.getItems().getCount() * itemHeight;

            // check if all the items fit in the list
            if (fullHeight < this.element.getHeight()) {

                // scroll to the top and turn of scrolling
                if (this.getScrollable()) {
                    this.getScrollable().getScroller().scrollToTop();
                }

            } else {

                if (this.getScrollable()) {

                    // check if the option is bottom visible amount of list
                    if ((fullHeight - this.checkedField.element.dom.offsetTop) < this.element.getHeight()) {

                        // scroll to the end of the list
                        intScrollTo = fullHeight - this.element.getHeight();

                    } else {

                        // scroll so half of option above checked is visible
                        intScrollTo = this.checkedField.element.dom.offsetTop - parseInt(itemHeight / 2, 10);
                        intScrollTo = Math.max(0, intScrollTo);

                    }

                    this.getScrollable().getScroller().scrollTo(0, intScrollTo);
                }

            }

        } catch (ex) {
            console.error('CartNode.scrollToValue() Error', ex.message);
        }


    }

});
