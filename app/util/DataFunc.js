//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.DataFunc', {
    alternateClassName: ['DataFunc'],
    singleton: true,

    DATE_FORMAT: 'YmdHis',

    requires: ['VIPSMobile.Conn', 'VIPSMobile.Version', 'VIPSMobile.Cart', 'VIPSMobile.util.Yardstick'],

    config: {
        lastDatabaseOpen: null
    },

    constructor: function (config) {

        this.initConfig(config);
        if (window.openDatabase && window.openDatabase(VIPSMobile.Version.getDbName())) {
            try {
                VIPSMobile.Conn = window.openDatabase(VIPSMobile.Version.getDbName(), "", "VIPSMobile Database", 49 * 1024 * 1024);
            } catch (ex) {
                document.write("No Main Database can not use app " + ex.message);
                document.write('you might be in private browsing mode <a href="HowTo.html">help to get out of private browsing</a>');
                throw "No Main Database can not use app " + ex.message;
            }
        } else {
            if (SQLiteConn) {
                VIPSMobile.Conn = { ...SQLiteConn, SQLite3: true };
            }
        }
        this.setLastDatabaseOpen(new Date().getTime() + (1000 * 1)); // Now + 1 Second

        window.debugSQL = function (sql) {
            var startTime = performance.now();

            DataFunc.executeSQLite3SQL({
                sql: sql,
                success: function (a, b, c) {
                    console.table(b.rows._rows)
                    var endTime = performance.now();
                    console.log("debugSQL took: " + (endTime - startTime), sql);

                }
            })
        }

    },
    CloneNodeRow: function (vNodeRow) {
        var objNew = null;

        if (vNodeRow) {

            objNew = {};

            Ext.iterate(vNodeRow, function (key, value, obj) {

                if (key === 'Children') {
                    objNew[key] = [];
                } else if (key === 'nextNode') {
                    objNew[key] = null;
                } else {
                    objNew[key] = value;
                }

            });

        }

        return objNew;

    },
    PrepareQuery: function (vRowNode, vQuery, vLeaveUnset, vLeaveFields) {
        var i, strSQL, lstReplace, matchFn;

        strSQL = vQuery;

        if (strSQL) {

            // replace tsql functions
            strSQL = strSQL.replace(/\.dbo\./gi, "dbo"); // remove the .dbo. between table names
            strSQL = strSQL.replace(/isnull\(/gi, "ifnull(");
            strSQL = strSQL.replace(/\+\+/gi, "||");

            // recurse to try to replace all tags if node passed in
            if (strSQL.indexOf("[") >= 0 && vRowNode) {
                strSQL = this.ReplaceValueTags(vRowNode, strSQL, vLeaveUnset, vLeaveFields);
            }

            // replace and eval functions not in sql lite (order matters since should really recurse to handle functions in functions)
            lstReplace = [
                /getdate\(/gi,
                /varchar\(/gi,
                /datediff\(/gi,
                /datepart\(/gi,
                /convert\(/gi,
                /newid\(/gi,
                /regexp\(/gi
            ];

            // JSLindt moved
            matchFn = function (match) {
                strSQL = this.replaceFunction(strSQL, match);
            };

            for (i = 0; i < lstReplace.length; i++) {
                Ext.iterate(strSQL.match(lstReplace[i]), matchFn, this);
            }

            // name returned fields so can access via query order
            if (!vLeaveFields) {
                strSQL = this.PrepareSQLFields(strSQL);
            }

            // add the query to the node's prepared queries
            if (vRowNode) {
                if (!vRowNode.PreparedQuerys) {
                    vRowNode.PreparedQuerys = [];
                }
                if (strSQL && strSQL.replaceAll) {
                    vRowNode.PreparedQuerys.push(strSQL.replaceAll(/[\r\n]+/g, " "));
                } else {
                    vRowNode.PreparedQuerys.push(strSQL);
                }
            }

        }
        return strSQL;

    },

    replaceFunction: function (strSQL, match) {
        var strMatch, count, i, endPos;

        // get the matched string
        strMatch = strSQL.substring(strSQL.lastIndexOf(match));

        // used to check if in quotes for matching last ) of function
        count = {
            ")": 0,
            '"': 0,
            "'": 0
        };

        // find the last matching )
        for (i = 0; i < strMatch.length; i++) {

            if (strMatch[i] === '"') {
                if (count['"'] === 0) {
                    count['"']++;
                } else {
                    count['"']--;
                }
            }
            if (strMatch[i] === "'") {
                if (count["'"] === 0) { count["'"]++; } else { count["'"]--; }
            }

            if (count['"'] === 0 && count["'"] === 0) {

                if (strMatch[i] === "(") { count[")"]++; }

                if (strMatch[i] === ")") {

                    count[")"]--;

                    if (count[")"] === 0) {
                        endPos = i;
                        i = strMatch.length;
                    }

                }

            }

        }

        // adjust the match for correct bracketing
        strMatch = strMatch.substring(0, endPos + 1);

        try {
            strSQL = strSQL.replace(strMatch, eval('(DataFunc.' + strMatch.toLowerCase() + ')'));
        } catch (ex) {
            console.log('error running function: ', strMatch);
        }

        return strSQL;

    },

    PrepareSQLFields: function (vSQL) {
        var intPos, intBraces, blnInQuotes, strField, strFields, strSQL, i;

        vSQL = vSQL.trim();
        intBraces = 0;
        strFields = [];
        strField = '';
        blnInQuotes = false;

        if (vSQL.toLowerCase().indexOf('select') === 0) {
            intPos = vSQL.indexOf(' ');
        } else {
            intPos = 0;
        }

        while (intPos < vSQL.length + 1) {

            // check for braces

            if (vSQL.substring(intPos, intPos + 1) === "(") {
                intBraces++;
            } else if (vSQL.substring(intPos, intPos + 1) === ")") {
                intBraces--;
            }

            // check for quotes
            if (vSQL.substring(intPos, intPos + 1) === "'") {
                blnInQuotes = !blnInQuotes;
            }

            // from, comma or end
            if ((!blnInQuotes && intBraces === 0 && (vSQL.substring(intPos, intPos + 5).toLowerCase() === ' from' || vSQL.substring(intPos, intPos + 6).toLowerCase() === ' where' || vSQL.substring(intPos, intPos + 6).toLowerCase() === ' union' || vSQL.substring(intPos, intPos + 1) === ',')) || intPos === vSQL.length) {

                strFields.push(strField);
                strField = '';

                if (!blnInQuotes && intBraces === 0 && (vSQL.substring(intPos, intPos + 5).toLowerCase() === ' from' || vSQL.substring(intPos, intPos + 6).toLowerCase() === ' where' || vSQL.substring(intPos, intPos + 6).toLowerCase() === ' union')) {
                    break;
                }

            } else {

                strField += vSQL.substring(intPos, intPos + 1);

            }

            intPos++;

        }

        strSQL = 'SELECT ';

        for (i = 0; i < strFields.length; i++) {

            strFields[i] = strFields[i].trim();
            if (strFields[i] !== '*') {
                strFields[i] = strFields[i].replace(/as \w+$/i, '');
                if (i > 0) { strSQL += ','; }
                strSQL += strFields[i] + ' AS Field' + i + ' ';
            } else {
                strSQL += strFields[i] + ' ';
            }
        }

        strSQL += vSQL.substring(intPos);

        return strSQL;

    },

    // replace all the sum value tags
    ReplaceSumTags: function (vRowNode, vQuery) {
        var strSQL, field, ndeSibling;

        strSQL = vQuery || '';

        // find the first node
        ndeSibling = vRowNode;
        while ((ndeSibling.getPrevNode && ndeSibling.getPrevNode())
            || (ndeSibling.getParentNode && ndeSibling.getParentNode() && !ndeSibling.get('IsPrimaryKeyForThisTableOnly'))) {

            ndeSibling = ndeSibling.getParentNode() || ndeSibling.getPrevNode();
        }

        // loop through all the sum tags
        Ext.iterate(strSQL.match(/\[!\w+\]/gi), function (key, value, obj) {

            // get the field name
            field = key.substring(2);
            field = field.substring(0, field.length - 1);
            value = DataFunc.SumFieldValues(field, ndeSibling);

            // update the SQL with the value
            strSQL = strSQL.replace(new RegExp('\\[!' + field + '\\]', 'gi'), "'" + value + "'");

        });

        return strSQL;

    },

    SumFieldValues: function (vField, node) {
        var intTotal = 0, i;

        if (node.get('FieldToStoreValue') === vField && node.get('Value')) {
            intTotal = parseFloat(node.get('Value'));
        }

        for (i = 0; i < node.getChildNodes().length; i++) {
            intTotal += DataFunc.SumFieldValues(vField, node.getChildNodes()[i]);
        }

        if (node.getNextNode()) {
            intTotal += DataFunc.SumFieldValues(vField, node.getNextNode());
        }

        return intTotal;

    },

    defaultValueTags: function () {

        // get the current location
        var loc = VIPSMobile.Main.getLocation() || {};

        return [{
            key: "CurLat", value: loc.latitude || 0
        }, {
            key: "CurLoc", value: loc.latitude + ' ' + loc.longitude || ''
        }, {
            key: "CurLong", value: loc.longitude || 0
        }, {
            key: "HaveLocation", value: (loc.latitude !== 0 && loc.longitude !== 0)
        }, {
            key: "Mailbox", value: VIPSMobile.User.getMailbox()            
        }, {
            key: "VersionElement", value: VIPSMobile.Version.getElement()
        }, {
            key: "VersionNumber", value: VIPSMobile.Version.getNumber()
        }, {
            key: "CartCount", value: VIPSMobile.Cart.CartCount
        }, {
            key: "CartProducts", value: VIPSMobile.Cart.CartProducts
        }, {
            key: "CartItems", value: VIPSMobile.Cart.CartItems
        }, {
            key: "CartTotalPrice", value: VIPSMobile.Cart.CartTotalPrice
        }, {
            key: "NodeAnsweredStatus", fn: function (node) {
                return node.get("Answered");
            }
        }]
    },

    // recursively replace all tags
    ReplaceValueTags: function (vRowNode, vQuery, vLeaveUnset) {
        var strSQL, ndeCurrent, strValue, defaults;

        strSQL = this.ReplaceSumTags(vRowNode, vQuery);

        // replace default tags
        defaults = this.defaultValueTags();

        for (i = 0; i < defaults.length; i += 1) {
            if (defaults[i].fn !== undefined && vRowNode && vRowNode.get) {
                strValue = defaults[i].fn(vRowNode);
            } else {
                strValue = defaults[i].value;
            }
            strSQL = strSQL.replace(new RegExp('\\[' + defaults[i].key + '\\]', 'gi'), strValue);
        }

        // replace tags from previous node field values
        ndeCurrent = vRowNode;
        while (ndeCurrent) {

            // replace any tags for this node, if value is set
            if (ndeCurrent.isAnswered && ndeCurrent.isAnswered()) {

                if (ndeCurrent.get('NodeTypeDesc') === 'TextNode' || ndeCurrent.get('NodeTypeDesc') === 'MultiLineTextNode') {
                    strValue = ndeCurrent.get('Value').toString();
                    strValue = strValue.replace(new RegExp("'", "gi"), "''");
                    strValue = strValue.replace(new RegExp(String.fromCharCode(8216), "gi"), "''");
                    strValue = strValue.replace(new RegExp(String.fromCharCode(8217), "gi"), "''");
                    strValue = "'" + strValue + "'";
                } else {
                    strValue = ndeCurrent.get('Value');
                }

            } else {

                strValue = 'null';

            }

            if (strValue !== 'null' || !vLeaveUnset) {
                strSQL = strSQL.replace(new RegExp('\\[' + ndeCurrent.get('FieldToStoreValue') + '\\]', 'gi'), strValue);
            }

            // check previous nodes
            if (ndeCurrent.getParentNode && ndeCurrent.getParentNode()) {
                ndeCurrent = ndeCurrent.getParentNode();
            } else if (ndeCurrent.getPrevNode) {
                ndeCurrent = ndeCurrent.getPrevNode();
            } else {
                ndeCurrent = null;
            }

        }

        return strSQL;

    },

    SetUserValue: function (vNodeRow, vValue) {

        // if date format to int format;
        if (Ext.isDate(vValue)) {

            vValue = Ext.Date.format(vValue, DataFunc.DATE_FORMAT);

            switch (vNodeRow.NodeTypeDesc) {
                case "HiddenInternalDateNode":
                case "DateNode":
                    vValue = parseInt(vValue.substring(0, 8) + "000000", 10);
                    break;

                case "TimeNode":
                    vValue = parseInt("19000101" + vValue.substring(8), 10);
                    break;

                default:
                    vValue = parseInt(vValue, 10);
                    break;
            }
        }

    },

    GetScalarValue: function (vResults) {
        var objReturn = null;

        if (vResults && vResults.rows.length > 0) {

            if (vResults.rows.item(0).Field0) {
                objReturn = vResults.rows.item(0).Field0;
            } else {
                Ext.iterate(vResults.rows.item(0), function (key, value) {
                    objReturn = value;
                });
            }

        }

        return objReturn;

    },

    GetResultsArray: function (vResults, vField) {
        var objReturn, i;

        objReturn = [];

        for (i = 0; i < vResults.rows.length; i++) {

            if (vField) {
                objReturn.push(vResults.rows.item(i)[vField]);
            } else {
                objReturn.push(vResults.rows.item(i));
            }

        }

        return objReturn;

    },

    // tsql functions for 'eval'ing strings
    datediff: function (vDatePart, vDate1, vDate2) {
        var dblDiff;

        // lowercase the date part
        vDatePart = vDatePart.toLowerCase();

        // convert the dates if need be
        if (!Ext.isDate(vDate1)) { vDate1 = Ext.Date.parseDate(vDate1, DataFunc.DATE_FORMAT); }
        if (!Ext.isDate(vDate2)) { vDate2 = Ext.Date.parseDate(vDate2, DataFunc.DATE_FORMAT); }

        // convert difference checking for datepart as go
        dblDiff = vDate2 - vDate1;  // ms
        if (vDatePart === 'ms') { return dblDiff; }
        dblDiff /= 1000;            // seconds
        if (vDatePart === 's' || vDatePart === 'ss') { return dblDiff; }
        dblDiff /= 60;              // minutes
        if (vDatePart === 'mi' || vDatePart === 'n') { return dblDiff; }
        dblDiff /= 60;              // hours
        if (vDatePart === 'h') { return dblDiff; }
        dblDiff /= 24;              // days
        if (vDatePart === 'dd') { return dblDiff; }

        // unreckognized datepart
        console.error('Unknown datepart' + vDatePart);
        return 0;

    },

    datepart: function (interval, date) {
        var strReturn;

        date = Ext.Date.parseDate(date, DataFunc.DATE_FORMAT);

        switch (interval.toLowerCase()) {
            case 'day': strReturn = date.getDate(); break;
            case 'dayofyear': strReturn = date.getDayOfYear(); break;
            case 'hour':
                strReturn = (date.getHours() > 12) ? date.getHours() - 12 : date.getHours();
                strReturn = (strReturn === 0) ? 12 : strReturn;
                strReturn = this.lpad(strReturn, 2);
                break;
            case 'minute': strReturn = this.lpad(date.getMinutes(), 2); break;
            case 'month': strReturn = date.getMonth() + 1; break;
            case 'meridian': strReturn = (date.getHours() >= 12) ? 'PM' : 'AM'; break;
            case 'second': strReturn = this.lpad(date.getSeconds(), 2); break;
            case 'week': strReturn = date.getWeekOfYear(); break;
            case 'weekday': strReturn = date.getDay() + 1; break;
            case 'year': strReturn = date.getFullYear(); break;
            default: throw new Error('unknown interval');
        }

        return strReturn;

    },

    getRange: function (min, max, step) {
        var objReturn = [], i, strText;

        for (i = min; i <= max; i += step) {
            strText = i;
            if (i < 10) { strText = "0" + i.toString(); }
            objReturn.push({ text: strText, value: i });
        }

        return objReturn;

    },

    newid: function () {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    },


    getdate: function () {
        return parseInt(Ext.Date.format(new Date(), DataFunc.DATE_FORMAT), 10);
    },

    getUTCdate: function () {
        var tmpDate = new Date();
        return parseInt(Ext.Date.format(new Date(tmpDate.getUTCFullYear(), tmpDate.getUTCMonth(), tmpDate.getUTCDate(), tmpDate.getUTCHours(), tmpDate.getUTCMinutes(), tmpDate.getUTCSeconds()), DataFunc.DATE_FORMAT), 10);
    },

    convert: function (vType, strToConvert, vStyle) {
        var strType, intLength, objReturn;

        if (vType.indexOf('-') > 0) {
            strType = vType.substring(0, vType.indexOf('-'));
            intLength = vType.substring(strType.length + 1);
        } else {
            strType = vType;
            intLength = 0;
        }

        switch (strType.toLowerCase()) {
            case 'bigint':
            case 'int':
                objReturn = parseInt(strToConvert, 10);
                break;
            case 'varchar':
                if (strToConvert.length >= intLength) {
                    objReturn = strToConvert.substring(0, intLength);
                } else {
                    objReturn = strToConvert;
                }
                objReturn = "'" + objReturn + "'";
                break;
            default:
                objReturn = strToConvert;
                break;
        }

        return objReturn;

    },

    lpad: function (vString, length) {

        vString = vString.toString();
        while (vString.length < length) {
            vString = '0' + vString;
        }

        return vString;

    },

    regexp: function (vValue, vRegex) {

        console.log('regexp', vValue, vRegex);

        var reg = new RegExp(vRegex);
        return reg.test(vValue) ? 1 : 0;
    },

    DropAllTables: function (vCallback, scope) {
        DataFunc.pDropAllTables(vCallback, scope, ['MessageQueue']);
    },
    pDropAllTables: function (vCallback, scope, keepTables) {
        var strSQL, strDropSQLs;

        // get all the tables to keep
        if (keepTables === undefined) { keepTables = []; }
        keepTables.push('sqlite_sequence');
        keepTables = "'" + keepTables.join("','") + "'";

        // set the sql
        strSQL = "SELECT tbl_name as tbl_name FROM SQLITE_MASTER WHERE tbl_name not like '/_%' ESCAPE '/' AND tbl_name NOT IN (" +
            keepTables + ") AND Type='table'";

        // get all the tables to drop.  need to keep sqlite_sequence and message queue
        DataFunc.executeSQL({
            sql: strSQL,
            scope: this,
            success: function (tx, results) {

                if (results.rows.length > 0) {

                    // build all the drop statements from table names
                    strDropSQLs = [];
                    Ext.iterate(DataFunc.GetResultsArray(results, 'tbl_name'), function (tblName) {
                        strDropSQLs.push('DROP TABLE IF EXISTS ' + tblName);
                    });

                    this.executeMany({
                        statements: strDropSQLs,
                        scope: this,
                        callback: function () {

                            VIPSMobile.SQLTables.clear();

                            if (vCallback) { vCallback.apply(scope || this); }

                        }
                    });

                } else {

                    if (vCallback) { vCallback.apply(scope || this); }

                }

            }
        });

    },

    CHAR: function (v) {
        return "'varchar-" + v + "'";
    },

    varchar: function (v) {
        return "'varchar-" + v + "'";
    },

    // Execute a series of statements and doesn't run call back until all have executed
    executeSQLPluginMany: function (args) {
        var intIndex, i, loopFn;

        intIndex = 0;
        if (args.statements.length > 0) {
            for (i = 0; i < args.statements.length; i++) {

                // convert the statement to an object if needed
                if (!Ext.isObject(args.statements[i])) {
                    args.statements[i] = {
                        sql: args.statements[i],
                        params: []
                    };
                }

                // warn for now of values instead of params
                if (args.statements[i].values) {
                    console.log('WARNING--- executeMany changed to used params to be consistent with executeSQL', args.statements[i].sql);
                }

                // if params set and not an array, make it an array
                if (args.statements[i].params && !Ext.isArray(args.statements[i].params)) {
                    args.statements[i].params = [args.statements[i].params];
                }
            }

            SQLPlugin.executeMany(JSON.stringify(args.statements)).then(function (response) {
                if (response.success) {
                    for (i = 0; i < response.statements.length; i++) {
                        var statement = response.statements[i];
                        var tmpRows = statement.results ? statement.results[0] : [];
                        var tmpResults = {
                            rows: {
                                insertId: statement.results ? statement.results[1] : 0,
                                _rows: tmpRows,
                                length: tmpRows.length,
                                item: function (index) {
                                    return this._rows[index];
                                },
                                rowsAffected: statement.results ? statement.results[2] : 0
                            }
                        };
                        response.statements[i].results = tmpResults;
                    }

                    if (args.callback) {
                        args.callback.apply(args.scope || this, [response.statements]);
                    }
                }
            }, response => {
                var ex = response.error;
                DataFunc.SQLError(ex, args.statements[intIndex]);
            });
        } else {
            // nothing to do just run the call back
            if (args.callback) {
                args.callback.apply(args.scope || this, [args.statements]);
            }
        }
    },

    // sql, params, success, failure, scope
    executeSQLPluginSQL: function (args) {

        // check for required settings
        if (!args.sql) { throw new Error('need to set sql'); }
        if (args.params && !Ext.isArray(args.params)) { args.params = [args.params]; }

        var tx = {};

        SQLPlugin.executeSql(JSON.stringify({ sql: args.sql, params: args.params || [] })).then(response => {
            if (response.success) {
                var tmpRows = response.data ? response.data[0] : [];
                if (tmpRows)
                    var results = {
                        insertId: response.data ? response.data[1] : 0,
                        rows: {
                            _rows: tmpRows,
                            length: tmpRows.length,
                            item: function (index) {
                                return this._rows[index];
                            }
                        },
                        rowsAffected: response.data ? response.data[2] : 0
                    };

                if (args.success) {
                    args.success.apply(args.scope || this, [tx, results, args]);
                }
            }
        }, response => {
            var ex = response.error;
            // call sql error function to notify us of any errors
            DataFunc.SQLError(ex, args);

            // call the error call back if set
            if (args.failure) {
                args.failure.apply(args.scope || this, [ex, args]);
            }

        });
    },

    executeSQLite3Many: function (args) {
        //console.log("executeSQLite3Many", args);
        var intIndex = 0,
            localStatements = [];

        if (args.statements.length === 0) {
            if (args.callback) {
                args.callback.apply(args.scope || this, [args.statements]);
            }
        }

        // prepare the statments, make sure they are all objects with param arrays
        for (var i = 0; i < args.statements.length; i++) {
            if (!Ext.isObject(args.statements[i])) {
                args.statements[i] = {
                    sql: args.statements[i],
                    params: []
                };
            }
            // if params set and not an array, make it an array
            if (args.statements[i].params && !Ext.isArray(args.statements[i].params)) {
                args.statements[i].params = [args.statements[i].params];
            }
        }

        // consolodate the statements, combine inserts if the next statment is the same as the current then change the curent to be multi-paramed
        while (args.statements.length > 0) {
            var firstStatement = args.statements.shift(),
                secondStatement,
                currStatement = {
                    sql: firstStatement.sql,
                    params: firstStatement.params,
                    isMulti: false,
                    results: {
                        insertId: null
                        , rows: {
                            _rows: [],
                            length: 0,
                            item: function (index) {
                                return this._rows[index];
                            }
                        },
                        rowsAffected: 0
                    }
                };

            while (args.statements[0] && firstStatement.sql === args.statements[0].sql && currStatement.params && currStatement.params.length < 30000) {
                secondStatement = args.statements.shift()
                if (!currStatement.isMulti) {
                    currStatement.isMulti = true;
                }
                currStatement.sql += ',(' + secondStatement.params.map(() => '?').join(',') + ')';
                currStatement.params = currStatement.params.concat(secondStatement.params);
            }

            localStatements.push(currStatement);

        }

        for (var i = 0; i < localStatements.length; i++) {

            var startTime = performance.now();
            var ColumnNames = [];
            try {
                VIPSMobile.Conn.promise('exec', {
                    dbId: VIPSMobile.Conn.dbId,
                    sql: localStatements[i].sql,
                    rowMode: 'array',
                    columnNames: ColumnNames,
                    bind: localStatements[i].params || [],
                    callback: (result) => {
                        if (result.row) {
                            var obj = {};
                            for (var i = 0; i < result.columnNames.length; i++) {
                                obj[result.columnNames[i]] = result.row[i];
                            }
                            localStatements[intIndex].results.rows._rows.push(obj);
                            localStatements[intIndex].results.rows.length = localStatements[intIndex].results.rows._rows.length;
                        } else {
                            var endTime = performance.now();
                            if (endTime - startTime > 100) {
                                console.debug("executeSQLite3Many long query: |" + (endTime - startTime), '|"' + localStatements[intIndex].sql + '"');
                            }

                            intIndex++;
                            if (intIndex === localStatements.length) {
                                //console.log("executeSQLite3Many callback last", localStatements, i, intIndex);
                                if (args.callback) {
                                    args.callback.apply(args.scope || this, [localStatements]);
                                }
                            }
                        }
                    },
                }).catch((e) => {
                    this.SQLError(e.result, args);
                });
            } catch (sqlex) {
                this.SQLError(sqlex.result, args);
            }
        }
    },

    executeSQLite3SQL: function (args) {
        //console.log("executeSQLite3SQL", args);
        // check for required settings
        var startTime = performance.now();


        if (!args.sql) { throw new Error('need to set sql'); }
        if (args.params && !Ext.isArray(args.params)) { args.params = [args.params]; }

        var results = {
            insertId: null
            , rows: {
                _rows: [],
                length: 0,
                item: function (index) {
                    return this._rows[index];
                }
            },
            rowsAffected: 0
        };

        try {
            var ColumnNames = [];
            VIPSMobile.Conn.promise('exec', {
                dbId: VIPSMobile.Conn.dbId,
                sql: args.sql,
                rowMode: 'array',
                columnNames: ColumnNames,
                bind: args.params || [],
                callback: (result) => {
                    if (!result.row) {
                        return;
                    }
                    //console.log('executeSQLite3SQL result', args.sql, result.row, result.columnNames);
                    if (result.columnNames.indexOf('last_insert_rowid()') === 0 && result.row[0] !== undefined) {
                        results.insertId = result.row[0]
                        //console.log('last_insert_rowid()', result.row[0]);
                    } else {
                        var obj = {};
                        for (var i = 0; i < result.columnNames.length; i++) {
                            obj[result.columnNames[i]] = result.row[i];
                        }
                        results.rows._rows.push(obj);
                        results.rows.length = results.rows._rows.length;
                    }
                },
            }).then(() => {
                var endTime = performance.now();
                if (endTime - startTime > 100) {
                    console.debug("executeSQLite3SQL long query: | " + (endTime - startTime), '|"' + args.sql + '"');
                }

                //console.log("executeSQLite3SQL then", arguments);
                if (args.success) {
                    args.success.apply(args.scope || this, [{}, results, args]);
                }
            }).catch((e) => {
                if (e && e.result) {
                    this.SQLError(e.result, args);
                }

                if (args.failure) {
                    args.failure.apply(args.scope || this, [e, args]);
                }

            });
        } catch (sqlex) {
            this.SQLError(sqlex.result, args);
        }

    },

    executeMany: function (args) {
        if (VIPSMobile.Conn.SQLPlugin) {
            this.executeSQLPluginMany(args);
        } else if (VIPSMobile.Conn.SQLite3) {
            if (!VIPSMobile.Conn.dbId) {
                setTimeout(function () {
                    console.log('Waiting for SQLite3');
                    DataFunc.executeMany(args);
                }, 2000);
            } else {
                this.executeSQLite3Many(args);
            }
        } else {
            var intIndex, i, loopFn, me = this;

            intIndex = 0;
            if (iOSversion()[0] >= 13 && this.getLastDatabaseOpen() < (new Date).getTime()) {
                try {
                    VIPSMobile.Conn = window.openDatabase(VIPSMobile.Version.getDbName(), '', 'VIPSMobile Database', 49 * 1024 * 1024);
                    this.setLastDatabaseOpen((new Date).getTime() + 1000 * 1);
                } catch (ex) {
                    window.localation.reload();
                }
            }
            VIPSMobile.Conn.transaction(
                function (tx) {
                    loopFn = function (tx, results) {

                        args.statements[intIndex].results = results;
                        me.setLastDatabaseOpen(new Date().getTime() + (1000 * 1)); // Now + 1 Second             
                        intIndex++;

                    };
                    for (i = 0; i < args.statements.length; i++) {

                        // convert the statement to an object if needed
                        if (!Ext.isObject(args.statements[i])) {
                            args.statements[i] = {
                                sql: args.statements[i],
                                params: []
                            };
                        }

                        // warn for now of values instead of params
                        if (args.statements[i].values) {
                            console.log('WARNING--- executeMany changed to used params to be consistent with executeSQL', args.statements[i].sql);
                        }

                        // if params set and not an array, make it an array
                        if (args.statements[i].params && !Ext.isArray(args.statements[i].params)) {
                            args.statements[i].params = [args.statements[i].params];
                        }

                        tx.executeSql(args.statements[i].sql, args.statements[i].params, loopFn);

                    }
                },
                function (ex) {
                    DataFunc.SQLError(ex, args.statements[intIndex]);
                },
                function () {
                    if (args.callback) {
                        args.callback.apply(args.scope || this, [args.statements]);
                    }
                }
            );
        }
    },

    // sql, params, success, failure, scope
    executeSQL: function (args) {
        var me = this;

        if (VIPSMobile.Conn.SQLPlugin) {
            this.executeSQLPluginSQL(args);
        } else if (VIPSMobile.Conn.SQLite3) {
            if (!VIPSMobile.Conn.dbId) {
                setTimeout(function () {
                    console.log('Waiting for SQLite3');
                    DataFunc.executeSQL(args);
                }, 2000);
            } else {
                this.executeSQLite3SQL(args);
            }
        } else {
            // check for required settings
            if (!args.sql) { throw new Error('need to set sql'); }
            if (args.params && !Ext.isArray(args.params)) { args.params = [args.params]; }
            if (iOSversion()[0] >= 13 && this.getLastDatabaseOpen() < (new Date).getTime()) {
                try {
                    VIPSMobile.Conn = window.openDatabase(VIPSMobile.Version.getDbName(), '', 'VIPSMobile Database', 49 * 1024 * 1024);
                    this.setLastDatabaseOpen((new Date).getTime() + 1000 * 1);
                } catch (ex) {
                    window.localation.reload();
                }
            }
            VIPSMobile.Conn.transaction(function (tx) {

                tx.executeSql(args.sql, args.params || [], function (tx, results) {
                    if (args.success) {
                        args.success.apply(args.scope || this, [tx, results, args]);
                    }
                    me.setLastDatabaseOpen(new Date().getTime() + (1000 * 1)); // Now + 1 Second             
                }, function (tx, ex) {

                    // call sql error function to notify us of any errors
                    DataFunc.SQLError(ex, args);

                    // call the error call back if set
                    if (args.failure) {
                        args.failure.apply(args.scope || this, [ex, args]);
                    }

                });

            });
        }
    },

    SQLError: function (ex, args) {
        if (args && args.params) {
            console.error(ex.message, args.sql, args.params.join(','));
        } else if (args && args.sql) {
            console.error(ex.message, args.sql);
        } else {
            console.error(ex.message);
            Ext.Msg.confirm('Critical Error: System Unrecoverable', 'An unexpected critical failure has occurred and the system is no longer able to continue safely. <br/>Immediate reset is required.<br/>If the issue persists, contact support with error code: ' + ex.message, function (btn) {
                if (btn === 'yes') {
                    //VIPSMobile.Main.setMask(this, 'Reseting...');
                    localStorage.clear();
                    window.location.reload(true);
                }
            }, this);
        }
    },

    ExecuteDelayedCallback: function (vCallBackFn, vParams, vScope) {

        if (!vScope) { vScope = this; }

        if (vCallBackFn && typeof vCallBackFn === "object") {

            vCallBackFn.delay--;

            if (vCallBackFn.delay < 1) {
                vCallBackFn.fn.apply(vScope, vParams);
            }

        } else {
            if (vCallBackFn) { vCallBackFn.apply(vScope, vParams); }
        }

    },

    upsert: function (vTableName, vKeys, vValues, vCallback) {
        var objSQL;

        objSQL = this.getSelectSQL(vTableName, vKeys);

        // check if the record already exists
        DataFunc.executeSQL({
            sql: objSQL.sql,
            params: objSQL.params,
            scope: this,
            success: function (tx, results) {

                // check if record found
                if (results.rows.length > 0) {
                    objSQL = this.getUpdateSQL(vTableName, vKeys, vValues);
                } else {
                    objSQL = this.getInsertSQL(vTableName, vKeys, vValues);
                }

                //console.log('upsert', objSQL);

                // update the db
                DataFunc.executeSQL({
                    sql: objSQL.sql,
                    params: objSQL.params,
                    scope: this,
                    success: vCallback
                });

            }
        });

    },

    getSelectSQL: function (vTableName, vKeys) {
        var strFields, objParams, strSQL;

        strFields = [];
        objParams = [];

        strSQL = 'SELECT * FROM ' + vTableName + ' WHERE ';

        this.setFieldsValues(vKeys, strFields, objParams, true);

        strSQL += strFields.join(' AND ');

        return { sql: strSQL, params: objParams };

    },

    getInsertSQL: function (vTableName, vKeys, vValues) {
        var strFields, objParams, strSQL, i;

        strFields = [];
        objParams = [];

        // insert
        strSQL = 'INSERT OR REPLACE INTO ' + vTableName + ' (';

        this.setFieldsValues(vKeys, strFields, objParams);
        this.setFieldsValues(vValues, strFields, objParams);

        strSQL += strFields.join(', ') + ') VALUES (';

        for (i = 0; i < strFields.length; i++) {
            if (i > 0) { strSQL += ','; }
            strSQL += '?';
        }

        strSQL += ')';

        return { sql: strSQL, params: objParams };

    },

    getUpdateSQL: function (vTableName, vKeys, vValues) {
        var strFields, objParams, strSQL;

        objParams = [];

        // update
        strSQL = 'UPDATE ' + vTableName + ' SET ';

        strFields = [];
        this.setFieldsValues(vValues, strFields, objParams, true);

        strSQL += strFields.join(', ') + ' WHERE ';

        strFields = [];
        this.setFieldsValues(vKeys, strFields, objParams, true);

        strSQL += strFields.join(' AND ');

        return { sql: strSQL, params: objParams };

    },

    // calculate the distance (km) between two lat/long points (needs to be lower case for sql statements since we lowercase all function names)
    CalculateDistance: function (point1, point2, lat2, long2) {

        // can call with two points of {lat, lon} or can pass in four numbers in lat1, lon1, lat2, lon2.  If second format, convert to first
        if (lat2 !== undefined) {
            point1 = { lat: point1, lon: point2 };
            point2 = { lat: lat2, lon: long2 };
        }

        // convert to new number format
        if (point1.lat === undefined && Ext.isNumber(point1.latitude)) {
            point1.lat = point1.latitude;
            point1.lon = point1.longitude;
        }

        // Converts numeric degrees to radians 
        if (Number.prototype.toRad === undefined) {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            };
        }

        if (Ext.isNumber(point1.lat) && Ext.isNumber(point2.lat) && Ext.isNumber(point1.lon) && Ext.isNumber(point2.lon)) {
            var a, c, d, R = 6371, // km
                dLat = (point2.lat - point1.lat).toRad(),
                dLon = (point2.lon - point1.lon).toRad(),
                lat1 = point1.lat.toRad();

            lat2 = point2.lat.toRad();

            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            d = R * c;

            return d;
        }

        return 0;
    },

    // sort the options by their distance
    SortOptionsByDistance: function (opt1, opt2) {
        var fnSetOptionDistance;

        // scoping this way since array.sort has scope of window
        fnSetOptionDistance = function (option) {
            var strDist;

            if (option.location && option.location.lat) {
                option.distance = DataFunc.CalculateDistance(VIPSMobile.Main.getLocation(), option.location);
                strDist = option.distance.toFixed(2) + ' km';
            } else {
                option.distance = 10000;
                strDist = 'location not set';
            }

            option.text += '<br /><span class="small">' + strDist + '</span>';

        };

        // calculate the distance to first option
        if (!opt1.distance) { fnSetOptionDistance(opt1); }
        if (!opt2.distance) { fnSetOptionDistance(opt2); }

        // if distances are the same, sort alphabetically
        if (opt1.distance !== opt2.distance) {
            return opt1.distance - opt2.distance;
        }

        if (opt1.text === opt2.text) {
            return 0;
        }
        if (opt1.text < opt2.text) {
            return -1;
        }
        return 1;

    },

    setFieldsValues: function (vCollection, rFields, rParams, appendPlaceHolderToFields) {
        var i, strPlaceHolder;

        strPlaceHolder = '';
        if (appendPlaceHolderToFields) {
            strPlaceHolder = '=?';
        }

        if (vCollection) {

            if (vCollection.isModel) {

                for (i = 0; i < vCollection.getFields().keys.length; i++) {

                    rFields.push(vCollection.getFields().keys[i] + strPlaceHolder);
                    rParams.push(vCollection.get(vCollection.getFields().keys[i]));

                }

            } else {

                Ext.iterate(vCollection, function (field, value) {

                    rFields.push(field + strPlaceHolder);
                    rParams.push(value);

                });

            }

        }

    },

    GetAnimation: function (vDirerction) {

        if (!Ext.os.is.Android) {
            return {
                type: 'slide',
                direction: vDirerction || 'left'
            };
        }
        return {};

    },

    GetXtype: function (component) {
        var strReturn;

        strReturn = component.getXTypes();
        strReturn = strReturn.substring(strReturn.lastIndexOf('/') + 1);

        return strReturn;

    },

    measureString: function (string, cmp, maxWidth) {
        var ruler, classes, i, size;

        try {

            // create the ruler container if needed
            ruler = Ext.getCmp('StringRuler');
            if (!ruler) {

                ruler = Ext.Viewport.add({
                    xtype: 'container',
                    left: 0,
                    top: -1000,
                    hidden: false,
                    id: 'StringRuler'
                });
                ruler.show();

            }

            // set up the ruler with style, classes and max width
            ruler.setStyle(cmp.getStyle());
            classes = ruler.getCls() || [];
            for (i = 0; i < classes.length; i++) { ruler.removeCls(classes[i]); }
            classes = cmp.getCls() || [];
            for (i = 0; i < classes.length; i++) { ruler.addCls(classes[i]); }
            if (maxWidth) { ruler.setMaxWidth(maxWidth); }

            // set the html to resize the container
            ruler.setHtml(string);

            size = {
                height: ruler.element.getHeight(),
                width: ruler.element.getWidth()
            };

            // reset style if changed
            ruler.setMaxWidth(null);

            // return the container's size
            return size;

        } catch (ex) {
            console.error('DataFunc.measureString() Error', ex.message);
        }

    },

    getNumberOfDomElements: function () {
        return document.getElementsByTagName("*").length;
    },

    SQLResultsToArray: function (results) {
        var array, i;

        array = [];
        if (results && results.rows) {
            for (i = 0; i < results.rows.length; i++) {
                array.push(results.rows.item(i));
            }
        }
        return array;

    },
    ScalarSQLResultsToArray: function (results) {
        var array, i, objValue, loopFn;

        array = [];
        loopFn = function (key, value) { objValue = value; };
        if (results && results.rows) {
            for (i = 0; i < results.rows.length; i++) {
                Ext.iterate(results.rows.item(i), loopFn);
                array.push(objValue);
            }
        }
        return array;

    },

    // used on indexitems sort and grouping
    SorterFunction: function (SortKey, record1, record2) {
        var keys1, keys2, a, b, i;

        keys1 = (record1.get(SortKey) || "0").split(".");
        keys2 = (record2.get(SortKey) || "0").split(".");

        for (i = 0; i < Math.max(keys1.length, keys2.length); i++) {

            a = parseInt(keys1[i] || "0", 10);
            b = parseInt(keys2[i] || "0", 10);

            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
        }

        return 0;

    },

    // sort the given array of objects by the given properties array
    SortObjectArray: function (array, props) {

        // make sure the properties are an array
        if (!Ext.isArray(props)) { props = [props]; }

        Ext.Array.sort(array, function (a, b) { return DataFunc.SortObjectArrayItems(a, b, props, 0); });

    },
    SortObjectArrayItems: function (a, b, props, propIndex) {

        // check if the values are equal for the
        if (a[props[propIndex]] === b[props[propIndex]]) {

            // if values are equal, continues with the next property in the array
            if (propIndex < props.length) {
                return DataFunc.SortObjectArrayItems(a, b, props, propIndex + 1);
            }

            return 0;

        }
        // check if comparing numbers
        if (Ext.isNumber(a[props[propIndex]]) && Ext.isNumber(b[props[propIndex]])) {
            return a[props[propIndex]] - b[props[propIndex]];
        }

        if (a[props[propIndex]] < b[props[propIndex]]) {
            return -1;
        }

        if (a[props[propIndex]] > b[props[propIndex]]) {
            return 1;
        }

        return 0;

    },

    ClearView: function (view) {
        var i;

        i = 0;
        while (view && view.items && i < view.items.length) {

            if (view.items.items[i].isDocked()) {
                i++;
            } else {
                view.items.items[i].destroy();
            }

        }

    },

    ClearInfo: function (vCallBack, scope) {

        if (!vCallBack) {
            vCallBack = function () { window.location.reload(true); };
        }

        VIPSMobile.CDR.add(VIPSMobile.CDR.Types.ClearInfo);

        // send the current id to clear out all the sync info
        if (VIPSMobile.User.getMobileID()) {
            VIPSMobile.MsgQueue.add(VIPSMobile.MsgQueue.Types.Clear, { mobileid: VIPSMobile.User.getMobileID() });
        }

        // clear local storage
        localStorage.clear();

        // drop all the tables and perform callback
        DataFunc.DropAllTables(vCallBack, scope);

    },

    // convert the give bytes value to a user friendly string
    getSizeString: function (bytes) {

        if (bytes > 1073741824) {
            return (bytes / 1073741824).toFixed(1) + ' GB';
        }
        if (bytes > 1048576) {
            return (bytes / 1048576).toFixed(1) + ' MB';
        }
        if (bytes > 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        }

        return bytes + ' B';

    },

    /// Colour From Data Call Flow Designer, these are Arbitary ints.
    GetColourRGBFromVBColour: function (intColour) {

        switch (intColour) {
            case 0:
                //Black = 0
                return "#000";
            case 1:
                //Blue = 1
                return "#00F";
            case 2:
                //Red = 2
                return "#F00";
            case 3:
                //Green = 3
                return "#0F0";
            case 4:
                //LightGreen = 4
                return "#CCFFCC";
            case 5:
                //LightBlue = 5
                return "#3366FF";
            case 6:
                //Yellow = 6
                return "#FF0";
            case 7:
                //Purple = 7
                return "#F0F";
            default:
                return "#000";
        }

    },

    Base64toBlob: function (b64Data, contentType, sliceSize) {
        var intComma = b64Data.indexOf(','),
            byteCharacters = atob(b64Data),
            byteArrays = [],
            offset, slice, byteNumbers, byteArray, i, blob;

        contentType = contentType || b64Data.substring(5, intComma - 7) || '';
        b64Data = b64Data.substring(intComma + 1);
        sliceSize = sliceSize || 512;

        for (offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            slice = byteCharacters.slice(offset, offset + sliceSize);

            byteNumbers = [];
            for (i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        blob = new Blob(byteArrays, { type: contentType });
        return blob;
    },

    ReplaceAtInSQL: function (x) {
        x.match(/@[a-zA-Z]*/gi).map(function (word, index) {
            x = x.replace(word, '[' + word.substring(1) + ']')
        })
        return x;
    },

    RemoveNulls: function (obj) {
        Object.keys(obj).forEach((k) => obj[k] == null && delete obj[k]);
    }

});
