/*
 * TODO:
 *  Hook MORE functions
 *  Better Connection UI?
 *  Have the audio randomizer be based on the current APWorld seed
 *  Have the "pallet" randomizer be based on the world seed
 *  Rebindable chat button.
 *
 */
window.APMod = {}
APMod.server = "localhost:38281";
APMod.slot = "Siffrin";
APMod.password = "";
const game = "In Stars And Time";
let deathLinkDeath = false;

APMod.BaseId = {};
APMod.BaseId.Skill = 1677310
APMod.BaseId.Item = 1677310 + 240
APMod.BaseId.Weapon = 1677310 + 240 + 100
APMod.BaseId.Armor = 1677310 + 240 + 100 + 60
APMod.BaseId.Misc = 1677310 + 240 + 100 + 60 + 100

export const config = {
    name: "Archipelago",
    author: "Lanausse, SharkCheeses",
    description: "Archipelago Multiworld Randomizer",
    version: "0.0.9",

    settings: {
        server: {
            title: "Server",
            helpMessage: "Set the AP server address.",
            type: "button",
            onOk: async () => {
                APMod.server = await prompt("AP Server", APMod.server);
                console.debug(APMod.server);
            }
        },
        name: {
            title: "Slot Name",
            helpMessage: "Set the AP slot name.",
            type: "button",
            onOk: async () => {
                APMod.slot = await prompt("Name", APMod.slot);
            }
        },
        password: {
            title: "Password",
            helpMessage: "Set the AP server password.",
            type: "button",
            onOk: async () => {
                APMod.password = await prompt("Password", APMod.password);
            }
        },
        connect: {
            title: "Connect",
            helpMessage: "Connect to the AP server.",
            type: "button",
            onOk: () => {
                APMod.connect();
                SoundManager.playLoad();
            }
        },

        chatLabel : {
            title: "Text Chat Settings",
            type: "label",
        },
        chatStyle: {
            title: "Style",
            helpMessage: "Change how the text chat looks.",
            type: "pick",
            choices: ["Transparent", "Opaque"],
            default: 0
        },
        chatWidth: {
            title: "Width",
            helpMessage: "Set the width of the text chat.",
            type: "scale",
            min: 26,
            max: 100,
            step: 1,
            default: 50,
                suffix: "%"
        },
        chatTransparency: {
            title: "Transparency",
            helpMessage: "Set the transparency of the text chat. (Style must be set to Transparent)",
            type: "scale",
            min: 0,
            max: 100,
            step: 5,
            default: 60,
                suffix: "%"
        }

    }

    //forceDisable: () => platform() !== "linux"
}

const enemyRandomIds = [
    1, 2, 3, 4, 5, 6, 7, 8,
    11, 12, 13, 14, 15, 16,
    17, 18, 19, // NOSTALGIE
    20, // Tutorial Kid
    21, 22, 23, 24, // Mini-Boss
    26, 27, 28, 29, 30, 31, 34, 35, // Bosses
    37, 38, 39, // Tutorial
    40, // Test baby
    42, 43, 44, 46, 47,
    50, 51, 52,
    54, 55, 56, 57, 58, 59, 60, 61,
    63, 64


];

const deathMessages = [
    "({0} died.)",
    "({0} failed you.)",
    "({0} got you killed.)",
    "(Back to the stage, {0}!)",
    "(In this moment, {0} was loved.)",
    "({0} murdered you across realities.)",
    "({0} never fails!!! (except today))",
    "({0} told you they liked croissants.)",
    "({0} fed you Pineapple Slices.)",
    "({0} is broken, failing, rotting.)",
    "({0} might also be stuck in a timeloop.)",
    "({0} realized you're timelooping.)",
    "(Cya, {0}!)",
    "({0} stubbed their toe)",
    "({0} saw a vision of the future.)"
]

let skillIdToActorName = {};
[10,11,12,13,14,15,16,17,18,20,155,156,157,160,182,183,184,185,186].forEach(function(id){ skillIdToActorName[id] = "Siffrin" });
[32,33,34,35,36,37,38,36,40].forEach(function(id){ skillIdToActorName[id] = "Mirabelle" });
[22,23,24,25,26,27,28,29].forEach(function(id){ skillIdToActorName[id] = "Isabeau" });
[42,43,44,45,46,47,48,49,50].forEach(function(id){ skillIdToActorName[id] = "Odile" });
[52,53,54,55,56,57,58,59].forEach(function(id){ skillIdToActorName[id] = "Bonnie" });

// Forgot where I stole this from 
function format(str, ...values) {
  return str.replace(/{(\d+)}/g, function(match, index) {
    return typeof values[index] !== "undefined" ? values[index] : match;
  });
}

function doDeath(slot, time, cause) {
    deathLinkDeath = true;
    if ($gameParty.inBattle()) {
        $gameScreen.startShake(5, 4, 30)
        $gameParty.members().forEach(function(actor) {
            Game_Interpreter.prototype.changeHp(actor, -99999, true)
            actor.performCollapse();
        });
    } else if ( APMod.Utils.getAct() == 5 ) {
        $gameTemp._commonEventId = 28;
    } else {
        $gameTemp._commonEventId = 321; // AgiReset
        $gameTemp._commonEventId = 107; // DeathSwitchesOFF
        $gameTemp._commonEventId = 108; // GAMEOVER_Teleport
    }

    if (cause) {
        $gameMessage._positionType = 1;
        $gameMessage._texts[0] = `(${cause})`;
    } else {
        $gameMessage._positionType = 1;
        $gameMessage._texts[0] = format(deathMessages[Math.round(Math.random()*deathMessages.length)-1], slot);
    }
        
}

function doCommonEventHook(command) {
    let eventId = command.parameters[0]
    console.debug(`Calling Event ${$dataCommonEvents[eventId].name} : ${eventId}`)

    switch (eventId) {
        case 108:
        case 109:
        case 310:
        case 115: // Deathlink

            if (deathLinkDeath) {
                deathLinkDeath = false;
                break;
            }

            
            let playerName = APMod.client.players.self.name;
            let loopCount = APMod.Utils.getLoops();
            let act = APMod.Utils.getAct();

            // Default.
            let deathReasons = [
                "{0} died.",
                "{0} doesn't know how long they can keep doing this.",
                "{0} has heard this one before.",
                "{0} is stuck in a prison of their own making.",
                "The end is inevitable. {0} plays along.",
                "{0} is out of time.",
                "{0} feels a tug on their stomach."
            ];

            // I'm basicly recreting GAMEOVER_Picture's logic in JS.
            let random = Math.round(Math.random()*49);

            if (loopCount >= 20) {
                random +=2
            }

            switch(act) {
                case 3:
                    random += 3;
                    break;
                case 4:
                    random +=5;
                    break;
            }

            // I HATE THIS SO MUCH YOU HAVE NO IDEA ;-;

            let deathReason = "{0} died."

            if ($gameSwitches._data[106]) { // HHM Reset
                deathReasons = ["{1} FEELS A TUG ON THEIR STOMACH.", "The curtain falls for {0}.", "Something's broken, failing, rotting."];

                if ($gameVariables._data[106] = 1) { // HHM Reset #
                    deathReason = deathReasons[0];
                } else {
                    deathReason = deathReasons[random%3];
                }
            }

            if ($gameSwitches._data[114]) { // Suicide Death
                deathReasons = ["{0} killed themselfs.", "{0} saved themselfs some time."];

                if ($gameVariables._data[110] <= 3) { // Suicide Death #
                    deathReason = deathReasons[0];
                } else {
                    deathReason = deathReasons[1];
                }
            }

            if ($gameSwitches._data[113]) { // Pineapple Death
                deathReasons = ["{0} is allergic to pineapples.", "{0} is hungry still."];

                if ($gameVariables._data[109] = 0) { // Pineapple Death #
                    deathReason = "{0} choked on a pineapple slice...?";
                } else {
                    deathReason = deathReasons[random%2];
                }
            }

            if ($gameSwitches._data[102]) { // Banana Death
                deathReasons = ["{0} slipped on a banana peel.", "{0} is a living comedy sketch.", "{0} broke their head open on a rock."];

                if ($gameVariables._data[102] <= 1) { // Banana Death #
                    deathReason = deathReasons[0];
                } else {
                    let mod = 2;
                    if (act > 2) mod = 3;
                    deathReason = deathReasons[random%mod];
                }
            }

            if ($gameSwitches._data[104]) { // King Death
                deathReasons = ["The King killed {0}.", "The King killed {0} again.", "One more time."];

                if ($gameVariables._data[104] <= 1) { // King Death #
                    deathReason = "The King killed {0}."
                } else {
                    deathReason = deathReasons[random%3];
                }
            }

            if ($gameSwitches._data[105]) { // Tears Death
                deathReasons = ["A Tear froze {0} in time.", "{0} had a good sleep.", "{0} froze themselfs in time."];

                if ($gameVariables._data[105] <= 1) { // Tears Death #
                    deathReason = "A Tear froze {0} in time."
                } else {
                    let mod = 2;
                    if (act > 2) mod = 3;
                    deathReason = deathReasons[random%mod];
                }
            }

            if ($gameSwitches._data[103]) { // Monster Death
                deathReasons = ["{0} died saving their friends.", "A Sadness killed {0}.", "Sadness tore {0} apart."];

                if ($gameVariables._data[103] <= 1) { // Monster Death #
                    deathReason = "{0} died saving their friends.";
                } else {
                    let mod = 2;
                    if (act > 2) mod = 3;
                    deathReason = deathReasons[random%mod];
                }
            };

            if ($gameSwitches._data[112]) { // First trap death
                deathReasons = ["{0} forgot about the trap.", "{0} felt safe.", "{0} is stupid and forgetful."];

                if ($gameVariables._data[24] <= 1) { // FirstTrap Death #
                    deathReason = "{0} got crushed.";
                } else {
                    deathReason = deathReasons[random%3];
                }
            }

            if (random == 51) {
                deathReasons = [
                    "{0} died.",
                    "{0} doesn't know how long they can keep doing this.",
                    "{0} has heard this one before.",
                    "{0} is stuck in a prison of their own making.",
                    "The end is inevitable. {0} plays along.",
                    "{0} is out of time.",
                    "{0} feels a tug on their stomach."
                ];
                deathReason = deathReasons[Math.round(Math.random()*deathReason.length)];
            }

            switch ($gameVariables._data[24]) { // !!!Kingquest
                case 12:
                    deathReason = "GO BACK GO BACK GO BACK GO BACK";
                    break;

                case 10:
                    deathReason = "BUT IT'S ALL GONE!!!!!!";
                    break;
            }

            if ($gameSwitches._data[119]) { // FriendquestReset
                switch($gameVariables._data[111]) { // FriendquestResets
                    case 1:
                        deathReason = "In this moment, {0} was loved.";
                        break;
                    default:
                        deathReason = "Again, again, again!";
                        break;
                }
            }

            //let deathReason = "{0} died.";

            //if ($gameSwitches._data[102]) deathReasons = ["{0} slipped on a banana peel.", "{0} broke their head open on a rock.", "{0} is a living comedy sketch."];
            //if ($gameSwitches._data[103]) deathReasons = ["{0} died saving their friends.", "A Sadness killed {0}.", "Sadness tore {0} apart."];
            //if ($gameSwitches._data[104]) deathReasons = ["The King killed {0}.", "The King killed {0} again."];
            //if ($gameSwitches._data[105]) deathReasons = ["A Tear froze {0} in time.", "{0} had a good sleep.", "{0} froze themselfs in time."];
            //if ($gameSwitches._data[106]) deathReasons = ["{1} FEELS A TUG ON THEIR STOMACH.", "The curtans falls.", "Something's broken, failing, rotting.", "{0} got to the end."];
            //if ($gameSwitches._data[109]) deathReasons = ["GO BACK GO BACK GO BACK GO BACK"];


            APMod.client.deathLink.sendDeathLink(playerName, format(deathReason, playerName, playerName.toUpperCase()));
            break;
        
        case 103: // (LOOP_items) Resets your inventory.
            command.code = 0;
        case 170: // (Repair) Empty event that gets called on a save load.
            APMod.Items.resetInventory();
            break;

        case 105: // (LOOP_PartyLvlsnSkills) Resets your party's Level 7 Skills. Lets only reset their level.
            let keySelector =  $gameVariables._data[131];
            let isabeau_EXP = 104287;
            let mirabelle_EXP = 112486;
            let odile_EXP = 104287;

            // Reimplementing LOOP_PartyLvlsnSkills in js.
            switch ($gameVariables._data[134]) { // LoopResetSwitches
                case 1: // Dormont
                    isabeau_EXP = 104287;
                    mirabelle_EXP = 112486;
                    odile_EXP = 104287;
                    break;

                case 2: // Floor 1
                    if (keySelector <= 1) {
                        isabeau_EXP = $gameVariables._data[184];
                        mirabelle_EXP = $gameVariables._data[185];
                        odile_EXP = $gameVariables._data[186];
                    } else {
                        isabeau_EXP = $gameVariables._data[194];
                        mirabelle_EXP = $gameVariables._data[195];
                        odile_EXP = $gameVariables._data[196];
                    }
                    break;

                case 3: // Floor 2
                    if (keySelector <= 1) {
                        isabeau_EXP = $gameVariables._data[203];
                        mirabelle_EXP = $gameVariables._data[204];
                        odile_EXP = $gameVariables._data[205];
                    } else {
                        isabeau_EXP = $gameVariables._data[213];
                        mirabelle_EXP = $gameVariables._data[214];
                        odile_EXP = $gameVariables._data[215];
                    }
                    break;

                case 4: // Floor 3
                    if (keySelector <= 1) {
                        isabeau_EXP = $gameVariables._data[223];
                        mirabelle_EXP = $gameVariables._data[224];
                        odile_EXP = $gameVariables._data[225];
                    } else {
                        isabeau_EXP = $gameVariables._data[233];
                        mirabelle_EXP = $gameVariables._data[234];
                        odile_EXP = $gameVariables._data[235];
                    }
                    break;

                case 5: // King
                    isabeau_EXP = $gameVariables._data[243];
                    mirabelle_EXP = $gameVariables._data[244];
                    odile_EXP = $gameVariables._data[245];
                    break;
        
                default:
                    break;
        }

        $gameActors.actor(2).changeExp(isabeau_EXP, false);
        $gameActors.actor(3).changeExp(mirabelle_EXP, false);
        $gameActors.actor(4).changeExp(odile_EXP, false);

        command.code = 0;
        break;

        case 133: // (LockedDoor)
            APMod.client.check(APMod.BaseId.Misc + 17);
            break;
            
        default:
            break;
    }
    return command
}

function doGameInterpreterHook () {
    // Hook executeCommand
        // 101: Text                | face, position, ?, ?
        // 108: Comment             | Comment
        // 117: Comment Event       | id
        // 121: Control Switches    | id, Operation?, value?
        // 122: Control Variables   | id, id?, Operation?, Operand, value
        // 126: Change Items        | id, operation, variable?, amount
        // 127: Change Weapons      | id, operation, operand, value, include equipment(bool)
        // 128: Change Armors       | id, operation, operand, value, include equipment(bool)
        // 129: Change Party Member | id, operation, init(bool)
        // 134: Change Save Access  | Enable/Disable
        // 311: Change HP           | id, ?, ?, ?, amount, allow knockout(bool)
        // 318: Change Skill        | var?, party member, learn/forget, id
        // 355: Script              | Script
        // 356: Plugin Command      | Command
        Game_Interpreter.prototype.executeCommand = function() {
            var command = this.currentCommand();
            if (command) {
                let id, operation

                // Detour commands
                switch (command.code) {
                    case 117:
                        command = doCommonEventHook(command);
                        break;

                    case 122:
                        // console.log(command);
                        break;

                    case 126: // Items
                        id = command.parameters[0];
                        operation = command.parameters[1];

                        if (operation == 0) { // Inc
                            console.log(`Sending Check ${$dataItems[id].name}. | ${APMod.BaseId.Item + id}`);
                            APMod.client.check(APMod.BaseId.Item + id);
                        }
                        
                        command.code = 0;
                        break;

                    case 127: // Weapons
                        id = command.parameters[0];
                        operation = command.parameters[1];

                        if (operation == 0) { // Inc
                            console.log(`Sending Check ${$dataItems[id].name}. | ${APMod.BaseId.Weapon + id}`);
                            APMod.client.check(APMod.BaseId.Weapon + id);
                        }
                        
                        command.code = 0;
                        break;

                    case 128: // Armors
                        id = command.parameters[0];
                        operation = command.parameters[1];

                        if (operation == 0) { // Inc
                            console.log(`Sending Check ${$dataItems[id].name}. | ${APMod.BaseId.Armor + id}`);
                            APMod.client.check(APMod.BaseId.Weapon + id);
                        }
                        
                        command.code = 0;
                        break;

                    case 318: // Skill
                        id = command.parameters[3];
                        operation = command.parameters[2];
                        
                        console.log(`${$dataSkills[id].name}?`);
                        if (id == 10) break; // (Ask.)

                        if (operation == 0) { // Give
                            console.log(`Sending Check ${$dataSkills[id].name}. | ${APMod.BaseId.Skill + id}`);
                            APMod.client.check(APMod.BaseId.Skill + id);
                        }

                        command.code = 0;
                        break;
                
                    default:
                        // console.log(command);
                        break;
                }


                // Original Code

                this._params = command.parameters;
                this._indent = command.indent;
                var methodName = "command" + command.code;
                if (typeof this[methodName] === "function") {
                    if (!this[methodName]()) {
                        return false;
                    }
                }
                this._index++;
            } else {
                this.terminate();
            }
            return true;
        };
}

function doDataManagerHook() {
    DataManager.loadDataFile = function(name, src) {
        var xhr = new XMLHttpRequest();
        var url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                doJSONPatch(name, JSON.parse(xhr.responseText), url);
                DataManager.onLoad(window[name]);
            }
        };
        xhr.onerror = this._mapLoader || function() {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
        window[name] = null;
        xhr.send();
    };

    /*
    DataManager.loadMapData = function(mapId) {
        if (mapId > 0) {
            var filename = 'Map%1.json'.format(mapId.padZero(3));
            this._mapLoader = ResourceHandler.createLoader('data/' + filename, this.loadDataFile.bind(this, '$dataMap', filename));
            this.loadDataFile('$dataMap', filename);
        } else {
            this.makeEmptyMap();
        }
    };
    */

}

function doFunctionHooks() {
    doGameInterpreterHook();
    doDataManagerHook();

    OrangeGreenworks.activateAchievement = function(achievementName) {
        let achievementNameToId = {
            "loopsouvenir": 9,
            "loopsilvercoin": 10,
            "act1": 12,
            "friendquest3": 14,
            "loopquest": 15,
            "jackpot": 22,
            "sifghost1": 32,
            "pineappledeath": 48,
            "1000waystodie": 65,
            "hhm5times": 68,
            "epilogue": 69
        }

        APMod.client.check(APMod.BaseId.Misc + achievementNameToId[achievementName]);
    }
}

function doFunctionPatches() {

    // Scene_Battle //

    // Catch error that occurs when the active party member is dead and trys to preform an action.
    Scene_Battle.prototype._commandAttack = Scene_Battle.prototype.commandAttack
    Scene_Battle.prototype.commandAttack = function() {
        try {
            this._commandAttack();
        } catch(e) { console.log("commandAttack errored out. Ignore."); console.error(e); }
    };

    Scene_Battle.prototype._commandGuard = Scene_Battle.prototype.commandGuard
    Scene_Battle.prototype.commandGuard = function() {
        try {
            this._commandGuard();
        } catch (e) { console.log("commandGuard errored out. Ignore."); console.error(e); }
    };
}

// TODO: Add some form of caching. Something like a lookup table with a max length of 5
// TODO: Also cleanup this function.
function doJSONPatch(name, data, path) {
    window[name] = data;
    var url = 'mod/mods/archipelago/patches/' + path;

    if (require('fs').existsSync(`./www/${url}`)) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) { // Return patched data
                console.debug(`Patching ${path}`)
                window[name] = JSONPatch.immutableJSONPatch(data, JSON.parse(xhr.responseText));
            }
        };

        xhr.send();
    }
}

function doSlotData(slot_data) {
    if (slot_data.death_link) APMod.client.deathLink.enableDeathLink();
    if (slot_data.starting_craft) console.warn("starting_craft stub.");
    if (slot_data.music_rando) console.warn("music_rando stub.");
    if (slot_data.enemy_rando) console.warn("enemy_rando stub.");
    if (slot_data.troop_rando) console.warn("troop_rando stub.");
}

function randomPalette(seed) {
    console.log("radn");
    const canvas = document.getElementById("GameCanvas");
    canvas.style += `filter: sepia(${Math.random()*0.8}) saturate(4) hue-rotate(${parseInt((Math.random()*24)*15)}deg);`;
}

// Utils
APMod.Utils = {};

APMod.Utils.getAct = function() { return $gameVariables._data[2]; }
APMod.Utils.getLoops = function() { return $gameVariables._data[1]; }
APMod.Utils.getDeathReason = function() {
    /*
     * retuns: reason, count
     */

    if ($gameSwitches._data[102]) return "banana",      $gameVariables._data[102];
    if ($gameSwitches._data[103]) return "monster",     $gameVariables._data[103];
    if ($gameSwitches._data[104]) return "king",        $gameVariables._data[104];
    if ($gameSwitches._data[105]) return "tears",       $gameVariables._data[105];
    if ($gameSwitches._data[106]) return "hhmReset",    $gameVariables._data[105];
    if ($gameSwitches._data[112]) return "firstTrap",   $gameVariables._data[24];
    if ($gameSwitches._data[113]) return "pineapple",   $gameVariables._data[109];
    if ($gameSwitches._data[114]) return "suicide",     $gameVariables._data[110];
    if ($gameSwitches._data[119]) return "friendReset", $gameVariables._data[111];

    return "unknown", 0;
}

APMod.Utils.getItemType = function(item){

    if (item.trap) return "trap";
    if (item.useful) return "useful";
    if (item.filler) return "normal";
    if (item.progression) return "progression";
    return "";
}

APMod.Utils.isSelf = function(player){
    return player.slot === APMod.client.players.self.slot;
}

APMod.Utils.formatUsingNodes = function(text, nodes) {
    let fomattedText = "";
    nodes.forEach(function(node, index) {
        switch(node.type) {
            case "text":
                fomattedText += node.text;
                break;

            case "player":
                let isSelf = APMod.Utils.isSelf(node.player);
                fomattedText += `<span class="${node.type}" ${isSelf} title="Playing: ${node.player.game}">${node.text}</span>`;
                break;

            case "item":
                let itemType = APMod.Utils.getItemType(node.item);
                fomattedText += `<span class="${node.type}" ${itemType} title="Item Class: ${itemType}">${node.text}</span>`;
                break;

            default:
                fomattedText += `<span class="${node.type}">${node.text}</span>`;
                break;
        }

    });

    return fomattedText;
}

// Notifications
APMod.Notification = {};
APMod.Notification.list = [];

APMod.Notification.setup = function(){
    this.notificationContainer = document.createElement("span");
    this.notificationContainer.id = "notificationContainer";
    document.body.insertBefore(this.notificationContainer,  document.getElementById("ErrorPrinter"));
}

APMod.Notification.addNotification = function(notif){
    let notification = document.createElement("p");
    notification.classList.add("notificationText");
    notification.classList.add("textbox");
    notification.classList.add("fadeOut");
    notification.innerHTML = notif;
    this.notificationContainer.appendChild(notification);


    notification.index = APMod.Notification.list.length;
    APMod.Notification.list.push(notification);
    setTimeout(() => {
        if (notification) {
            APMod.Notification.list.splice(notification.index, 1);
            notification.remove();
        }
    }, 3000);
}

// Chat & Messages
APMod.Chat = {};

APMod.Chat.setupWindow = function() {
    this.chatHidden = false;
    this.countdown = {};

    // Create Elements
    let chatWindow = document.createElement("div");
    chatWindow.id = "chatWindow";
    document.body.insertBefore(chatWindow,  document.getElementById("ErrorPrinter"));

    this.chatContainer = document.createElement("div");
    this.chatContainer.id = "chatContainer";
    chatWindow.appendChild(this.chatContainer);

    this.chatInput = document.createElement("input");
    this.chatInput.id = "chatInput";
    chatWindow.appendChild(this.chatInput);

    // Settings
    const sheet = document.styleSheets[document.styleSheets.length-1];
    const rule = `* { --text-chat-width: ${APMod.settings.chatWidth}%; --text-chat-transparency: ${APMod.settings.chatTransparency/100}; }`;
    sheet.insertRule(rule, 0);

    if (APMod.settings.chatStyle == 1) {
        this.chatContainer.classList.add("textbox");
        this.chatInput.classList.add("textbox");
    }

    // Chat Input
    this.chatInput.addEventListener("keydown", function(event) {
        // Check if the pressed key is the "Enter" key
        if (event.key === "Enter") {
            APMod.client.messages.say(APMod.Chat.chatInput.value)
            APMod.Chat.chatInput.value = "";
        } else if (event.key === "Backspace") { // Jank
           APMod.Chat.chatInput.value = APMod.Chat.chatInput.value.substring(0, APMod.Chat.chatInput.value.length-1);
        }
    });

    // Show/Hide Chat
    document.getElementsByTagName("html")[0].addEventListener("keydown", function(event) {
        // Check if the pressed key is the "Enter" key
        if (event.key === "/") {
            //event.preventDefault();
            APMod.Chat.chatHidden = !APMod.Chat.chatHidden;
            chatWindow.classList.toggle("hide");
            if (!APMod.Chat.chatHidden) {APMod.Chat.chatInput.focus();}
            else if (APMod.Chat.chatInput.value == "/") {APMod.Chat.chatInput.value = "";}

        }
    });
}

APMod.Chat.addMessage = function(msg) {
    let msgElement = document.createElement("p");
    msgElement.classList.add("chatMessage");
    msgElement.innerHTML = msg;
    this.chatContainer.appendChild(msgElement);
    setTimeout(() => msgElement.remove(), 60000*4);
}

APMod.Chat.setupMessageEvents = function() {
    // Admin Command
    APMod.client.messages.on("adminCommand", (message, player, nodes) => {
        APMod.lastNode = nodes;
        console.debug(nodes);
        this.addMessage(`${player}: ${message}`);
    });

    // Chat
    APMod.client.messages.on("chat", (message, player, nodes) => {
        APMod.lastNode = nodes;
        console.debug(nodes);
        this.addMessage(`${player}: ${message}`);
    });

    // Collected
    APMod.client.messages.on("collected", (text, player, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Connected
    APMod.client.messages.on("connected", (text, player, tags, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Countdown
    APMod.client.messages.on("countdown", (text, value, nodes) => {
        let displayText;
        if (value == 0) {displayText = "GO";}
        else {displayText = value;}


        if (this.countdown.node){
            let countdownText = this.countdown.node;
            countdownText.innerText = displayText;

            // Reset
            clearTimeout(this.countdown.timeout);
            countdownText.classList.remove("fadeOut");
            void countdownText.offsetWidth;
            countdownText.classList.add("fadeOut");

            this.countdown.timeout = setTimeout(() => {
                if (countdownText) {
                    countdownText.remove();
                    this.countdown.node = undefined;
                }
            }, 3000);

        } else {
            let countdownText = document.createElement("p");
            countdownText.classList.add("notificationText");
            countdownText.classList.add("textbox");
            countdownText.classList.add("fadeOut");
            countdownText.innerText = displayText;

            this.countdown.node = countdownText;
            APMod.Notification.notificationContainer.appendChild(countdownText);
            this.countdown.timeout = setTimeout(() => {
                if (countdownText) countdownText.remove();
            }, 2000);
        }
    });

    // Disconnected
    APMod.client.messages.on("disconnected", (text, player, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Goaled
    APMod.client.messages.on("goaled", (text, player, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Item Cheated
    APMod.client.messages.on("itemCheated", (text, item, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Item Hinted
    APMod.client.messages.on("itemHinted", (text, item, found, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Item Sent
    APMod.client.messages.on("itemSent", (text, item, nodes) => {
        let fomattedMessage = APMod.Utils.formatUsingNodes(text, nodes);
        this.addMessage(fomattedMessage);

        if (APMod.Utils.isSelf(item.receiver)) {
            APMod.Notification.addNotification(fomattedMessage);
        }
    });

    // Message
    APMod.client.messages.on("message", (text, nodes) => {
        //this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Released
    APMod.client.messages.on("released", (text, player, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Server Chat
    APMod.client.messages.on("serverChat", (text, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Tags Updated
    APMod.client.messages.on("tagsUpdated", (text, player, tags, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });

    // Tutorial
    APMod.client.messages.on("tutorial", (message, nodes) => {
        this.addMessage(`<i>${message}</i>`);
    });

    // User Command
    APMod.client.messages.on("userCommand", (text, nodes) => {
        this.addMessage(APMod.Utils.formatUsingNodes(text, nodes));
    });
}

// Items
APMod.Items = {};
APMod.Items.received = [];
APMod.Items.add = function(item) {
    // This is kind of messy. TODO: Rewrite and cleanup
    if (item.item < APMod.BaseId.Item) { // Skill
        let id = item.item - APMod.BaseId.Skill
        console.log(`Received Skill ${$dataSkills[id].name}`);

        // Check what Actor this skill belongs to and give it to them.
        let actorName = skillIdToActorName[id];

        // Temporary Try-Catch.
        // TODO: Add a check to see if the player is in-game
        try {
            $gameActors._data.forEach(function(actor) {
                if (actor)
                    if (actor._name == actorName)
                        actor._skills.push(id);
                        // actor.learnSkill();
            });

        } catch (error) {console.error(error)}
            

    } else if (item.item < APMod.BaseId.Weapon) { // Item
        let id = item.item - APMod.BaseId.Item
        console.log(`Received Item ${$dataItems[id].name}`);
        $gameParty.gainItem($dataItems[id], 1);

    } else if (item.item < APMod.BaseId.Armor) { // Weapon
        let id = item.item - APMod.BaseId.Weapon
        console.log(`Received Weapon ${$dataWeapons[id].name}`);
        $gameParty.gainItem($dataWeapons[id], 1);

    } else if (item.item < APMod.BaseId.Misc) { // Armor
        let id = item.item - APMod.BaseId.Armor
        console.log(`Received Armor ${$dataArmors[id].name}`);
        $gameParty.gainItem($dataArmors[id], 1);
    } else { // Misc
        let id = item.item - APMod.BaseId.Misc
        switch(id) {
            case 3: // Stostorage Roomoom Openphrase
                $gameVariables._data[91] = 1;
                break;

            case 56: // Openphrase123 Openphrase
                $gameVariables._data[95] = 1;
                break;

            case 17: // Change Openphrase
                // Var id 96 goes unused. Let use it for this
                $gameVariables._data[96] = 1;
                break;

            default:
                console.warn(`Unknown Item Received: ${item.item}`)
                break;
        }
    }
};

APMod.Items.onReceive = function(packet) {
    console.debug(packet);

    packet.items.forEach(function(item) {
        APMod.Items.received.push(item);
        APMod.Items.add(item);
    });
}

APMod.Items.clearInventory = function() {
    $gameParty._items = {};
    $gameParty._weapons = {};
    $gameParty._armors = {};

    $gameActors._data.forEach(function(actor) {
        if (actor) {

            actor._equips.forEach(function(equip) {
                equip._dataClass = "";
                equip._itemId = "";
            });

            actor._skills = [];
        }

    });
    
    // Please don't kill Tutorial Kid. She didn't do anything to you...
    // I'm talking to you liketriple_sombody. >｀.>
    $gameActors._data[7]._skills = [1, 107, 108, 109];

    // Openphrases
    $gameVariables._data[91] = 0;
    $gameVariables._data[95] = 0;
    $gameVariables._data[96] = 0;

}

APMod.Items.resetInventory = function() {
    this.clearInventory();
    this.received.forEach(function(item) {
        APMod.Items.add(item);
    });
}

// Base

APMod.connect = async () => {
    if (APMod.client) {
        APMod.client.socket.disconnect();
        APMod.Items.received = [];
        APMod.Items.clearInventory();
        
    } else { // First Time Init
        APMod.client = new window.Archipelago.Client();

        APMod.client.socket.on("connected", (packet) => {
            console.log("Connected to server: ", packet);
            APMod.slot_data = packet.slot_data

            // Change Save path
            StorageManager.localFileDirectoryPath = function() {
                var path = require("path");

                var base = path.dirname(process.mainModule.filename);
                return path.join(base, `apsave/${APMod.client.room.seedName}/`);
            };
        });

        APMod.client.socket.on("printJSON", (packet) => {
            console.debug(packet);
        });

         APMod.client.socket.on("receivedItems", APMod.Items.onReceive);

        APMod.client.deathLink.on("deathReceived", doDeath);

        doFunctionHooks();

        APMod.Chat.setupMessageEvents();
        APMod.Chat.setupWindow();
        APMod.Notification.setup();

        // Hook loadTitle1
        // TODO: Make a better texturepack manager
        ImageManager.loadTitle1 = function(filename, hue) {
            if (filename == "logo") return this.loadBitmap('mod/mods/archipelago/img/titles1/', filename, hue, true);
            return this.loadBitmap('img/titles1/', filename, hue, true);
        };

    }

    APMod.client.login(window.APMod.server, window.APMod.slot, game, {password: window.APMod.password})
    .then(() => {
        console.log("Connected to the server!");
        doSlotData(APMod.slot_data);
    })
    .catch((error) => {
        APMod.Notification.addNotification(`Failed to connect: ${error.toString()}`)
        console.error("Failed to connect:", error.toString());
    });
}



// Mod Loader
export const onRegister = async (mod) => {
    APMod.settings = mod.store.settings;
    window.Archipelago = await import("https://unpkg.com/archipelago.js/dist/archipelago.min.js");
    window.JSONPatch = await import("https://cdn.jsdelivr.net/npm/immutable-json-patch/+esm");

    // Add Stylesheet
    let chatWindowStyle = document.createElement("link");
    chatWindowStyle.rel = "stylesheet";
    chatWindowStyle.href = "mod/mods/archipelago/archipelago.css";
    document.getElementsByTagName("head")[0].appendChild(chatWindowStyle);
}

export const onLoad = async () => {
    // Patch some stuff
    doFunctionPatches();

    // Enemy Rando
    Game_Enemy.prototype.setup =
    function(enemyId, x, y) {
        if (enemyId != 29) {
            var randEnemyId = enemyRandomIds[parseInt(Math.random()*enemyRandomIds.length)];
            console.debug(`Changing enemy ${enemyId} to ${randEnemyId}`)
            this._enemyId = randEnemyId;
        } else {
            this._enemyId = enemyId;
        }


        this._screenX = x;
        this._screenY = y;
        this.recoverAll();
    };
}
