//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.data.Model', {
    override: 'Ext.data.Model'
    //,

    ///**
    // * Sets the given field to the given value, marks the instance as dirty.
    // * @param {String/Object} fieldName The field to set, or an object containing key/value pairs.
    // * @param {Object} value The value to set.
    // */
    //set: function (fieldName, value) {
    //    var me = this,
    //        // We are using the fields map since it saves lots of function calls
    //        fieldMap = me.fields.map,
    //        modified = me.modified,
    //        notEditing = !me.editing,
    //        modifiedCount = 0,
    //        modifiedFieldNames = [],
    //        field, key, i, currentValue, ln, convert;

    //    if (!modified) {
    //        me.data[fieldName] = value;
    //    } else {

    //        /*
    //         * If we're passed an object, iterate over that object. NOTE: we pull out fields with a convert function and
    //         * set those last so that all other possible data is set before the convert function is called
    //         */
    //        if (arguments.length == 1) {
    //            for (key in fieldName) {
    //                if (fieldName.hasOwnProperty(key)) {
    //                    //here we check for the custom convert function. Note that if a field doesn't have a convert function,
    //                    //we default it to its type's convert function, so we have to check that here. This feels rather dirty.
    //                    field = fieldMap[key];
    //                    if (field && field.hasCustomConvert()) {
    //                        modifiedFieldNames.push(key);
    //                        continue;
    //                    }

    //                    if (!modifiedCount && notEditing) {
    //                        me.beginEdit();
    //                    }
    //                    ++modifiedCount;
    //                    me.set(key, fieldName[key]);
    //                }
    //            }

    //            ln = modifiedFieldNames.length;
    //            if (ln) {
    //                if (!modifiedCount && notEditing) {
    //                    me.beginEdit();
    //                }
    //                modifiedCount += ln;
    //                for (i = 0; i < ln; i++) {
    //                    field = modifiedFieldNames[i];
    //                    me.set(field, fieldName[field]);
    //                }
    //            }

    //            if (notEditing && modifiedCount) {
    //                me.endEdit(false, modifiedFieldNames);
    //            }
    //        } else {
    //            field = fieldMap[fieldName];
    //            convert = field && field.getConvert();
    //            if (convert) {
    //                value = convert.call(field, value, me);
    //            }

    //            currentValue = me.data[fieldName];
    //            me.data[fieldName] = value;

    //            if (field && !me.isEqual(currentValue, value)) {
    //                if (modified.hasOwnProperty(fieldName)) {
    //                    if (me.isEqual(modified[fieldName], value)) {
    //                        // the original value in me.modified equals the new value, so the
    //                        // field is no longer modified
    //                        delete modified[fieldName];
    //                        // we might have removed the last modified field, so check to see if
    //                        // there are any modified fields remaining and correct me.dirty:
    //                        me.dirty = false;
    //                        for (key in modified) {
    //                            if (modified.hasOwnProperty(key)) {
    //                                me.dirty = true;
    //                                break;
    //                            }
    //                        }
    //                    }
    //                } else {
    //                    me.dirty = true;
    //                    // We only go one level back?
    //                    modified[fieldName] = currentValue;
    //                }
    //            }

    //            if (notEditing) {
    //                me.afterEdit([fieldName], modified);
    //            }
    //        }
    //    }
    //}

});
