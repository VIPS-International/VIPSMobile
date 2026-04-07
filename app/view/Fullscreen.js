//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define("VIPSMobile.view.Fullscreen", {
    extend: "Ext.Panel",

    config: {
        centered: true, //add this to center it on screen
        showAnimation: 'slideIn',
        hideAnimation: 'slideOut',
        scrollable: 'both',
        items:[{
            xtype: 'titlebar',
            docked: 'top',
            items: [{
                xtype: 'button',
                text: 'X', //or if you want an icon use iconCls
                align: 'right',
                handler: function (){
                    this.getParent().getParent().getParent().hide();
                }
            }]      
        }]
    },
    
    setup: function (strHTML) {
        
        this.add({ html: strHTML });
        this.setHeight(Ext.Viewport.getWindowHeight());
        this.setWidth(Ext.Viewport.getWindowWidth());
      
    }

});
