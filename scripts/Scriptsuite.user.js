// ==UserScript==
// @name            The West Script Suite
// @include         http://*.the-west.*/game.php*
// @author          Slygoxx
// @grant           none
// @version         1.0
// @description     A collection of enhancements for the browsergame The West
// @updateURL       https://github.com/Sepherane/userscripts/raw/master/scripts/Scriptsuite.user.js
// @installURL      https://github.com/Sepherane/userscripts/raw/master/scripts/Scriptsuite.user.js
// ==/UserScript==

function runScript(source) {
    if ('function' == typeof source) {
        source = '(' + source + ')();'
    }
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = source;
    document.body.appendChild(script);
    document.body.removeChild(script);
}

runScript(function() {

    SlySuite = {
        preferences: {
            KOTimer: true,
            RiverColours: "default",
            Experience: false,
            Achievements: false
        },
        possibleRiverColours: {
            Default: 'default',
            Red: 'halloween',
            Green: 'paddy',
            Pink: 'valentine',
            Blue: ''
        },
        getPreference: function(pref) {
            return this.preferences[pref];
        },
        setPreference: function(pref, val) {
            if (pref == 'RiverColours')
                SlySuite.RiverColours.changeColour();

            this.preferences[pref] = val;
            localStorage.setObject('SlySuite', this.preferences);


        },
        images: {
            achievs: 'http://i300.photobucket.com/albums/nn22/qwexrty/achievs_zps4c5d9ee3.jpg',
            settings: 'http://i300.photobucket.com/albums/nn22/qwexrty/settings_zpsa8c2f112.jpg'
        },
        init: function() {
            Storage.prototype.setObject = function(key, value) {
                this.setItem(key, JSON.stringify(value));
            }

            Storage.prototype.getObject = function(key) {
                var value = this.getItem(key);
                return value && JSON.parse(value);
            }

            localStorage.getObject('SlySuite') == null ? localStorage.setObject('SlySuite', this.preferences) : this.preferences = localStorage.getObject('SlySuite');
            SlySuite.createSettingsButton();
            if (SlySuite.getPreference('KOTimer'))
                SlySuite.KOTimer.firstrun();
            $(setTimeout(function() {
                SlySuite.RiverColours.init();
                if (SlySuite.getPreference('RiverColours') != 'default')
                    SlySuite.RiverColours.changeColour();
            }, 5000));

        },
        createSettingsButton: function() {

            var bottom = $('<div></div>').attr({
                'class': 'menucontainer_bottom'
            });

            var icon = $('<div></div>').attr({
                'class': 'menulink',
                'title': "Script suite settings"
            }).css({
                'background-image': 'url(' + this.images.settings + ')',
                'background-position': '0px 0px'
            }).mouseleave(function() {
                $(this).css("background-position", "0px 0px");
            }).mouseenter(function(e) {
                $(this).css("background-position", "-25px 0px");
            }).click(function() {
                SlySuite.openSettings();
            });

            $('#ui_menubar .ui_menucontainer :last').after($('<div></div>').attr({
                'class': 'ui_menucontainer',
                'id': 'SlySuite_settings_icon'
            }).append(icon).append(bottom));
        },
        createAchievementsButton: function() {

        },
        openSettings: function() {
            content = this.generateWindowContent();
            var win = wman.open("SlySuite", "Script Suite Settings").setResizeable(true).setMinSize(450, 400).setSize(450, 400);
            win.appendToContentPane(content);
        },
        generateWindowContent: function() {
            content = "";
            content += "<div style=\"margin-left:5px;\">";
            this.getPreference('KOTimer') == true ? check = " checked='checked'" : check = "";
            content += "<input type='checkbox' id='KOtimer_checkbox'" + check + " onchange=\"SlySuite.setPreference('KOTimer',this.checked)\"><label for='KOtimer_checkbox'>Knockout Timer</label><br />";
            content += "River colour ";
            content += "<select onchange=\"SlySuite.setPreference('RiverColours',this.value);\">";
            colours = SlySuite.possibleRiverColours;
            for (c in colours) {
                if (SlySuite.getPreference('RiverColours') == colours[c])
                    content += "<option selected='selected' value=\"" + colours[c] + "\">" + c + "</option>";
                else
                    content += "<option value=\"" + colours[c] + "\">" + c + "</option>";

            }
            content += "</select>";
            content += "<br /><br />";
            content += "Some settings require a refresh to apply.";
            content += "</div>";
            return content;
        }

    };

    SlySuite.KOTimer = {
        timeleft: 0,
        aliveAgain: 0,
        image: "<div style='position:relative;display:block;width:59px;height:59px;cursor:pointer;' id='knockouttimer'><div id='timer'></div></div>"
    }

    SlySuite.KOTimer.firstrun = function() {

        if ($('.game_notification_area').length > 0) {
            $('.game_notification_area').append(this.image);
        } else {
            setTimeout(SlySuite.KOTimer.firstrun, 3000);
            console.log('Couldn\'t find the notification area, trying again soon...');
            return;
        }
        $('#knockouttimer').css('background-image', 'url("http://i300.photobucket.com/albums/nn22/qwexrty/knockout_sprite_zps97503234.png")');

        $('#knockouttimer #timer').css({
            'position': 'absolute',
            'bottom': '0px',
            'left': '0px',
            'right': '0px',
            'color': 'white',
            'text-align': 'center',
            'font-size': '11px',
            'height': '30px',
            'line-height': '30px'
        });

        SlySuite.KOTimer.retrieveTimeleft();
        SlySuite.KOTimer.update();
    };

    SlySuite.KOTimer.retrieveTimeleft = function() {
        if (Character.homeTown.town_id != 0) // Can only request the info when you're in a town
        {
            $.post("game.php?window=building_sheriff&mode=index", {
                town_id: Character.homeTown.town_id
            }, function(data) {
                SlySuite.KOTimer.timeleft = data.timeleft;
                SlySuite.KOTimer.aliveAgain = Math.round(new Date().getTime() / 1000) + data.timeleft;
            });
        } else // We'll hide the image when you're not in a town
        {
            SlySuite.KOTimer.aliveAgain = 0;
            $('#knockouttimer').hide();

        }
        setTimeout(SlySuite.KOTimer.retrieveTimeleft, 300000); // And we'll do it again in 5 minutes
    };

    SlySuite.KOTimer.update = function() {
        var unix = Math.round(new Date().getTime() / 1000);
        aliveAgain = SlySuite.KOTimer.aliveAgain;
        if (aliveAgain < unix) {
            $('#knockouttimer').hide();
            setTimeout(SlySuite.KOTimer.update, 10000);
            return;
        } else
            $('#knockouttimer').show();

        difference = aliveAgain - unix;
        hours = Math.floor(difference / 60 / 60);
        difference -= hours * 60 * 60;
        minutes = Math.floor(difference / 60);
        difference -= minutes * 60;

        if (hours == 0 && minutes == 0)
            $('#knockouttimer #timer').html(Math.round(difference) + 's');
        else if (hours == 0)
            $('#knockouttimer #timer').html(minutes + 'm');
        else
            $('#knockouttimer #timer').html(hours + 'h:' + minutes + 'm');

        setTimeout(SlySuite.KOTimer.update, 1000);

    };
    SlySuite.RiverColours = {
        initialized: false
    }

    SlySuite.RiverColours.init = function() {
        if (typeof(Map.Helper) == 'undefined')
            return;
        SlySuite.RiverColours.initialized = true;
        SlySuite.RiverColours.oldScript = Map.Helper.imgPath.lookForModification.bind({});
        Map.Helper.imgPath.lookForModification = function(path, d) {
            if (/river|deco_egg_05|quests_fluss/.test(path) && SlySuite.getPreference('RiverColours') != 'default') {
                return SlySuite.getPreference('RiverColours') + '/' + path;
            } else
                return SlySuite.RiverColours.oldScript(path, d);

        }
        SlySuite.RiverColours.changeColour = function() {
            Map.Helper.imgPath.clearCache();
            Map.refresh(true);
        }
    };









    SlySuite.init();
});