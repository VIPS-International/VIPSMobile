//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

///**
//* Mega pixel image rendering library for iOS6 Safari
//*
//* Fixes iOS6 Safari's image file rendering issue for large size image (over mega-pixel),
//* which causes unexpected subsampling when drawing it in canvas.
//* By using this library, you can safely render the image with proper stretching.
//*
//* Copyright (c) 2012 Shinichi Tomita <shinichi.tomita@gmail.com>
//* Released under the MIT license
//*/
Ext.define('VIPSMobile.util.MegaPixImage', {
    mixins: ['Ext.mixin.Observable'],
    alias: 'MegaPixImage',

    config: {
        fileName: null,
        srcImage: null
    },

    constructor: function (config) {
        var i, me, _this, URL, img, len;
        me = this;

        // apply the config
        this.initConfig(config);

        if (this.getSrcImage() instanceof window.Blob) {
            img = new Image();
            URL = window.URL && window.URL.createObjectURL ? window.URL :
                window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL :
                    null;
            if (!URL) { throw new Error("No createObjectURL function found to create blob url"); }
            img.src = URL.createObjectURL(this.getSrcImage());
            this.setSrcImage(img);
        }

        if (!this.getSrcImage().naturalWidth && !this.getSrcImage().naturalHeight) {
            _this = this;
            this.getSrcImage().onload = function (e) {

                EXIF.getData(me.getSrcImage(), function () {


                    me.fireEvent('load', me);

                    var listeners = _this.imageLoadListeners;
                    if (listeners) {
                        _this.imageLoadListeners = null;
                        for (i = 0, len = listeners.length; i < len; i++) {
                            listeners[i]();
                        }
                    }
                });
            };
            this.imageLoadListeners = [];
        }



    },

    /**
    * Detect subsampling in loaded image.
    * In iOS, larger images than 2M pixels may be subsampled in rendering.
    */
    detectSubsampling: function (img) {
        var ih, iw, canvas, ctx;

        try {

            ih = img.naturalHeight;
            iw = img.naturalWidth;

            if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
                canvas = document.createElement('canvas');
                canvas.width = canvas.height = 1;
                ctx = canvas.getContext('2d');
                ctx.drawImage(img, -iw + 1, 0);
                // subsampled image becomes half smaller in rendering size.
                // check alpha channel value to confirm image is covering edge pixel or not.
                // if alpha value is 0 image is not covering, hence subsampled.
                return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
            }

            return false;


        } catch (ex) {
            console.error('MegaPixImage.detectSubsampling() Error', ex.message);
        }

    },

    /**
    * Detecting vertical squash in loaded image.
    * Fixes a bug which squash image vertically while drawing into canvas for some images.
    */
    detectVerticalSquash: function (img, iw, ih) {

        try {

            var ratio, alpha, ctx, data, canvas = document.createElement('canvas'),
                sy, ey, py;
            canvas.width = 1;
            canvas.height = ih;
            ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            data = ctx.getImageData(0, 0, 1, ih).data;
            // search image edge pixel position in case it is squashed vertically.
            sy = 0;
            ey = ih;
            py = ih;

            while (py > sy) {
                alpha = data[(py - 1) * 4 + 3];
                if (alpha === 0) {
                    ey = py;
                } else {
                    sy = py;
                }
                py = (ey + sy) >> 1;
            }
            ratio = (py / ih);

            return (ratio === 0) ? 1 : ratio;

        } catch (ex) {
            console.error('MegaPixImage.detectVerticalSquash() Error', ex.message);
        }

    },

    getImageInfo: function (options) {

        try {
            var canvas = document.createElement('canvas'),
                thumbcanvas = document.createElement('canvas'),
                objReturn;

            options.orientation = EXIF.getTag(this.getSrcImage(), 'Orientation') || 1;
            options.dateCreated = EXIF.getTag(this.getSrcImage(), 'DateTimeOriginal') || "";

            this.render(canvas, options);
            this.render(thumbcanvas, { maxWidth: 64, orientation: options.orientation });

            objReturn = {
                fileName: this.getFileName(),
                data: canvas.toDataURL("image/jpeg", options.quality || 0.8),
                thumb: thumbcanvas.toDataURL("image/jpeg", options.quality || 0.8),
                height: canvas.height,
                width: canvas.width,
                orientation: options.orientation,
                dateCreated: options.dateCreated
            };

            return objReturn;

        } catch (ex) {
            console.error('MegaPixImage.getImageInfo() Error', ex.message);
        }

    },

    /**
    * Rendering image element (with resizing) and get its data URL
    */
    renderImageToDataURL: function (img, options) {
        try {
            var canvas = document.createElement('canvas');
            this.renderImageToCanvas(img, canvas, options);

            return canvas.toDataURL("image/jpeg", options.quality || 0.8);
        } catch (ex) {
            console.error('MegaPixImage.renderImageToDataURL() Error', ex.message);
        }

    },

    /**
    * Rendering image element (with resizing) into the canvas element
    */
    renderImageToCanvas: function (img, canvas, options) {
        try {
            var subsampled, tmpCanvas, tmpCtx, vertSquashRatio, dw, dh, sy, dy, sx, dx,
                d = 1024, // size of tiling canvas
                iw = img.naturalWidth,
                ih = img.naturalHeight,
                width = options.width,
                height = options.height,
                ctx = canvas.getContext('2d');

            ctx.save();
            this.transformCoordinate(canvas, width, height, options.orientation);
            subsampled = this.detectSubsampling(img);
            if (subsampled) {
                iw /= 2;
                ih /= 2;
            }
            tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = tmpCanvas.height = d;
            tmpCtx = tmpCanvas.getContext('2d');
            vertSquashRatio = this.detectVerticalSquash(img, iw, ih);
            dw = Math.ceil(d * width / iw);
            dh = Math.ceil(d * height / ih / vertSquashRatio);
            sy = 0;
            dy = 0;
            while (sy < ih) {
                sx = 0;
                dx = 0;
                while (sx < iw) {
                    tmpCtx.clearRect(0, 0, d, d);
                    tmpCtx.drawImage(img, -sx, -sy);
                    ctx.drawImage(tmpCanvas, 0, 0, d, d, dx, dy, dw, dh);
                    sx += d;
                    dx += dw;
                }
                sy += d;
                dy += dh;
            }
            ctx.restore();

            //if (options.dateCreated) {
            //    ctx.font = "20px Georgia";
            //    ctx.fillText(options.dateCreated, 10, 50);
            //}

            tmpCanvas = tmpCtx = null;
        } catch (ex) {
            console.error('MegaPixImage.renderImageToCanvas() Error', ex.message);
        }

    },
    /**
    * Transform canvas coordination according to specified frame size and orientation
    * Orientation value is from EXIF tag
    */
    transformCoordinate: function (canvas, width, height, orientation) {

        var DontRotate = ((Ext.browser.name === "Chrome" || Ext.browser.name === "ChromeMobile"))
            || (Ext.browser.name === "Safari" && Ext.browser.version.major >= 13)
            || (Ext.browser.name === "Other" && iOSversion().join('') >= '1300');

        switch (orientation) {
            case 5:
            case 6:
                if (DontRotate) {
                    canvas.width = width;
                    canvas.height = height;
                } else {
                    // 90 rotate right
                    canvas.width = height;
                    canvas.height = width;
                }
                break;
            case 7:
            case 8:
                if (DontRotate) {
                    canvas.width = width;
                    canvas.height = height;
                } else {
                    // 90 rotate right
                    canvas.width = height;
                    canvas.height = width;
                }
                break;
            default:
                canvas.width = width;
                canvas.height = height;
        }
        var ctx = canvas.getContext('2d');
        switch (orientation) {
            case 2:
                // horizontal flip
                if (!DontRotate) {
                    ctx.translate(width, 0);
                    ctx.scale(-1, 1);
                }
                break;
            case 3:
                // 180 rotate left
                if (!DontRotate) {
                    ctx.translate(width, height);
                    ctx.rotate(Math.PI);
                }
                break;
            case 4:
                // vertical flip
                if (!DontRotate) {
                    ctx.translate(0, height);
                    ctx.scale(1, -1);
                }
                break;
            case 5:
                // vertical flip + 90 rotate right
                if (!DontRotate) {
                    ctx.rotate(0.5 * Math.PI);
                    ctx.scale(1, -1);
                }
                break;
            case 6:
                if (!DontRotate) {
                    // 90 rotate right
                    ctx.rotate(0.5 * Math.PI);
                    ctx.translate(0, -height);
                }
                break;
            case 7:
                // horizontal flip + 90 rotate right
                if (!DontRotate) {
                    ctx.rotate(0.5 * Math.PI);
                    ctx.translate(width, -height);
                    ctx.scale(-1, 1);
                }
                break;
            case 8:
                // 90 rotate left
                if (!DontRotate) {
                    ctx.rotate(-0.5 * Math.PI);
                    ctx.translate(-width, 0);
                }
                break;
            default:
                break;
        }
    },

    /**
    * Rendering megapix image into specified target element
    */
    render: function (target, options) {
        var opt, k,
            imgWidth = this.getSrcImage().naturalWidth,
            imgHeight = this.getSrcImage().naturalHeight,
            width = options.width,
            height = options.height,
            maxWidth = options.maxWidth,
            maxHeight = options.maxHeight;

        if (width && !height) {
            height = (imgHeight * width / imgWidth) << 0;
        } else if (height && !width) {
            width = (imgWidth * height / imgHeight) << 0;
        } else {
            width = imgWidth;
            height = imgHeight;
        }
        if (maxWidth && width > maxWidth) {
            width = maxWidth;
            height = (imgHeight * width / imgWidth) << 0;
        }
        if (maxHeight && height > maxHeight) {
            height = maxHeight;
            width = (imgWidth * height / imgHeight) << 0;
        }
        opt = { width: width, height: height };
        for (k in options) {
            if (options.hasOwnProperty(k)) {
                opt[k] = options[k];
            }
        }

        switch (target.tagName.toLowerCase()) {
            case 'canvas':
                this.renderImageToCanvas(this.getSrcImage(), target, opt);
                break;
            case 'div':
                target.style.backgroundImage = 'url(' + this.renderImageToDataURL(this.getSrcImage(), opt) + ')';
                break;
            case 'img':
                target.src = this.renderImageToDataURL(this.getSrcImage(), opt);
                break;
        }

        this.fireEvent('render', this, target);

    }

});

/*
 * Binary Ajax 0.1.10
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */

var BinaryFile = function (strData, iDataOffset, iDataLength) {
    var data = strData,
        dataOffset = iDataOffset || 0,
        dataLength = 0;

    this.getRawData = function () {
        return data;
    };

    if (typeof strData === "string") {
        dataLength = iDataLength || data.length;

        this.getByteAt = function (iOffset) {
            return data.charCodeAt(iOffset + dataOffset) & 0xFF;
        };

        this.getBytesAt = function (iOffset, iLength) {
            var i, aBytes = [];

            for (i = 0; i < iLength; i++) {
                aBytes[i] = data.charCodeAt((iOffset + i) + dataOffset) & 0xFF;
            }

            return aBytes;
        };

    } else if (typeof strData === "unknown") {
        dataLength = iDataLength || new IEBinary_getLength(data);

        this.getByteAt = function (iOffset) {
            return new IEBinary_getByteAt(data, iOffset + dataOffset);
        };

        this.getBytesAt = function (iOffset, iLength) {
            return new VBArray(new IEBinary_getBytesAt(data, iOffset + dataOffset, iLength)).toArray();
        };
    }

    this.getLength = function () {
        return dataLength;
    };

    this.getSByteAt = function (iOffset) {
        var iByte = this.getByteAt(iOffset);

        if (iByte > 127) { return iByte - 256; }

        return iByte;

    };

    this.getShortAt = function (iOffset, bBigEndian) {
        var iShort = bBigEndian ?
            (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
            : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset);
        if (iShort < 0) { iShort += 65536; }

        return iShort;
    };

    this.getSShortAt = function (iOffset, bBigEndian) {
        var iUShort = this.getShortAt(iOffset, bBigEndian);
        if (iUShort > 32767) { return iUShort - 65536; }

        return iUShort;
    };

    this.getLongAt = function (iOffset, bBigEndian) {
        var iLong, iByte1 = this.getByteAt(iOffset),
            iByte2 = this.getByteAt(iOffset + 1),
            iByte3 = this.getByteAt(iOffset + 2),
            iByte4 = this.getByteAt(iOffset + 3);

        iLong = bBigEndian ?
            (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
            : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
        if (iLong < 0) { iLong += 4294967296; }
        return iLong;
    };

    this.getSLongAt = function (iOffset, bBigEndian) {
        var iULong = this.getLongAt(iOffset, bBigEndian);
        if (iULong > 2147483647) { return iULong - 4294967296; }
        return iULong;
    };

    this.getStringAt = function (iOffset, iLength) {
        var j, aStr = [],
            aBytes = this.getBytesAt(iOffset, iLength);

        for (j = 0; j < iLength; j++) {
            aStr[j] = String.fromCharCode(aBytes[j]);
        }
        return aStr.join("");
    };

    this.getCharAt = function (iOffset) {
        return String.fromCharCode(this.getByteAt(iOffset));
    };

    this.toBase64 = function () {
        return window.btoa(data);
    };

    this.fromBase64 = function (strBase64) {
        data = window.atob(strBase64);
    };

};


var BinaryAjax = (function () {

    function createRequest() {
        var oHTTP = null;
        if (window.ActiveXObject) {
            oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
        } else if (window.XMLHttpRequest) {
            oHTTP = new XMLHttpRequest();
        }
        return oHTTP;
    }

    function getHead(strURL, fncCallback, fncError) {
        var oHTTP = createRequest();
        if (oHTTP) {
            if (fncCallback) {
                if (oHTTP.onload !== undefined) {
                    oHTTP.onload = function () {
                        if (oHTTP.status === "200") {
                            fncCallback(this);
                        } else {
                            if (fncError) { fncError(); }
                        }
                        oHTTP = null;
                    };
                } else {
                    oHTTP.onreadystatechange = function () {
                        if (oHTTP.readyState === 4) {
                            if (oHTTP.status === 200) {
                                fncCallback(this);
                            } else {
                                if (fncError) { fncError(); }
                            }
                            oHTTP = null;
                        }
                    };
                }
            }
            oHTTP.open("HEAD", strURL, true);
            oHTTP.send(null);
        } else {
            if (fncError) { fncError(); }
        }
    }

    function sendRequest(strURL, fncCallback, fncError, aRange, bAcceptRanges, iFileSize) {
        var oHTTP = createRequest(),
            iDataOffset = 0,
            iDataLen = 0;

        if (oHTTP) {

            if (aRange && !bAcceptRanges) {
                iDataOffset = aRange[0];
            }
            if (aRange) {
                iDataLen = aRange[1] - aRange[0] + 1;
            }

            if (fncCallback) {
                if (oHTTP.onload !== undefined) {
                    oHTTP.onload = function () {
                        if (oHTTP.status === 200 || oHTTP.status === 206 || oHTTP.status === 0) {
                            oHTTP.binaryResponse = new BinaryFile(oHTTP.responseText, iDataOffset, iDataLen);
                            oHTTP.fileSize = iFileSize || oHTTP.getResponseHeader("Content-Length");
                            fncCallback(oHTTP);
                        } else {
                            if (fncError) { fncError(); }
                        }
                        oHTTP = null;
                    };
                } else {
                    oHTTP.onreadystatechange = function () {
                        if (oHTTP.readyState === 4) {
                            if (oHTTP.status === 200 || oHTTP.status === 206 || oHTTP.status === 0) {
                                // IE6 craps if we try to extend the XHR object
                                var oRes = {
                                    status: oHTTP.status,
                                    // IE needs responseBody, Chrome/Safari needs responseText
                                    binaryResponse: new BinaryFile(
                                        typeof oHTTP.responseBody === "unknown" ? oHTTP.responseBody : oHTTP.responseText, iDataOffset, iDataLen
                                    ),
                                    fileSize: iFileSize || oHTTP.getResponseHeader("Content-Length")
                                };
                                fncCallback(oRes);
                            } else {
                                if (fncError) { fncError(); }
                            }
                            oHTTP = null;
                        }
                    };
                }
            }
            oHTTP.open("GET", strURL, true);

            if (oHTTP.overrideMimeType) { oHTTP.overrideMimeType('text/plain; charset=x-user-defined'); }

            if (aRange && bAcceptRanges) {
                oHTTP.setRequestHeader("Range", "bytes=" + aRange[0] + "-" + aRange[1]);
            }

            oHTTP.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");

            oHTTP.send(null);
        } else {
            if (fncError) { fncError(); }
        }
    }

    return function (strURL, fncCallback, fncError, aRange) {

        if (aRange) {
            getHead(
                strURL,
                function (oHTTP) {
                    var iLength = parseInt(oHTTP.getResponseHeader("Content-Length"), 10),
                        strAcceptRanges = oHTTP.getResponseHeader("Accept-Ranges"),
                        iStart, iEnd;

                    iStart = aRange[0];
                    if (aRange[0] < 0) { iStart += iLength; }
                    iEnd = iStart + aRange[1] - 1;

                    sendRequest(strURL, fncCallback, fncError, [iStart, iEnd], (strAcceptRanges === "bytes"), iLength);
                }
            );

        } else {
            sendRequest(strURL, fncCallback, fncError);
        }
    };

})();

/*
 * Javascript EXIF Reader 0.1.4
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */


var EXIF = {};

(function () {

    var bDebug = false;

    EXIF.Tags = {

        // version tags
        0x9000: "ExifVersion",			// EXIF version
        0xA000: "FlashpixVersion",		// Flashpix format version

        // colorspace tags
        0xA001: "ColorSpace",			// Color space information tag

        // image configuration
        0xA002: "PixelXDimension",		// Valid width of meaningful image
        0xA003: "PixelYDimension",		// Valid height of meaningful image
        0x9101: "ComponentsConfiguration",	// Information about channels
        0x9102: "CompressedBitsPerPixel",	// Compressed bits per pixel

        // user information
        0x927C: "MakerNote",			// Any desired information written by the manufacturer
        0x9286: "UserComment",			// Comments by user

        // related file
        0xA004: "RelatedSoundFile",		// Name of related sound file

        // date and time
        0x9003: "DateTimeOriginal",		// Date and time when the original image was generated
        0x9004: "DateTimeDigitized",		// Date and time when the image was stored digitally
        0x9290: "SubsecTime",			// Fractions of seconds for DateTime
        0x9291: "SubsecTimeOriginal",		// Fractions of seconds for DateTimeOriginal
        0x9292: "SubsecTimeDigitized",		// Fractions of seconds for DateTimeDigitized

        // picture-taking conditions
        0x829A: "ExposureTime",		// Exposure time (in seconds)
        0x829D: "FNumber",			// F number
        0x8822: "ExposureProgram",		// Exposure program
        0x8824: "SpectralSensitivity",		// Spectral sensitivity
        0x8827: "ISOSpeedRatings",		// ISO speed rating
        0x8828: "OECF",			// Optoelectric conversion factor
        0x9201: "ShutterSpeedValue",		// Shutter speed
        0x9202: "ApertureValue",		// Lens aperture
        0x9203: "BrightnessValue",		// Value of brightness
        0x9204: "ExposureBias",		// Exposure bias
        0x9205: "MaxApertureValue",		// Smallest F number of lens
        0x9206: "SubjectDistance",		// Distance to subject in meters
        0x9207: "MeteringMode", 		// Metering mode
        0x9208: "LightSource",			// Kind of light source
        0x9209: "Flash",			// Flash status
        0x9214: "SubjectArea",			// Location and area of main subject
        0x920A: "FocalLength",			// Focal length of the lens in mm
        0xA20B: "FlashEnergy",			// Strobe energy in BCPS
        0xA20C: "SpatialFrequencyResponse",	// 
        0xA20E: "FocalPlaneXResolution", 	// Number of pixels in width direction per FocalPlaneResolutionUnit
        0xA20F: "FocalPlaneYResolution", 	// Number of pixels in height direction per FocalPlaneResolutionUnit
        0xA210: "FocalPlaneResolutionUnit", 	// Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
        0xA214: "SubjectLocation",		// Location of subject in image
        0xA215: "ExposureIndex",		// Exposure index selected on camera
        0xA217: "SensingMethod", 		// Image sensor type
        0xA300: "FileSource", 			// Image source (3 == DSC)
        0xA301: "SceneType", 			// Scene type (1 == directly photographed)
        0xA302: "CFAPattern",			// Color filter array geometric pattern
        0xA401: "CustomRendered",		// Special processing
        0xA402: "ExposureMode",		// Exposure mode
        0xA403: "WhiteBalance",		// 1 = auto white balance, 2 = manual
        0xA404: "DigitalZoomRation",		// Digital zoom ratio
        0xA405: "FocalLengthIn35mmFilm",	// Equivalent foacl length assuming 35mm film camera (in mm)
        0xA406: "SceneCaptureType",		// Type of scene
        0xA407: "GainControl",			// Degree of overall image gain adjustment
        0xA408: "Contrast",			// Direction of contrast processing applied by camera
        0xA409: "Saturation", 			// Direction of saturation processing applied by camera
        0xA40A: "Sharpness",			// Direction of sharpness processing applied by camera
        0xA40B: "DeviceSettingDescription",	// 
        0xA40C: "SubjectDistanceRange",	// Distance to subject

        // other tags
        0xA005: "InteroperabilityIFDPointer",
        0xA420: "ImageUniqueID"		// Identifier assigned uniquely to each image
    };

    EXIF.TiffTags = {
        0x0100: "ImageWidth",
        0x0101: "ImageHeight",
        0x8769: "ExifIFDPointer",
        0x8825: "GPSInfoIFDPointer",
        0xA005: "InteroperabilityIFDPointer",
        0x0102: "BitsPerSample",
        0x0103: "Compression",
        0x0106: "PhotometricInterpretation",
        0x0112: "Orientation",
        0x0115: "SamplesPerPixel",
        0x011C: "PlanarConfiguration",
        0x0212: "YCbCrSubSampling",
        0x0213: "YCbCrPositioning",
        0x011A: "XResolution",
        0x011B: "YResolution",
        0x0128: "ResolutionUnit",
        0x0111: "StripOffsets",
        0x0116: "RowsPerStrip",
        0x0117: "StripByteCounts",
        0x0201: "JPEGInterchangeFormat",
        0x0202: "JPEGInterchangeFormatLength",
        0x012D: "TransferFunction",
        0x013E: "WhitePoint",
        0x013F: "PrimaryChromaticities",
        0x0211: "YCbCrCoefficients",
        0x0214: "ReferenceBlackWhite",
        0x0132: "DateTime",
        0x010E: "ImageDescription",
        0x010F: "Make",
        0x0110: "Model",
        0x0131: "Software",
        0x013B: "Artist",
        0x8298: "Copyright"
    };

    EXIF.GPSTags = {
        0x0000: "GPSVersionID",
        0x0001: "GPSLatitudeRef",
        0x0002: "GPSLatitude",
        0x0003: "GPSLongitudeRef",
        0x0004: "GPSLongitude",
        0x0005: "GPSAltitudeRef",
        0x0006: "GPSAltitude",
        0x0007: "GPSTimeStamp",
        0x0008: "GPSSatellites",
        0x0009: "GPSStatus",
        0x000A: "GPSMeasureMode",
        0x000B: "GPSDOP",
        0x000C: "GPSSpeedRef",
        0x000D: "GPSSpeed",
        0x000E: "GPSTrackRef",
        0x000F: "GPSTrack",
        0x0010: "GPSImgDirectionRef",
        0x0011: "GPSImgDirection",
        0x0012: "GPSMapDatum",
        0x0013: "GPSDestLatitudeRef",
        0x0014: "GPSDestLatitude",
        0x0015: "GPSDestLongitudeRef",
        0x0016: "GPSDestLongitude",
        0x0017: "GPSDestBearingRef",
        0x0018: "GPSDestBearing",
        0x0019: "GPSDestDistanceRef",
        0x001A: "GPSDestDistance",
        0x001B: "GPSProcessingMethod",
        0x001C: "GPSAreaInformation",
        0x001D: "GPSDateStamp",
        0x001E: "GPSDifferential"
    };

    EXIF.StringValues = {
        ExposureProgram: {
            0: "Not defined",
            1: "Manual",
            2: "Normal program",
            3: "Aperture priority",
            4: "Shutter priority",
            5: "Creative program",
            6: "Action program",
            7: "Portrait mode",
            8: "Landscape mode"
        },
        MeteringMode: {
            0: "Unknown",
            1: "Average",
            2: "CenterWeightedAverage",
            3: "Spot",
            4: "MultiSpot",
            5: "Pattern",
            6: "Partial",
            255: "Other"
        },
        LightSource: {
            0: "Unknown",
            1: "Daylight",
            2: "Fluorescent",
            3: "Tungsten (incandescent light)",
            4: "Flash",
            9: "Fine weather",
            10: "Cloudy weather",
            11: "Shade",
            12: "Daylight fluorescent (D 5700 - 7100K)",
            13: "Day white fluorescent (N 4600 - 5400K)",
            14: "Cool white fluorescent (W 3900 - 4500K)",
            15: "White fluorescent (WW 3200 - 3700K)",
            17: "Standard light A",
            18: "Standard light B",
            19: "Standard light C",
            20: "D55",
            21: "D65",
            22: "D75",
            23: "D50",
            24: "ISO studio tungsten",
            255: "Other"
        },
        Flash: {
            0x0000: "Flash did not fire",
            0x0001: "Flash fired",
            0x0005: "Strobe return light not detected",
            0x0007: "Strobe return light detected",
            0x0009: "Flash fired, compulsory flash mode",
            0x000D: "Flash fired, compulsory flash mode, return light not detected",
            0x000F: "Flash fired, compulsory flash mode, return light detected",
            0x0010: "Flash did not fire, compulsory flash mode",
            0x0018: "Flash did not fire, auto mode",
            0x0019: "Flash fired, auto mode",
            0x001D: "Flash fired, auto mode, return light not detected",
            0x001F: "Flash fired, auto mode, return light detected",
            0x0020: "No flash function",
            0x0041: "Flash fired, red-eye reduction mode",
            0x0045: "Flash fired, red-eye reduction mode, return light not detected",
            0x0047: "Flash fired, red-eye reduction mode, return light detected",
            0x0049: "Flash fired, compulsory flash mode, red-eye reduction mode",
            0x004D: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
            0x004F: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
            0x0059: "Flash fired, auto mode, red-eye reduction mode",
            0x005D: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
            0x005F: "Flash fired, auto mode, return light detected, red-eye reduction mode"
        },
        SensingMethod: {
            1: "Not defined",
            2: "One-chip color area sensor",
            3: "Two-chip color area sensor",
            4: "Three-chip color area sensor",
            5: "Color sequential area sensor",
            7: "Trilinear sensor",
            8: "Color sequential linear sensor"
        },
        SceneCaptureType: {
            0: "Standard",
            1: "Landscape",
            2: "Portrait",
            3: "Night scene"
        },
        SceneType: {
            1: "Directly photographed"
        },
        CustomRendered: {
            0: "Normal process",
            1: "Custom process"
        },
        WhiteBalance: {
            0: "Auto white balance",
            1: "Manual white balance"
        },
        GainControl: {
            0: "None",
            1: "Low gain up",
            2: "High gain up",
            3: "Low gain down",
            4: "High gain down"
        },
        Contrast: {
            0: "Normal",
            1: "Soft",
            2: "Hard"
        },
        Saturation: {
            0: "Normal",
            1: "Low saturation",
            2: "High saturation"
        },
        Sharpness: {
            0: "Normal",
            1: "Soft",
            2: "Hard"
        },
        SubjectDistanceRange: {
            0: "Unknown",
            1: "Macro",
            2: "Close view",
            3: "Distant view"
        },
        FileSource: {
            3: "DSC"
        },

        Components: {
            0: "",
            1: "Y",
            2: "Cb",
            3: "Cr",
            4: "R",
            5: "G",
            6: "B"
        }
    };

    function imageHasData(oImg) {
        return !!(oImg.exifdata);
    }

    function readTagValue(oFile, iEntryOffset, iTIFFStart, iDirStart, bBigEnd) {
        var n, iValOffset, aVals = [], iStringOffset,
            iType = oFile.getShortAt(iEntryOffset + 2, bBigEnd),
            iNumValues = oFile.getLongAt(iEntryOffset + 4, bBigEnd),
            iValueOffset = oFile.getLongAt(iEntryOffset + 8, bBigEnd) + iTIFFStart;

        switch (iType) {
            case 1: // byte, 8-bit unsigned int
            case 7: // undefined, 8-bit byte, value depending on field
                if (iNumValues === 1) {
                    return oFile.getByteAt(iEntryOffset + 8, bBigEnd);
                }
                iValOffset = iNumValues > 4 ? iValueOffset : (iEntryOffset + 8);
                for (n = 0; n < iNumValues; n++) {
                    aVals[n] = oFile.getByteAt(iValOffset + n);
                }
                return aVals;

            case 2: // ascii, 8-bit byte
                iStringOffset = iNumValues > 4 ? iValueOffset : (iEntryOffset + 8);
                return oFile.getStringAt(iStringOffset, iNumValues - 1);

            case 3: // short, 16 bit int
                if (iNumValues === 1) {
                    return oFile.getShortAt(iEntryOffset + 8, bBigEnd);
                }

                iValOffset = iNumValues > 2 ? iValueOffset : (iEntryOffset + 8);
                aVals = [];
                for (n = 0; n < iNumValues; n++) {
                    aVals[n] = oFile.getShortAt(iValOffset + 2 * n, bBigEnd);
                }
                return aVals;

            case 4: // long, 32 bit int
                if (iNumValues === 1) {
                    return oFile.getLongAt(iEntryOffset + 8, bBigEnd);
                }

                for (n = 0; n < iNumValues; n++) {
                    aVals[n] = oFile.getLongAt(iValueOffset + 4 * n, bBigEnd);
                }
                return aVals;


            case 5:	// rational = two long values, first is numerator, second is denominator
                if (iNumValues === 1) {
                    return oFile.getLongAt(iValueOffset, bBigEnd) / oFile.getLongAt(iValueOffset + 4, bBigEnd);
                }

                for (n = 0; n < iNumValues; n++) {
                    aVals[n] = oFile.getLongAt(iValueOffset + 8 * n, bBigEnd) / oFile.getLongAt(iValueOffset + 4 + 8 * n, bBigEnd);
                }
                return aVals;

            case 9: // slong, 32 bit signed int
                if (iNumValues === 1) {
                    return oFile.getSLongAt(iEntryOffset + 8, bBigEnd);
                }

                for (n = 0; n < iNumValues; n++) {
                    aVals[n] = oFile.getSLongAt(iValueOffset + 4 * n, bBigEnd);
                }
                return aVals;
            case 10: // signed rational, two slongs, first is numerator, second is denominator
                if (iNumValues === 1) {
                    return oFile.getSLongAt(iValueOffset, bBigEnd) / oFile.getSLongAt(iValueOffset + 4, bBigEnd);
                }
                for (n = 0; n < iNumValues; n++) {
                    aVals[n] = oFile.getSLongAt(iValueOffset + 8 * n, bBigEnd) / oFile.getSLongAt(iValueOffset + 4 + 8 * n, bBigEnd);
                }
                return aVals;

        }
    }

    function readTags(oFile, iTIFFStart, iDirStart, oStrings, bBigEnd) {
        var i, iEntryOffset, strTag, iEntries = oFile.getShortAt(iDirStart, bBigEnd),
            oTags = {};

        for (i = 0; i < iEntries; i++) {
            iEntryOffset = iDirStart + i * 12 + 2;
            strTag = oStrings[oFile.getShortAt(iEntryOffset, bBigEnd)];
            if (!strTag && bDebug) { console.log("Unknown tag: " + oFile.getShortAt(iEntryOffset, bBigEnd)); }
            oTags[strTag] = readTagValue(oFile, iEntryOffset, iTIFFStart, iDirStart, bBigEnd);
        }
        return oTags;
    }

    function readEXIFData(oFile, iStart, iLength) {
        if (oFile.getStringAt(iStart, 4) !== "Exif") {
            if (bDebug) { console.log("Not valid EXIF data! " + oFile.getStringAt(iStart, 4)); }
            return false;
        }

        var oTags, bBigEnd, oEXIFTags, strTag, oGPSTags,
            iTIFFOffset = iStart + 6;

        // test for TIFF validity and endianness
        if (oFile.getShortAt(iTIFFOffset) === 0x4949) {
            bBigEnd = false;
        } else if (oFile.getShortAt(iTIFFOffset) === 0x4D4D) {
            bBigEnd = true;
        } else {
            if (bDebug) { console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)"); }
            return false;
        }

        if (oFile.getShortAt(iTIFFOffset + 2, bBigEnd) !== 0x002A) {
            if (bDebug) { console.log("Not valid TIFF data! (no 0x002A)"); }
            return false;
        }

        if (oFile.getLongAt(iTIFFOffset + 4, bBigEnd) !== 0x00000008) {
            if (bDebug) { console.log("Not valid TIFF data! (First offset not 8)", oFile.getShortAt(iTIFFOffset + 4, bBigEnd)); }
            return false;
        }

        oTags = readTags(oFile, iTIFFOffset, iTIFFOffset + 8, EXIF.TiffTags, bBigEnd);

        if (oTags.ExifIFDPointer) {
            oEXIFTags = readTags(oFile, iTIFFOffset, iTIFFOffset + oTags.ExifIFDPointer, EXIF.Tags, bBigEnd);
            for (strTag in oEXIFTags) {
                if (oEXIFTags.hasOwnProperty(strTag)) {
                    switch (strTag) {
                        case "LightSource":
                        case "Flash":
                        case "MeteringMode":
                        case "ExposureProgram":
                        case "SensingMethod":
                        case "SceneCaptureType":
                        case "SceneType":
                        case "CustomRendered":
                        case "WhiteBalance":
                        case "GainControl":
                        case "Contrast":
                        case "Saturation":
                        case "Sharpness":
                        case "SubjectDistanceRange":
                        case "FileSource":
                            oEXIFTags[strTag] = EXIF.StringValues[strTag][oEXIFTags[strTag]];
                            break;

                        case "ExifVersion":
                        case "FlashpixVersion":
                            oEXIFTags[strTag] = String.fromCharCode(oEXIFTags[strTag][0], oEXIFTags[strTag][1], oEXIFTags[strTag][2], oEXIFTags[strTag][3]);
                            break;

                        case "ComponentsConfiguration":
                            oEXIFTags[strTag] =
                                EXIF.StringValues.Components[oEXIFTags[strTag][0]]
                                + EXIF.StringValues.Components[oEXIFTags[strTag][1]]
                                + EXIF.StringValues.Components[oEXIFTags[strTag][2]]
                                + EXIF.StringValues.Components[oEXIFTags[strTag][3]];
                            break;
                    }
                    oTags[strTag] = oEXIFTags[strTag];
                }
            }
        }

        if (oTags.GPSInfoIFDPointer) {
            oGPSTags = readTags(oFile, iTIFFOffset, iTIFFOffset + oTags.GPSInfoIFDPointer, EXIF.GPSTags, bBigEnd);
            for (strTag in oGPSTags) {
                if (oGPSTags.hasOwnProperty(strTag)) {
                    switch (strTag) {
                        case "GPSVersionID":
                            oGPSTags[strTag] = oGPSTags[strTag][0]
                                + "." + oGPSTags[strTag][1]
                                + "." + oGPSTags[strTag][2]
                                + "." + oGPSTags[strTag][3];
                            break;
                    }
                    oTags[strTag] = oGPSTags[strTag];
                }
            }
        }

        return oTags;
    }

    function findEXIFinJPEG(oFile) {
        var iMarker,
            iOffset = 2,
            iLength = oFile.getLength();

        if (oFile.getByteAt(0) !== 0xFF || oFile.getByteAt(1) !== 0xD8) {
            return false; // not a valid jpeg
        }

        while (iOffset < iLength) {
            if (oFile.getByteAt(iOffset) !== 0xFF) {
                if (bDebug) { console.log("Not a valid marker at offset " + iOffset + ", found: " + oFile.getByteAt(iOffset)); }
                return false; // not a valid marker, something is wrong
            }

            iMarker = oFile.getByteAt(iOffset + 1);

            // we could implement handling for other markers here, 
            // but we're only looking for 0xFFE1 for EXIF data

            if (iMarker === 22400) {
                if (bDebug) { console.log("Found 0xFFE1 marker"); }
                return readEXIFData(oFile, iOffset + 4, oFile.getShortAt(iOffset + 2, true) - 2);
                //iOffset += 2 + oFile.getShortAt(iOffset + 2, true);
            }

            if (iMarker === 225) {
                // 0xE1 = Application-specific 1 (for EXIF)
                if (bDebug) { console.log("Found 0xFFE1 marker"); }
                return readEXIFData(oFile, iOffset + 4, oFile.getShortAt(iOffset + 2, true) - 2);

            }
            iOffset += 2 + oFile.getShortAt(iOffset + 2, true);

        }

    }

    function getImageData(oImg, fncCallback) {
        BinaryAjax(
            oImg.src,
            function (oHTTP) {
                var oEXIF = findEXIFinJPEG(oHTTP.binaryResponse);
                oImg.exifdata = oEXIF || {};
                if (fncCallback) { fncCallback(); }
            }
        );
    }

    EXIF.getData = function (oImg, fncCallback) {
        if (!oImg.complete) { return false; }
        if (!imageHasData(oImg)) {
            getImageData(oImg, fncCallback);
        } else {
            if (fncCallback) { fncCallback(); }
        }
        return true;
    };

    EXIF.getTag = function (oImg, strTag) {
        if (!imageHasData(oImg)) { return; }
        return oImg.exifdata[strTag];
    };

    EXIF.getAllTags = function (oImg) {
        if (!imageHasData(oImg)) { return {}; }
        var oData = oImg.exifdata,
            oAllTags = {}, a;

        for (a in oData) {
            if (oData.hasOwnProperty(a)) {
                oAllTags[a] = oData[a];
            }
        }
        return oAllTags;
    };


    EXIF.pretty = function (oImg) {
        if (!imageHasData(oImg)) { return ""; }
        var oData = oImg.exifdata,
            strPretty = "", a;

        for (a in oData) {
            if (oData.hasOwnProperty(a)) {
                if (typeof oData[a] === "object") {
                    strPretty += a + " : [" + oData[a].length + " values]\r\n";
                } else {
                    strPretty += a + " : " + oData[a] + "\r\n";
                }
            }
        }
        return strPretty;
    };

    EXIF.readFromBinaryFile = function (oFile) {
        return findEXIFinJPEG(oFile);
    };

})();

(function () {
    //Some common utility functions
    var util = {
        mixin: function (dest, src) {
            var p;
            for (p in src) {
                if (src.hasOwnProperty(p)) { dest[p] = src[p]; }
            }
        }
        , byId: function (id) {
            if (typeof id === 'string') { return document.getElementById(id); }
            return id;
        }
        , create: function (tag, attrs) {
            var node = document.createElement(tag);
            this.mixin(node, attrs);
            return node;
        }
        , connect: function (node, evtType, context, callback) {
            var self = this;
            function handler(evt) {
                evt = self.fixEvent(evt);
                context[callback](evt);
            }
            if (node.attachEvent) { node.attachEvent('on' + evtType, handler); }
            else { node.addEventListener(evtType, handler, false); }
        }
        , style: function (node, args) {
            var s, value;

            if (typeof args === 'string') {
                value = node.style[args];
                if (!value) {
                    if (window.getComputedStyle) {
                        s = window.getComputedStyle(node);
                    } else {
                        s = node.currentStyle;
                    }
                    value = s[args];
                }
                return value;
            }
            this.mixin(node.style, args);
        }
        , each: function (arr, callback) {
            var i;
            for (i = 0; i < arr.length; i++) { callback(arr[i], i); }
        }
        , indexOf: function (arr, value) {
            var i;
            for (i = 0; i < arr.length; i++) { if (value === arr[i]) { return i; } }
            return -1;
        }
        , addCss: function (node, css) {
            if (!node) { return; }
            var cn = node.className || '', arr = cn.split(' '), i = util.indexOf(arr, css);
            if (i < 0) { arr.push(css); }
            node.className = arr.join(' ');
        }
        , rmCss: function (node, css) {
            if (!node) { return; }
            var cn = node.className || '', arr = cn.split(' '), i = util.indexOf(arr, css);
            if (i >= 0) { arr.splice(i, 1); }
            node.className = arr.join(' ');
        }
        , fixEvent: function (evt) {
            evt = evt || event;
            if (!evt.target) { evt.target = evt.srcElement; }
            if (!evt.keyCode) { evt.keyCode = evt.which || evt.charCode; }
            if (!evt.pageX) {//only for IE
                evt.pageX = evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                evt.pageY = evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            return evt;
        }
    };

    window.ICropper = function (container, options) {
        // summary:
        //  Constructor of the Image Cropper, the container could be a dom node or id.
        var p;

        container = util.byId(container);
        if (options.keepSquare) {
            //keepSquare is deprecated. Should use ratio=1 instead.
            options.ratio = 1;
            delete options.keepSquare;
        }

        for (p in options) {
            if (options.hasOwnProperty(p)) { this[p] = options[p]; }
        }

        this.domNode = container || util.create('div');
        this._init();
    };

    ICropper.prototype = {

        //The image url
        image: ''

        //The minimal size of the cropping area
        , minWidth: 20
        , minHeight: 20

        //The default gap between crop region border and container border
        , gap: 50

        //the initial crop region width and height
        , initialSize: 0

        //whether to keep crop region as a square
        //DEPRECATED: use ratio=1 instead.
        , keepSquare: false

        //whether to keep the ratio of width:height, 0 means not set
        , ratio: 0

        //array: the nodes to show previews of cropped image
        , preview: null

        , domNode: null
        , cropNode: null
        , imageNode: null

        //Public APIs
        //------------------------------------------------------------
        , setImage: function (url) {
            // summary:
            //  Set the image to be cropped. The container size will fit the image.
            var self, img = new Image();
            img.src = url;
            this.image = url;
            if (!this.imageNode) {
                this.imageNode = util.create('img');
                this.domNode.appendChild(this.imageNode);
                self = this;
                this.imageNode.onload = function () {
                    self._setSize(this.offsetWidth, this.offsetHeight);
                };
            }
            if (url) { this.imageNode.src = url; }
        }

        , bindPreview: function (node) {
            // summary:
            //  Bind a node as the preview area. e.g: a real size avatar
            node = util.byId(node);
            util.style(node, { overflow: 'hidden' });
            var _oldOnChange, rateX, rateY,
                width = parseInt(util.style(node, 'width'), 10)
                , height = parseInt(util.style(node, 'height'), 10)
                , previewImage = util.create('img', { src: this.image });

            node.appendChild(previewImage);

            _oldOnChange = this.onChange;

            this.onChange = function (info) {
                _oldOnChange.call(this, info);

                var r = info.w / info.h
                    , w2 = height * r
                    , h2 = width / r
                    ;
                if (w2 >= width) { w2 = width; }
                if (h2 >= height) { h2 = height; }
                util.style(node, { width: w2 + 'px', height: h2 + 'px' });

                rateX = w2 / info.w;
                rateY = h2 / info.h;

                util.style(previewImage, {
                    width: info.cw * rateX + 'px'
                    , height: info.ch * rateY + 'px'
                    , marginLeft: -info.l * rateX + 'px'
                    , marginTop: -info.t * rateY + 'px'
                });
            };
        }

        , getInfo: function () {
            var i = this.imageNode,
                c = this.cropNode,
                il = parseInt(util.style(i, 'left'), 10),
                it = parseInt(util.style(i, 'top'), 10),
                cl = parseInt(util.style(c, 'left'), 10),
                ct = parseInt(util.style(c, 'top'), 10),
                sw = i.naturalWidth / i.offsetWidth,
                sh = i.naturalHeight / i.offsetHeight,
                w, h, l, t;

            w = parseInt(sw * (c.offsetWidth - 2), 10);
            h = parseInt(sh * (c.offsetWidth - 2), 10);
            l = parseInt(sw * (cl - il), 10);
            t = parseInt(sh * (ct - it), 10);

            // summary:
            //  Get the cropping infomation. Such as being used by server side for real cropping.
            return {
                w: w
                , h: h
                , l: l
                , t: t

            };
        }

        , onChange: Ext.emptyFn //    When the cropping size is changed.

        , onComplete: Ext.emptyFn //    When mouseup.

        , destroy: function () {
            var blocks = this.domNode.getElementsByClassName('block'),
                len = blocks.length, i;

            for (i = len - 1; i > -1; i--) {
                blocks[i].remove();
            }
            this.cropNode.remove();
        }

        //Private APIs
        //------------------------------------------------------------
        , _init: function () {
            var self = this;
            util.addCss(this.domNode, 'icropper');
            this._buildRendering();
            this._updateUI();


            if (this.domNode.children[0].nodeName === 'IMG') {
                this.imageNode = this.domNode.children[0];
                this.imageNode.style.width = '';
                this.setImage();
                this._setSize(this.imageNode.offsetWidth, this.imageNode.offsetHeight);
            }

            if (this.preview) {
                util.each(this.preview, function (node) {
                    self.bindPreview(node);
                });
            }

            Ext.get(this.domNode).on('touchstart', this._onMouseDown, this);
            Ext.get(document).on('touchend', this._onMouseUp, this);
            Ext.get(document).on('touchmove', this._onMouseMove, this);
            Ext.get(this.domNode).on('pinch', this._onPinch, this);

        }

        , _buildRendering: function () {
            var i, n, arr;

            this._archors = {};
            this._blockNodes = {};

            this.cropNode = util.create('div', { className: 'crop-node no-select' });
            this.domNode.appendChild(this.cropNode);

            //Create blocks for showing dark areas
            arr = ['l', 't', 'r', 'b'];
            for (i = 0; i < 4; i++) {
                n = util.create('div', { className: 'block block-' + arr[i] });
                this.domNode.appendChild(n);
                this._blockNodes[arr[i]] = n;
            }
        }

        , _setSize: function (w, h) {
            this.domNode.style.overflow = 'hidden';
            //this.domNode.style.width = w + 'px';
            //this.domNode.style.height = h + 'px';

            w = this.domNode.offsetWidth;
            h = this.domNode.offsetHeight;

            var s, l, t, m, w2, h2, _w2, _h2;
            if (this.initialSize) {
                m = Math.min(w, h, this.initialSize);
                w2 = h2 = m - 2 + 'px';
            } else {
                w2 = w - this.gap * 2 - 2;
                h2 = h - this.gap * 2 - 2;
                if (this.ratio) {
                    _w2 = h2 * this.ratio;
                    _h2 = w2 / this.ratio;
                    if (w2 > _w2) { w2 = _w2; }
                    if (h2 > _h2) { h2 = _h2; }

                }
                w2 += 'px';
                h2 += 'px';
            }

            s = this.cropNode.style;
            s.width = w2;
            s.height = h2;

            l = (w - this.cropNode.offsetWidth) / 2;
            t = (h - this.cropNode.offsetHeight) / 2;

            if (l < 0) { l = 0; }
            if (t < 0) { t = 0; }

            s.left = l + 'px';
            s.top = t + 'px';

            this._posBlocks();
            this.onChange(this.getInfo());
        }

        , _updateUI: function () {
            this._posBlocks();
        }

        , _posBlocks: function () {
            var b = this._blockNodes,
                l = parseInt(util.style(this.cropNode, 'left'), 10),
                t = parseInt(util.style(this.cropNode, 'top'), 10),
                w = this.cropNode.offsetWidth,
                ww = this.domNode.offsetWidth,
                h = this.cropNode.offsetHeight,
                hh = this.domNode.offsetHeight;

            b = this._blockNodes;
            b.t.style.height = b.l.style.top = b.r.style.top = t + 'px';

            b.l.style.height = b.r.style.height = h + 'px';
            b.l.style.width = l + 'px';


            w = ww - w - l;
            h = hh - h - t;

            //fix IE
            if (w < 0) { w = 0; }
            if (h < 0) { h = 0; }

            b.r.style.width = w + 'px';
            b.b.style.height = h + 'px';
        }

        , _onMouseDown: function (e) {
            var c, n = this.imageNode;

            if (e.touches.length === 1) {
                this.dragging = 'move';
            } else {
                this.dragging = 'pinch';
                this.imageNode.scale = this.imageNode.scale || 1;
            }

            this.startedPos = {
                x: e.pageX
                , y: e.pageY
                , h: n.offsetHeight - 2 //2 is border width
                , w: n.offsetWidth - 2
                , l: parseInt(util.style(n, 'left'), 10)
                , t: parseInt(util.style(n, 'top'), 10)
            };

            c = util.style(e.target, 'cursor');
            util.style(document.body, {
                cursor: c
            });
            util.style(this.cropNode, {
                cursor: c
            });
            util.addCss(document.body, 'no-select');
            util.addCss(document.body, 'unselectable');//for IE
        }

        , _onMouseUp: function (e) {
            this.dragging = false;
            util.style(document.body, {
                cursor: 'default'
            });
            util.style(this.cropNode, {
                cursor: 'move'
            });
            util.rmCss(document.body, 'no-select');
            util.rmCss(document.body, 'unselectable');
            if (this.onComplete) { this.onComplete(this.getInfo()); }
        }

        , _onMouseMove: function (e) {
            if (this.dragging !== 'move') { return; }

            this._doMove(e);
            this._updateUI();
            if (this.onChange) { this.onChange(this.getInfo()); }

        }

        , _doMove: function (e) {
            //var s = this.cropNode.style,
            var l, t, p0 = this.startedPos;

            if (this.dragging === 'move') {
                l = p0.l + e.pageX - p0.x;
                t = p0.t + e.pageY - p0.y;
                this._doMove2(l, t);
            }


        }

        , _doMove2: function (l, t) {
            var is = this.imageNode.style,
                cs = this.cropNode.style;


            if (l > parseInt(cs.left, 10)) { l = parseInt(cs.left, 10); }
            if (t > parseInt(cs.top, 10)) { t = parseInt(cs.top, 10); }
            if (l + this.imageNode.offsetWidth < this.cropNode.offsetWidth + parseInt(cs.left, 10)) {
                l = this.cropNode.offsetWidth + parseInt(cs.left, 10) - this.imageNode.offsetWidth;
            }
            if (t + this.imageNode.offsetHeight < this.cropNode.offsetHeight + parseInt(cs.top, 10)) {
                t = this.cropNode.offsetHeight + parseInt(cs.top, 10) - this.imageNode.offsetHeight;
            }
            is.left = l + 'px';
            is.top = t + 'px';

        }

        , _onPinch: function (e) {
            var es = e.scale,
                is = this.imageNode.style,
                rh = this.imageNode.naturalWidth / this.imageNode.naturalHeight,
                rw = this.imageNode.naturalHeight / this.imageNode.naturalWidth,
                iw = parseInt(this.imageNode.style.width, 10) || this.imageNode.naturalWidth,
                ih = parseInt(this.imageNode.style.height, 10) || this.imageNode.naturalHeight,
                maxw = this.imageNode.naturalWidth * 3,
                maxh = this.imageNode.naturalHeight * 3,
                minw = this.cropNode.offsetWidth,
                minh = this.cropNode.offsetHeight,
                os = this.imageNode.scale,
                scale = (os + (es + (1 - es) / 2)) - os,
                nw = parseInt((scale * iw), 10),
                nh = parseInt((scale * ih), 10),
                l = parseInt(is.left, 10),
                t = parseInt(is.top, 10),
                nl, nt;

            // using natural image dimensions so no need to ratio them
            if (nw > maxw || nh > maxh) {
                nw = maxw;
                nh = maxh;
            }

            // minimums need to be ratios as the crop box can be any dimensions
            if (nw < minw) {
                nw = minw;
                nh = minw * rw;
            }

            if (nh < minh) {
                nw = minh * rh;
                nh = minh;
            }

            is.width = nw + 'px';
            is.height = nh + 'px';

            nl = l - parseInt((nw - iw) / 2, 10);
            nt = t - parseInt((nh - ih) / 2, 10);

            this._doMove2(nl, nt);

            this.imageNode.scale = scale;

        }

        , _doResize: function (e) {
            var m = this.dragging
                , s = this.cropNode.style
                , p0 = this.startedPos,
                dx = e.pageX - p0.x,
                dy = e.pageY - p0.y,
                ratio = this.ratio,
                w, h, w2, h2;

            if (!ratio && e.shiftKey) { ratio = 1; }//Shiftkey is only available when there's no ratio set.

            if (ratio) {
                if (m === 'l') {
                    dy = dx / ratio;
                    if (p0.l + dx < 0) { dx = -p0.l; dy = dx / ratio; }
                    if (p0.t + dy < 0) { dy = -p0.t; dx = dy * ratio; }
                    m = 'lt';
                } else if (m === 'r') {
                    dy = dx / ratio;
                    m = 'rb';
                } else if (m === 'b') {
                    dx = dy * ratio;
                    m = 'rb';
                } else if (m === 'lt') {
                    dx = Math.abs(dx) > Math.abs(dy) ? dx : dy;
                    dy = dx / ratio;
                    if (p0.l + dx < 0) { dx = -p0.l; dy = dx / ratio; }
                    if (p0.t + dy < 0) { dy = -p0.t; dx = dy * ratio; }
                } else if (m === 'lb') {
                    dx = Math.abs(dx) > Math.abs(dy) ? dx : -dy;
                    dy = -dx / ratio;
                    if (p0.l + dx < 0) {
                        dx = -p0.l;
                        dy = p0.l;
                    }
                } else if (m === 'rt' || m === 't') {
                    dx = -dy * ratio;
                    m = 'rt';
                    if (p0.t + dy < 0) {
                        dy = -p0.t;
                        dx = -dy;
                    }
                }
            }
            if (/l/.test(m)) {
                dx = Math.min(dx, p0.w - this.minWidth);
                if (p0.l + dx >= 0) {
                    s.left = p0.l + dx + 'px';
                    s.width = p0.w - dx + 'px';
                } else {
                    s.left = 0;
                    s.width = p0.l + p0.w + 'px';
                }
            }
            if (/t/.test(m)) {
                dy = Math.min(dy, p0.h - this.minHeight);
                if (p0.t + dy >= 0) {
                    s.top = p0.t + dy + 'px';
                    s.height = p0.h - dy + 'px';
                } else {
                    s.top = 0;
                    s.height = p0.t + p0.h + 'px';
                }
            }
            if (/r/.test(m)) {
                dx = Math.max(dx, this.minWidth - p0.w);
                if (p0.l + p0.w + dx <= this.domNode.offsetWidth) {
                    s.width = p0.w + dx + 'px';
                } else {
                    s.width = this.domNode.offsetWidth - p0.l - 2 + 'px';
                }
            }
            if (/b/.test(m)) {
                dy = Math.max(dy, this.minHeight - p0.h);
                if (p0.t + p0.h + dy <= this.domNode.offsetHeight) {
                    s.height = p0.h + dy + 'px';
                } else {
                    s.height = this.domNode.offsetHeight - p0.t - 2 + 'px';
                }
            }

            if (ratio) {
                w = parseInt(s.width, 10);
                h = parseInt(s.height, 10);
                w2 = h * ratio;
                h2 = w / ratio;

                if (w2 < w) {
                    if (/l/.test(m)) {
                        s.left = parseInt(s.left, 10) + w - w2 + 'px';
                    }
                    w = w2;
                }
                if (h2 < h) {
                    if (/t/.test(m)) {
                        s.top = parseInt(s.top, 10) + h - h2 + 'px';
                    }
                    h = h2;
                }
                s.width = w + 'px';
                s.height = h + 'px';
            }
        }
    };

})();
