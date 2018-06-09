$(function(){
    window.Sing = {
        screens: {
            'xs-max': 767,
            'sm-min': 768,
            'sm-max': 991,
            'md-min': 992,
            'md-max': 1199,
            'lg-min': 1200
        },
        isScreen: function(size){
            var screenPx = window.innerWidth;
            return (screenPx >= this.screens[size + '-min'] || size == 'xs') && (screenPx <= this.screens[size + '-max'] || size == 'lg');
        },
        getScreenSize: function(){
            var screenPx = window.innerWidth;
            if (screenPx <= this.screens['xs-max']) return 'xs';
            if ((screenPx >= this.screens['sm-min']) && (screenPx <= this.screens['sm-max'])) return 'sm';
            if ((screenPx >= this.screens['md-min']) && (screenPx <= this.screens['md-max'])) return 'md';
            if (screenPx >= this.screens['lg-min']) return 'lg';
        }
    };
    var SingSettingsBundle = function(){
        var defaultSettings =  {'nav-static': false};
        this.settingName = 'sing-app-settings';
        this._settings = JSON.parse(localStorage.getItem(this.settingName)) || defaultSettings;
    };
    SingSettingsBundle.prototype.save = function(){
        localStorage.setItem(this.settingName, JSON.stringify(this._settings));
        return this;
    };
    SingSettingsBundle.prototype.get = function(key){
        return this._settings[key];
    };
    SingSettingsBundle.prototype.set = function(key, value){
        this._settings[key] = value;
        return this;
    };
    window.SingSettings = new SingSettingsBundle();
});