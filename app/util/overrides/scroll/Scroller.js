//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.scroll.Scroller', {
    override: 'Ext.scroll.Scroller',

    getMaxPosition: function () {
        var maxPosition = this.maxPosition,
            size, containerSize;

        if (!maxPosition) {
            size = this.getSize();
            containerSize = this.getContainerSize();

            this.maxPosition = maxPosition = {
                x: Math.max(0, size.x - containerSize.x),
                y: Math.max(0, size.y - containerSize.y)
            };

            this.fireEvent('maxpositionchange', this, maxPosition);
        }
        else if (maxPosition.y === 0) {
            try {
                if (this._element && this._element.dom) {
                    size = { x: this._element.dom.offsetWidth, y: this._element.dom.offsetHeight }
                    containerSize = { x: this._element.dom.parentElement.offsetWidth, y: this._element.dom.parentElement.offsetHeight }

                    this.maxPosition = maxPosition = {
                        x: Math.max(0, size.x - containerSize.x),
                        y: Math.max(0, size.y - containerSize.y)
                    }
                } else {
                    maxPosition = { x: 0, y: 0 };
                }
            } catch (ex) {
                console.log("Scroller Override Error" + ex.message);
                maxPosition = { x: 0, y: 0 };
            }
        }
        return maxPosition;
    },

    getSnapPosition: function (axis) {
        var snapSize = this.getSlotSnapSize()[axis],
            snapPosition = null,
            position,
            snapOffset,
            maxPosition,
            mod;

        if (snapSize !== 0 && this.isAxisEnabled(axis)) {
            position = this.position[axis];
            snapOffset = this.getSlotSnapOffset()[axis];
            maxPosition = this.getMaxPosition()[axis];

            if (position >= maxPosition) {
                return null;
            }

            mod = Math.floor((position - snapOffset) % snapSize);

            if (mod !== 0) {
                if (position !== maxPosition) {
                    if (Math.abs(mod) > snapSize / 2) {
                        snapPosition = Math.min(maxPosition, position + ((mod > 0) ? snapSize - mod : mod - snapSize));
                    } else {
                        snapPosition = position - mod;
                    }
                } else {
                    snapPosition = position - mod;
                }
            }
        }

        return snapPosition;
    }
});
