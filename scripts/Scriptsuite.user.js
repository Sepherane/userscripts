// ==UserScript==
// @name            The West Script Suite
// @include         http://*.the-west.*/game.php*
// @author          Slygoxx
// @grant           none
// @version         1.1
// @description     A collection of enhancements for the browsergame The West
// @updateURL       https://github.com/Sepherane/userscripts/raw/master/scripts/Scriptsuite.user.js
// @installURL      https://github.com/Sepherane/userscripts/raw/master/scripts/Scriptsuite.user.js
// @namespace       https://github.com/Sepherane
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
            Achievements: true
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
            achievements: 'http://i300.photobucket.com/albums/nn22/qwexrty/achievs_zps4c5d9ee3.jpg',
            settings: 'http://i300.photobucket.com/albums/nn22/qwexrty/settings_zpsa8c2f112.jpg',
            achievement_icon: 'http://i300.photobucket.com/albums/nn22/qwexrty/questbook2_zpsf9bfe431.png'
        },
        init: function() {
            Storage.prototype.setObject = function(key, value) {
                this.setItem(key, JSON.stringify(value));
            }

            Storage.prototype.getObject = function(key) {
                var value = this.getItem(key);
                return value && JSON.parse(value);
            }

            localStorage.getObject('SlySuite') == null ? localStorage.setObject('SlySuite', this.preferences) : $.extend(this.preferences, localStorage.getObject('SlySuite'));
            SlySuite.createSettingsButton();

            if (SlySuite.getPreference('KOTimer'))
                SlySuite.KOTimer.firstrun();

            $(setTimeout(function() {
                SlySuite.RiverColours.init();
                if (SlySuite.getPreference('RiverColours') != 'default')
                    SlySuite.RiverColours.changeColour();
            }, 5000));

            if (SlySuite.getPreference('Achievements'))
                SlySuite.Achievements.init();

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
            content += "</select><br />";
            this.getPreference('Achievements') == true ? check = " checked='checked'" : check = "";
            content += "<input type='checkbox' id='Achievements_checkbox'" + check + " onchange=\"SlySuite.setPreference('Achievements',this.checked)\"><label for='Achievements_checkbox'>Achievement tracker</label><br />";
            content += "<br /><br />";
            content += "Some settings might require a refresh to apply";
            content += "</div>";
            return content;
        }

    };

    SlySuite.KOTimer = {
        timeleft: 0,
        aliveAgain: 0,
        image: "<div style='position:relative;display:block;width:59px;height:59px;cursor:pointer;' id='knockouttimer'><div id='timer'></div></div>"
    };

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
    };

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

    SlySuite.Achievements = {
        achievementsList: {},
        allFolders: [],
        lastUpdate: new Date(0),
        init: function() {
            localStorage.getObject('SlySuite_Achievements') == null ? localStorage.setObject('SlySuite_Achievements', SlySuite.Achievements.achievementsList) : $.extend(this.achievementsList, localStorage.getObject('SlySuite_Achievements'));
            $(function() {
                setTimeout(function() {
                    SlySuite.Achievements.createWindow();
                    SlySuite.Achievements.editTracker();
                    SlySuite.Achievements.updateAchievements();

                    Ajax.remoteCall('achievement', '', {
                        playerid: Character.playerId
                    }, function(r) {
                        if (r.error) return new MessageError(r.msg).show();
                        for (f in r.menu) {
                            if (!('id' in r.menu[f])) continue;
                            if (r.menu[f].id == 'overall' || r.menu[f].id == 'heroics')
                                continue;
                            SlySuite.Achievements.allFolders.push(r.menu[f].id);
                            for (sub in r.menu[f].sub)
                                if ('id' in r.menu[f].sub[sub]) SlySuite.Achievements.allFolders.push(r.menu[f].sub[sub].id);
                        }
                    });

                }, 5000);
            });

            this.createButton();
        },
        createWindow: function() {
            if (typeof(Map.width) == 'undefined' || Map.width == 0) {
                setTimeout(SlySuite.Achievements.createWindow, 3000);
                return;
            }
            this.scrolling = new west.gui.Scrollpane(null).appendContent(
                "<div class='achievement_tracker_container' />"
            );
            this.window = wman.open('achievementtracker', null, 'chat questtracker noclose nofocus nocloseall dontminimize')
                .setMiniTitle('Achievement tracker')
                .setSize(350, 140)
                .setMinSize(320, 140)
                .addEventListener(TWE('WINDOW_MINIMIZE'), this.minimize, this)
                .addEventListener(TWE('WINDOW_DESTROY'), this.minimize, this)
                .addEventListener(TWE('WINDOW_RELOAD'), this.manualUpdate, this)
                .setResizeable(true)
                .appendToContentPane($("<div id='ui_achievementtracker'/>").append(this.scrolling.getMainDiv()));

            this.window.addTab('<div class="questbook" title="Achievement Tracker"></div> Achievement Tracker', 'achievementtracker', function() {});

            this.window.dontCloseAll = true;
            this.addCss();

            $(this.window.getMainDiv()).css({
                left: Map.width - 425,
                top: 400
            });
            $('._tab_id_achievementtracker .tw2gui_window_tab_text .questbook').css({
                'background-image': 'url(' + SlySuite.images.achievement_icon + ')'
            });
            $('#windows .tw2gui_window.questtracker .tw2gui_window_tabbar_tabs').attr({
                'style': 'left:2px !important;'
            });
        },
        createButton: function() {
            var bottom = $('<div></div>').attr({
                'class': 'menucontainer_bottom'
            });

            var icon = $('<div></div>').attr({
                'class': 'menulink',
                'title': "Open Achievement Tracker"
            }).css({
                'background-image': 'url(' + SlySuite.images.achievements + ')',
                'background-position': '0px 0px'
            }).mouseleave(function() {
                $(this).css("background-position", "0px 0px");
            }).mouseenter(function(e) {
                $(this).css("background-position", "-25px 0px");
            }).click(function() {
                SlySuite.Achievements.openWindow();
            });

            $('#ui_menubar .ui_menucontainer :last').after($('<div></div>').attr({
                'class': 'ui_menucontainer',
                'id': 'Achievementtracker_button'
            }).css({
                display: 'none'
            }).append(icon).append(bottom));
        },
        minimize: function() {
            $(this.window.divMain).hide();
            $('#Achievementtracker_button').show();
            wman.minimizedIds[this.window.id] = this.window;
        },
        openWindow: function() {
            $(this.window.divMain).show();
            $('#Achievementtracker_button').hide();
        },
        editTracker: function() {
            SlySuite.Achievements.oldTracker = Character.trackAchievement;
            Character.trackAchievement = function(a, b) {
                SlySuite.Achievements.trackAchievement(a, b);
            };
        },
        trackAchievement: function(progress, update) {
            if (!SlySuite.preferences.Achievements) {
                SlySuite.Achievements.oldTracker(progress, update);
                return;
            }
            var params = progress.split('-');
            // achievement done, track next one in group
            if (!update || params[2]) {
                var achvId = (params[2]) ? params[2] : params[0];
                this.setAchievement(achvId);
            } else {
                this.setAchievement(params[1]);
            }

        },
        setAchievement: function(achi) {
            if (achi in this.achievementsList) {
                delete this.achievementsList[achi];
                this.removeFromTracker(achi);
                localStorage.setObject('SlySuite_Achievements', SlySuite.Achievements.achievementsList);
            } else {
                this.achievementsList[achi] = new Object();

                this.getAchievementData(achi);
            }
        },
        manualUpdate: function() {
            if (this.lastUpdate.getTime() < new Date().getTime() - 60000) {
                this.window.showLoader();
                clearTimeout(this.nextUpdate);
                this.updateAchievements();
                this.lastUpdate = new Date();
                this.window.hideLoader();
            } else {
                secleft = 60 - Math.floor((new Date().getTime() - this.lastUpdate.getTime()) / 1000);
                new MessageError("Updated too recently, try again in " + secleft + "s").show();
            }

        },
        updateTracker: function(achi) {
            if (this.achievementsList[achi].current >= this.achievementsList[achi].required) {
                this.setAchievement(achi);
                return;
            }

            if ($('#ui_achievementtracker #achievementtracker_' + achi).length > 0) {
                $('#ui_achievementtracker #achievementtracker_' + achi + ' .achievement_current').html(this.achievementsList[achi].current);
                $('#ui_achievementtracker #achievementtracker_' + achi + ' .achievement_percentage').html(Math.floor(this.achievementsList[achi].current / this.achievementsList[achi].required * 100));
            } else {
                $('#ui_achievementtracker .achievement_tracker_container').append('<div class="selectable" id="achievementtracker_' + achi + '">' +
                    '<div class="quest-list title">' + this.achievementsList[achi].title +
                    '<span class="quest-list remove" title="Remove achievement from tracker"></span></div>' +
                    '<ul class="requirement_container"><li class="quest_requirement">- <span class="achievement_current">' + this.achievementsList[achi].current +
                    '</span> / <span class="achievement_required">' + this.achievementsList[achi].required + '</span> (<span class="achievement_percentage">' +
                    (Math.floor(this.achievementsList[achi].current / this.achievementsList[achi].required * 100)) + '</span>%)</li></ul></div>');
                $('#ui_achievementtracker #achievementtracker_' + achi + ' .quest-list.remove').click(function() {
                    SlySuite.Achievements.setAchievement(achi);
                });
            }
        },
        getAchievementData: function(achi) {
            Ajax.remoteCall('achievement', 'track', {
                achvid: achi
            }, function(resp) {
                if (resp.error) return new MessageError(resp.msg).show();
                $.extend(SlySuite.Achievements.achievementsList[achi], {
                    title: resp.title,
                    current: resp.current,
                    required: resp.required
                });
                SlySuite.Achievements.updateTracker(achi);
                Ajax.remoteCall('achievement', 'untrack');
                localStorage.setObject('SlySuite_Achievements', SlySuite.Achievements.achievementsList);
            });
        },
        removeFromTracker: function(achi) {
            $('#ui_achievementtracker #achievementtracker_' + achi).remove();
        },
        updateAchievements: function() {
            for (a in SlySuite.Achievements.achievementsList) {
                SlySuite.Achievements.getAchievementData(a);
            }
            SlySuite.Achievements.nextUpdate = setTimeout(SlySuite.Achievements.updateAchievements, 10 * 60 * 1000);
        },
        queryServer: function(arr) {

        },
        addCss: function() {
            achievementCss = '';
            achievementCss += "#ui_achievementtracker .quest-list.title {margin-left:5px;color: #DBA901;font-weight: bold;display:inline-block;zoom:1;}\n";
            achievementCss += "#ui_achievementtracker .selectable:hover .quest-list.remove {display:inline-block;zoom:1;cursor:pointer;}\n";
            achievementCss += "#ui_achievementtracker .quest-list.remove {background: url('/images/chat/windowicons.png') no-repeat -120px 0px;width: 12px; height: 12px; margin-left:5px;margin-bottom:-2px;}\n";
            achievementCss += "div#ui_achievementtracker { width: 100%; height: 100%; display:block;}"

            var style = document.createElement('style');
            style.textContent = achievementCss;
            document.body.appendChild(style);
        }

    };








    SlySuite.init();
});