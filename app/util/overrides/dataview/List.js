//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.dataview.List', {
    override: 'Ext.dataview.List',
    
    scrollToItem: function (id, blnIsDefered) {
        var record, scroller,
            scrollable = this.getScrollable(),
            locID = id;
        if (scrollable) { scroller = scrollable.getScroller(); }

        // check if the container has a size
        if (!scrollable || scroller.getContainerSize().y === 0) {
            // wait and check again
            if (!blnIsDefered) {
                Ext.defer(function () {
                    this.scrollToItem(locID, true);
                }, 200, this);
            } else {
                var store = this.getStore();
                record = store.getById(locID);
                scroller.setSize({ x: 0, y: scroller._element.dom.offsetHeight });                
                this.scrollToRecord(record, false, false);                
            }
        } else {
            // call inbuilt Sencha function
            record = this.getStore().getById(id);
            this.scrollToRecord(record, false, false);
        }

    },
    /**
    *
    * Overidden because the store might now be empty, or not include that item anymore
    * Scrolls the list so that the specified record is at the top.
    *
    * @param record {Ext.data.Model} Record in the lists store to scroll to
    * @param animate {Boolean} Determines if scrolling is animated to a cut
    * @param overscroll {Boolean} Determines if list can be overscrolled
    */
    scrollToRecord: function (record, animate, overscroll) {
        var me = this,
            scroller = me.container.getScrollable().getScroller(),
            store = me.getStore(),
            index = store.indexOf(record),
            offset, item, maxOffset, size, containerSize;

        //stop the scroller from scrolling
        scroller.stopAnimation();

        //make sure the new offsetTop is not out of bounds for the scroller
        containerSize = scroller.getContainerSize().y;
        size = scroller.getSize().y;
        maxOffset = size - containerSize;

        if (me.getInfinite()) {
            offset = me.getItemMap().map[index];
        }
        else {
            item = me.listItems[index] || me.listItems[0];
            if (item) {
                if (me.getUseHeaders() && item.getHeader().isPainted()) {
                    offset = item.getHeader().renderElement.dom.offsetTop;
                }
                else {
                    offset = item.renderElement.dom.offsetTop;
                }
            } else {
                //the store is empty now don't scroll
                offset = 0;
            }
        }

        if (!overscroll) {
            offset = Math.min(offset, maxOffset);
        }

        scroller.scrollTo(0, offset, !!animate);
    }

});
