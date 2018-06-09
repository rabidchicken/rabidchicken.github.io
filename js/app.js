window.PJAX_ENABLED = false;
window.DEBUG = false;
$(function(){
    var SingAppView = function(){
        this.pjaxEnabled = window.PJAX_ENABLED;
        this.debug = window.DEBUG;
        this.navCollapseTimeout = 2500;
        this.$sidebar = $('#sidebar');
        this.$content = $('#content');
        this.$loaderWrap = $('.loader-wrap');
        this.$navigationStateToggle = $('#nav-state-toggle');
        this.$navigationCollapseToggle = $('#nav-collapse-toggle');
        this.settings = window.SingSettings;
        this.pageLoadCallbacks = {};
        this.resizeCallbacks = [];
        this.screenSizeCallbacks = {
            xs:{enter:[], exit:[]},
            sm:{enter:[], exit:[]},
            md:{enter:[], exit:[]},
            lg:{enter:[], exit:[]}
        };
        this.loading = false;
        this._resetResizeCallbacks();
        this._initOnResizeCallbacks();
        this._initOnScreenSizeCallbacks();
        this.$sidebar.on('mouseenter', $.proxy(this._sidebarMouseEnter, this));
        this.$sidebar.on('mouseleave', $.proxy(this._sidebarMouseLeave, this));
        $(document).on('click', '.nav-collapsed #sidebar', $.proxy(this.expandNavigation, this));
        this.checkNavigationState();
        this.$navigationStateToggle.on('click', $.proxy(this.toggleNavigationState, this));
        this.$navigationCollapseToggle.on('click', $.proxy(this.toggleNavigationCollapseState, this));
        this.$sidebar.find('.collapse').on('show.bs.collapse', function(e){
            if (e.target != e.currentTarget) return;
            var $triggerLink = $(this).prev('[data-toggle=collapse]');
            $($triggerLink.data('parent')).find('.collapse.in').not($(this)).collapse('hide');
        })
            .on('show.bs.collapse', function(e){
                if (e.target != e.currentTarget) return;
                $(this).closest('li').addClass('open');
            }).on('hide.bs.collapse', function(e){
                if (e.target != e.currentTarget) return;
                $(this).closest('li').removeClass('open');
            });
        window.onerror = $.proxy(this._logErrors, this);
    };
    SingAppView.prototype._initOnResizeCallbacks = function(){
        var resizeTimeout,
            view = this;
        $(window).on('resize sing-app:content-resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function(){
                view._runPageCallbacks(view.pageResizeCallbacks);
                view.resizeCallbacks.forEach(function(fn){
                    fn();
                });
            }, 100);
        });
    };
    SingAppView.prototype._initOnScreenSizeCallbacks = function(){
        var resizeTimeout,
            view = this,
            prevSize = Sing.getScreenSize();
        $(window).resize(function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function(){
                var size = Sing.getScreenSize();
                if (size != prevSize){
                    view.screenSizeCallbacks[prevSize]['exit'].forEach(function(fn){
                        fn(size, prevSize);
                    });
                    view.screenSizeCallbacks[size]['enter'].forEach(function(fn){
                        fn(size, prevSize);
                    });
                    view.log('screen changed. new: ' + size + ', old: ' + prevSize);
                }
                prevSize = size;
            }, 100);
        });
    };
    SingAppView.prototype._resetResizeCallbacks = function(){
        this.pageResizeCallbacks = {};
    };
    SingAppView.prototype.checkNavigationState = function(){
        if (this.isNavigationStatic()){
            this.staticNavigationState();
            if (Sing.isScreen('sm') || Sing.isScreen('xs')){
                this.collapseNavigation();
            }
        } else {
            if (Sing.isScreen('md') || Sing.isScreen('lg')){
                var view = this;
                setTimeout(function(){
                    view.collapseNavigation();
                }, this.navCollapseTimeout);
            } else {
                this.collapseNavigation();
            }
        }
    };
    SingAppView.prototype.toggleNavigationCollapseState = function(){
        if ($('body').is('.nav-collapsed')){
            this.expandNavigation();
        } else {
            this.collapseNavigation();
        }
    };
    SingAppView.prototype.collapseNavigation = function(){
        if (this.isNavigationStatic() && (Sing.isScreen('md') || Sing.isScreen('lg'))) return;
        $('body').addClass('nav-collapsed');
        this.$sidebar.find('.collapse.in').collapse('hide')
            .siblings('[data-toggle=collapse]').addClass('collapsed');
    };
    SingAppView.prototype.expandNavigation = function(){
        if (this.isNavigationStatic() && (Sing.isScreen('md') || Sing.isScreen('lg'))) return;
        $('body').removeClass('nav-collapsed');
        this.$sidebar.find('.active .active').closest('.collapse').collapse('show')
            .siblings('[data-toggle=collapse]').removeClass('collapsed');
    };
    SingAppView.prototype._sidebarMouseEnter = function(){
        if (Sing.isScreen('md') || Sing.isScreen('lg')){
            this.expandNavigation();
        }
    };
    SingAppView.prototype._sidebarMouseLeave = function(){
        if (Sing.isScreen('md') || Sing.isScreen('lg')){
            this.collapseNavigation();
        }
    };
    SingAppView.prototype._collapseNavIfSmallScreen = function(){
        if (Sing.isScreen('xs') || Sing.isScreen('sm')){
            this.collapseNavigation();
        }
    };
    SingAppView.prototype.toggleNavigationState = function(){
        if (this.isNavigationStatic()){
            this.collapsingNavigationState();
        } else {
            this.staticNavigationState();
        }
        $(window).trigger('sing-app:content-resize');
    };
    SingAppView.prototype.staticNavigationState = function(){
        this.settings.set('nav-static', true).save();
        $('body').addClass('nav-static');
    };
    SingAppView.prototype.collapsingNavigationState = function(){
        this.settings.set('nav-static', false).save();
        $('body').removeClass('nav-static');
        this.collapseNavigation();
    };
    SingAppView.prototype.isNavigationStatic = function(){
        return this.settings.get('nav-static') === true;
    };
    SingAppView.prototype._changeActiveNavigationItem = function(event, xhr, options){
        var $newActiveLink = this.$sidebar.find('a[href*="' + this.extractPageName(options.url) + '"]').filter(function(){
            return this.href === options.url;
        });
        if (!$newActiveLink.is('.active > .collapse > li > a')){
            this.$sidebar.find('.active .active').closest('.collapse').collapse('hide');
        }
        this.$sidebar.find('.active').removeClass('active');
        $newActiveLink.closest('li').addClass('active')
            .parents('li').addClass('active');
    };
    SingAppView.prototype.onResize = function(fn, allPages){
        allPages = typeof allPages !== 'undefined' ? allPages : false;
        if (allPages){
            this.resizeCallbacks.push(fn);
        } else {
            // this._addPageCallback(this.pageResizeCallbacks, fn);
        }
    };
    SingAppView.prototype.onScreenSize = function(size, fn, onEnter){
        onEnter = typeof onEnter !== 'undefined' ? onEnter : true;
        this.screenSizeCallbacks[size][onEnter ? 'enter' : 'exit'].push(fn)
    };
    SingAppView.prototype.extractPageName = function(url){
        var pageName = url.split('#')[0].substring(url.lastIndexOf("/") + 1).split('?')[0];
        return pageName === '' ? 'index.html' : pageName;
    };
    window.SingApp = new SingAppView();
});