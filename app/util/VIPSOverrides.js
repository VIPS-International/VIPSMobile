//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.VIPSOverrides', {});
Ext.Date.patterns = {
    ISO8601Long: "Y-m-d H:i:s",
    ISO8601Short: "Y-m-d",
    ShortDate: "j/n/Y",
    LongDate: "l, F d, Y",
    FullDateTime: "l, F d, Y g:i:s A",
    MonthDay: "F d",
    ShortTime: "g:i A",
    LongTime: "g:i:s A",
    SortableDateTime: "Y-m-d\\TH:i:s",
    UniversalSortableDateTime: "Y-m-d H:i:sO",
    YearMonth: "F, Y",
    InLast7Days: "D g:i A",
    ThisYear: "j M g:i A",
    ShortDateAndTime: "j/n/Y g:i A"
};

Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

Date.prototype.isToday = function () {
    var today = new Date();
    return (this.getDate() === today.getDate() && this.getMonth() === today.getMonth() && this.getFullYear() === today.getFullYear());
};

Date.prototype.isYesterday = function () {
    var yesterday = new Date();
    yesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() - 1);
    return (this.getDate() === yesterday.getDate() && this.getMonth() === yesterday.getMonth() && this.getFullYear() === yesterday.getFullYear());
};

var XML = {};
XML.stringify = function (item) {
    var xml = [], key;

    xml.push('<item>');

    for (key in item) {
        if (item.hasOwnProperty(key)) {
            xml.push('<', key, '>', item[key], '</', key, '>');
        }
    }
    xml.push('</item>');
    if (xml.length > 2) {
        return xml.join('');
    }

    return null;

};

XML.parse = function (string) {
    var i, parser = new DOMParser(),
        rtn = {},
        xmlDoc = parser.parseFromString(string, "text/xml"),
        items = xmlDoc.firstChild.children || xmlDoc.firstChild.childNodes;

    for (i = 0; i < items.length; i++) {
        rtn[items[i].tagName] = items[i].textContent;
    }

    return rtn;
};
function iOSversion() {
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
        // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
        return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];

    } else if (navigator.platform === "MacIntel") {
        return [13, 0, 0];
    }

    return [Ext.os.name];
}
