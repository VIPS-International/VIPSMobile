//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.data.Connection', {
    override: 'Ext.data.Connection',

    request: function (options) {

        // prepend the URI to the url
        if (VIPSMobile.Main) {
            options.url = VIPSMobile.Main.getUri() + options.url;
        }

        // call base function
        this.callParent(arguments);

    },

    onStateChange: function (request) {
        if (request.xhr && request.xhr.readyState === 4) {
            this.clearTimeout(request);
            this.onComplete(request);
            this.cleanup(request);
        }
    },

    createResponse: function (request) {
        var xhr = request.xhr,
            headers = {},
            lines, count, line, index, key, response;

        //we need to make this check here because if a request times out an exception is thrown
        //when calling getAllResponseHeaders() because the response never came back to populate it
        if (request.timedout || request.aborted) {
            request.success = false;
            lines = [];
        } else {
            lines = xhr.getAllResponseHeaders().replace(this.lineBreakRe, '\n').split('\n');
        }

        count = lines.length;

        while (count--) {
            line = lines[count];
            index = line.indexOf(':');
            if (index >= 0) {
                key = line.substr(0, index).toLowerCase();
                if (line.charAt(index + 1) === ' ') {
                    ++index;
                }
                headers[key] = line.substr(index + 1);
            }
        }

        request.xhr = null;
        delete request.xhr;

        response = {
            request: request,
            requestId: request.id,
            status: xhr.status,
            statusText: xhr.statusText,
            getResponseHeader: function (header) {
                return headers[header.toLowerCase()];
            },
            getAllResponseHeaders: function () {
                return headers;
            },
            responseText: xhr.responseText,
            responseXML: xhr.responseXML
        };

        if (request.headers['Content-Type'] && request.headers['Content-Type'] === 'application/json') {
            try {

                response.responseObject = JSON.parse(response.responseText);

                if (VIPSMobile.User) {
                    VIPSMobile.User.IncrementUploads(JSON.stringify(request.options.jsonData).length);
                    VIPSMobile.User.IncrementDownloads(parseInt(headers['content-length'], 10));
                    VIPSMobile.User.save();
                }

            } catch (e) {
                response.responseObject = {
                    success: false,
                    trace: e + response.responseText,
                    error: e + response.responseText
                };
            }
        }

        // If we don't explicitly tear down the xhr reference, IE6/IE7 will hold this in the closure of the
        // functions created with getResponseHeader/getAllResponseHeaders
        xhr = null;
        return response;
    }

});
