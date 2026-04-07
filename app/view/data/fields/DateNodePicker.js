//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.view.data.fields.DateNodePicker', {
    extend: 'VIPSMobile.view.data.Detail',

    config: {
        items: [{
            xtype: 'fieldpicker',
            itemId: 'field',
            cls: 'form-picker',
            slots: [{
                name: 'day',
                title: 'Day',
                data: [{ text: '1', value: 1 }, { text: '2', value: 2 }, { text: '3', value: 3 }, { text: '4', value: 4 }, { text: '5', value: 5 }, { text: '6', value: 6 }, { text: '7', value: 7 }, { text: '8', value: 8 }, { text: '9', value: 9 }, { text: '10', value: 10 }, { text: '11', value: 11 }, { text: '12', value: 12 }, { text: '13', value: 13 }, { text: '14', value: 14 }, { text: '15', value: 15 }, { text: '16', value: 16 }, { text: '17', value: 17 }, { text: '18', value: 18 }, { text: '19', value: 19 }, { text: '20', value: 20 }, { text: '21', value: 21 }, { text: '22', value: 22 }, { text: '23', value: 23 }, { text: '24', value: 24 }, { text: '25', value: 25 }, { text: '26', value: 26 }, { text: '27', value: 27 }, { text: '28', value: 28 }, { text: '29', value: 29 }, { text: '30', value: 30 }, { text: '31', value: 31 }]
            }, {
                name: 'month',
                title: 'Month',
                data: [{ text: 'Jan', value: 1 }, { text: 'Feb', value: 2 }, { text: 'Mar', value: 3 }, { text: 'Apr', value: 4 }, { text: 'May', value: 5 }, { text: 'Jun', value: 6 }, { text: 'Jul', value: 7 }, { text: 'Aug', value: 8 }, { text: 'Sep', value: 9 }, { text: 'Oct', value: 10 }, { text: 'Nov', value: 11 }, { text: 'Dec', value: 12 }]
            }]
        }, {
            xtype: 'button',
            func: 'Action',
            ui: 'action',
            text: 'Done',
            docked: 'bottom',
            margin: '0.5em 0 0 0'
        }]
    },

    statics: {

        getTypedValue: function (value) {
            value = VIPSMobile.view.data.fields.DateNode.ConvertValueToDate(value);
            return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);
        },

        getFormattedValue: function (node) {
            var value = VIPSMobile.view.data.fields.DateNode.ConvertValueToDate(node.get('Value'));
            return Ext.Date.format(value, Ext.Date.patterns.LongDate);
        },

        ConvertValueToDate: function (value) {

            if (typeof value === "string") {
                if (Ext.isNumeric(value)) {
                    value = parseInt(value, 10);
                } else {
                    //switch (value.toUpperCase()) {
                    //    default:
                    value = new Date();
                    // zero out the time we dont need it
                    value = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0);
                    //break;
                    //}
                }
            }

            if (typeof value === "number") {
                value = Ext.Date.parseDate(value, DataFunc.DATE_FORMAT);
            }

            // Dates are "object" so make sure its a slot object 
            // by looking for year
            if (!value) {
                value = new Date();
            } else if (typeof value === "object" && value.year) {
                value = new Date(value.year, value.month - 1, value.day);
            }

            return value;

        },

        convertListOption: function (option) {
            return {
                value: parseInt(option.Field0, 10),
                text: option.Field1.toString()
            };
        }

    },

    initialize: function (node) {
        this.callParent(arguments);
        this.getField().on('pick', this.adjustSlotsForDate, this);
    },

    setup: function (controller, node) {
        var slots = [{
            name: 'day',
            title: 'Day',
            data: [{ text: '1', value: 1 }, { text: '2', value: 2 }, { text: '3', value: 3 }, { text: '4', value: 4 }, { text: '5', value: 5 }, { text: '6', value: 6 }, { text: '7', value: 7 }, { text: '8', value: 8 }, { text: '9', value: 9 }, { text: '10', value: 10 }, { text: '11', value: 11 }, { text: '12', value: 12 }, { text: '13', value: 13 }, { text: '14', value: 14 }, { text: '15', value: 15 }, { text: '16', value: 16 }, { text: '17', value: 17 }, { text: '18', value: 18 }, { text: '19', value: 19 }, { text: '20', value: 20 }, { text: '21', value: 21 }, { text: '22', value: 22 }, { text: '23', value: 23 }, { text: '24', value: 24 }, { text: '25', value: 25 }, { text: '26', value: 26 }, { text: '27', value: 27 }, { text: '28', value: 28 }, { text: '29', value: 29 }, { text: '30', value: 30 }, { text: '31', value: 31 }]
        }, {
            name: 'month',
            title: 'Month',
            data: [{ text: 'Jan', value: 1 }, { text: 'Feb', value: 2 }, { text: 'Mar', value: 3 }, { text: 'Apr', value: 4 }, { text: 'May', value: 5 }, { text: 'Jun', value: 6 }, { text: 'Jul', value: 7 }, { text: 'Aug', value: 8 }, { text: 'Sep', value: 9 }, { text: 'Oct', value: 10 }, { text: 'Nov', value: 11 }, { text: 'Dec', value: 12 }]
        }, {
            xtype: 'pickerslot',
            name: 'year',
            title: 'Meridian',
            data: this.getYearSlot(node)
        }];

        // call parent setup
        this.callParent(arguments);

        this.getField().updateSlots(slots);
        this.setValue(node.get("Value"));
    },

    getYearSlot: function (node) {
        var now = new Date();

        if (node.get("Options") && node.get("Options").length > 0) {
            return node.get("Options");
        }

        return [{
            text: (now.getFullYear() - 1).toString(),
            value: now.getFullYear() - 1
        }, {
            text: (now.getFullYear()).toString(),
            value: now.getFullYear()
        }, {
            text: (now.getFullYear() + 1).toString(),
            value: now.getFullYear() + 1
        }];

    },

    getValue: function () {
        var value;

        // convert picker object value to date
        value = this.getField().getValue();
        value = new Date(value.year, value.month - 1, value.day);

        return parseInt(Ext.Date.format(value, DataFunc.DATE_FORMAT), 10);

    },

    setValue: function (value) {

        // convert date to picker object value
        value = VIPSMobile.view.data.fields.DateNode.ConvertValueToDate(value);
        // the picker has the months starting from 1, the Date obj starts from 0
        value = { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };

        this.adjustSlotsForDate(this.getField(), value);

        this.getField().setValue(value);

    },

    adjustSlotsForDate: function (picker, value, slot) {
        var daySlotStore, intDaysInMonth, day;

        daySlotStore = this.getField().getAt(0).getStore();

        // 0th of next month is last day of this month so don't take the offset off here
        intDaysInMonth = new Date(value.year, value.month, 0).getDate();

        if (intDaysInMonth < value.day) {
            value.day = intDaysInMonth;
            this.setValue(value);
        }

        // remove any extra days
        while (daySlotStore.getCount() > intDaysInMonth) {
            try {
                daySlotStore.removeAt(daySlotStore.getCount() - 1);
            } catch (ignore) { }
        }

        // add any needed days
        while (daySlotStore.getCount() < intDaysInMonth) {
            try {
                day = daySlotStore.getCount() + 1;
                daySlotStore.add({
                    text: day.toString(),
                    value: day
                });
            } catch (ignore) { }
        }

    }

});
