//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.ux.picker.Field', {
    extend: 'Ext.Container',
    alias: 'widget.fieldpicker',

    requires: ['Ext.picker.Slot', 'Ext.data.Model'],

    isPicker: true,

    /**
     * @event pick
     * Fired when a slot has been picked
     * @param {Ext.Picker} this This Picker.
     * @param {Object} The values of this picker's slots, in `{name:'value'}` format.
     * @param {Ext.Picker.Slot} slot An instance of Ext.Picker.Slot that has been picked.
     */

    /**
     * @event change
     * Fired when the value of this picker has changed the Done button has been pressed.
     * @param {Ext.picker.Picker} this This Picker.
     * @param {Object} value The values of this picker's slots, in `{name:'value'}` format.
     */

    /**
     * @event cancel
     * Fired when the cancel button is tapped and the values are reverted back to
     * what they were.
     * @param {Ext.Picker} this This Picker.
     */

    config: {
        /**
         * @cfg
         * @inheritdoc
         */
        cls: Ext.baseCSSPrefix + 'picker',

        /**
         * @cfg {Boolean} useTitles
         * Generate a title header for each individual slot and use
         * the title configuration of the slot.
         * @accessor
         */
        useTitles: false,

        /**
         * @cfg {Array} slots
         * An array of slot configurations.
         *
         * - `name` {String} - Name of the slot
         * - `data` {Array} - An array of text/value pairs in the format `{text: 'myKey', value: 'myValue'}`
         * - `title` {String} - Title of the slot. This is used in conjunction with `useTitles: true`.
         *
         * @accessor
         */
        slots: null,

        /**
         * @cfg {String/Number} value The value to initialize the picker with.
         * @accessor
         */
        value: null,

        /**
         * @cfg {Number} height
         * The height of the picker.
         * @accessor
         */
        height: 220,
        width: '100%',

        /**
         * @cfg
         * @inheritdoc
         */
        layout: {
            type: 'hbox',
            align: 'stretch'
        },

        listeners: {
            painted: function () {
                try {
                    this.element.dom.firstChild.setAttribute('class', 'x-sheet-inner ' + this.element.dom.firstChild.getAttribute('class'));
                } catch (ex) {
                    console.error('Field.painted() Error', ex.message);
                }
            }
        },

        /**
         * @cfg
         * @hide
         */
        centered: false,

        // @private
        defaultType: 'pickerslot'

    },

    initialize: function () {
        var me = this,
            clsPrefix = Ext.baseCSSPrefix,
            innerElement = this.innerElement;

        //insert the mask, and the picker bar
        this.mask = innerElement.createChild({
            cls: clsPrefix + 'picker-mask'
        });

        this.bar = this.mask.createChild({
            cls: clsPrefix + 'picker-bar'
        });

        me.on({
            scope: this,
            delegate: 'pickerslot',
            slotpick: 'onSlotPick'
        });
    },

    /**
     * @private
     */
    updateUseTitles: function (useTitles) {
        var innerItems = this.getInnerItems(),
            ln = innerItems.length,
            cls = Ext.baseCSSPrefix + 'use-titles',
            i, innerItem;

        //add a cls onto the picker
        if (useTitles) {
            this.addCls(cls);
        } else {
            this.removeCls(cls);
        }

        //show the time on each of the slots
        for (i = 0; i < ln; i++) {
            innerItem = innerItems[i];

            if (innerItem.isSlot) {
                innerItem.setShowTitle(useTitles);
            }
        }
    },

    applySlots: function (slots) {
        //loop through each of the slots and add a reference to this picker
        if (slots) {
            var ln = slots.length,
                i;

            for (i = 0; i < ln; i++) {
                slots[i].picker = this;
            }
        }

        return slots;
    },

    /**
     * Adds any new {@link #slots} to this picker, and removes existing {@link #slots}
     * @private
     */
    updateSlots: function (newSlots) {
        var bcss = Ext.baseCSSPrefix,
            innerItems;

        this.removeAll();

        if (newSlots) {
            this.add(newSlots);
        }

        innerItems = this.getInnerItems();
        if (innerItems.length > 0) {
            innerItems[0].addCls(bcss + 'first');
            innerItems[innerItems.length - 1].addCls(bcss + 'last');
        }

        this.updateUseTitles(this.getUseTitles());
    },

    /**
     * @private
     * Called when a slot has been picked.
     */
    onSlotPick: function (slot) {
        console.warn("onSlotPick", slot);
        
        this.fireEvent('pick', this, this.getValue(true), slot);
    },

    show: function () {
        if (this.getParent() === undefined) {
            Ext.Viewport.add(this);
        }

        this.callParent(arguments);

        if (!this.isHidden()) {
            this.setValue(this._value);
        }
    },

    /**
     * Sets the values of the pickers slots.
     * @param {Object} values The values in a {name:'value'} format.
     * @param {Boolean} animated `true` to animate setting the values.
     * @return {Ext.Picker} this This picker.
     */
    setValue: function (values, animated) {
        var me = this,
            slots = me.getInnerItems(),
            ln = slots.length,
            key, slot, loopSlot, i, value;

        if (!values) {
            values = {};
            for (i = 0; i < ln; i++) {
                //set the value to false so the slot will return null when getValue is called
                values[slots[i].config.name] = null;
            }
        }

        for (key in values) {
            if (values.hasOwnProperty(key)) {
                slot = null;
                value = values[key];
                for (i = 0; i < slots.length; i++) {
                    loopSlot = slots[i];
                    if (loopSlot.config.name === key) {
                        slot = loopSlot;
                        break;
                    }
                }

                if (slot) {
                    if (animated) {
                        slot.setValueAnimated(value);
                    } else {
                        slot.setValue(value);
                    }
                }
            }
        }

        me._values = me._value = values;

        return me;
    },

    setValueAnimated: function (values) {
        this.setValue(values, true);
    },

    /**
     * Returns the values of each of the pickers slots
     * @return {Object} The values of the pickers slots
     */
    getValue: function (useDom) {
        var values = {},
            items = this.getItems().items,
            ln = items.length,
            item, i;

        if (useDom) {
            for (i = 0; i < ln; i++) {
                item = items[i];
                if (item && item.isSlot) {
                    values[item.getName()] = item.getValue(useDom);
                }
            }

            this._values = values;
        }

        return this._values;
    },

    /**
     * Returns the values of each of the pickers slots.
     * @return {Object} The values of the pickers slots.
     */
    getValues: function () {
        return this.getValue();
    },

    destroy: function () {
        this.callParent();
        Ext.destroy(this.mask, this.bar);
    }
});
