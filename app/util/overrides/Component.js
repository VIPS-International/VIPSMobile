//Copyright 2014 - 2026 Free Software Foundation, Inc.
//Copyright 2026 VIPS International Pty Ltd
//This file is part of VIPS Mobile
//SPDX - License - Identifier: GPL - 2.0 - or - later

Ext.define('VIPSMobile.util.overrides.Component', {
    override: 'Ext.Component'
    ,

    // apply any localization to displayed text
    doSetDisabled: function (disabled) {

        if (this.element) {
            this.element[disabled ? 'addCls' : 'removeCls'](this.getDisabledCls());
        }

    },

    animateFn: function (animation, component, newState, oldState, options, controller) {
        var onEndInvoked, onEnd, me = this;
        if (animation && (!newState || (newState && this.isPainted()))) {
            
            this.activeAnimation = new Ext.fx.Animation(animation);
            this.activeAnimation.setElement(component.element);
            
            if (!Ext.isEmpty(newState)) {
                onEndInvoked = false;
                onEnd = function () {
                    if (!onEndInvoked) {
                        onEndInvoked = true;
                        me.activeAnimation = null;
                        controller.resume();
                    }
                };


                this.activeAnimation.setOnEnd(onEnd);
                window.setTimeout(onEnd, 50 + (this.activeAnimation.getDuration() || 500));


                controller.pause();
            }


            Ext.Animator.run(me.activeAnimation);
        }
    }

});
