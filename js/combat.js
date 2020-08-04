
/**
 * Adds a new combatant. This starts the interactive dialogue of adding a new combatant
 */
function addNewCombatant(){
    setMain(templates.newcombatant, screen.input);
}

/**
 * Adds a player with the provided name to combat
 * @param {String} name 
 */
function createPlayer(name){
    player = {
        'name': name,
        'armor_class': '--',
        'initiative': '--',
        'hit_points': '--'
    };
    combatants.push(player);
    setMain(createCombatTable(), screen.combat);
}

/**
 * This adds the specified amount of the provided template to the combatants order
 * @param {JSON} response 
 * @param {Number} amount 
 */
function addMonster(response, amount){
    if(amount.length == 0) amount = 1;//Add one monster by default
    if(amount == 1) combatants.push(response);
    if(amount > 1){
        const monsterBase = JSON.stringify(response);
        for(let i = 1; i <= amount; i++){
            const newMonster = JSON.parse(monsterBase);
            newMonster.name = `${newMonster.name} ${i}`;
            combatants.push(newMonster);
        }
    }
    setMain(createCombatTable(), screen.combat);
}

/**
 * Tries to add the provided monster to the combat, this starts the lookup
 * @param {String} name 
 */
function createMonster(name){
    name = name.trim().toLowerCase().replace(/\s/g, '-');
    requestMonster(name).then(response => gotAPIResponse(response, name));
    const feedback = document.getElementById('feedback');
    feedback.innerHTML =  'Requesting monster data... Please wait...';
    feedback.classList.remove('hidden');
    document.getElementById('submit').classList.add('hidden');
}

/**
 * Called when we receive a response from the API
 * @param {JSON} response the response from the API
 */
function gotAPIResponse(response, name){
    if(response.error || response.index !== name){
        const feedback = document.getElementById('feedback');
        feedback.innerHTML =  `<span class='warning'>Could not find an entry for "${name}" in the API</span>`;
        document.getElementById('monsterNameField').value = '';
        document.getElementById('submit').classList.remove('hidden');
    }else{
        monsterTemplate = response;
        setMain(templates.nummonster.replace(/%%NAME%%/g, name.replace(/-/g, ' ')), screen.input);
    }
}

/**
 * Removes one of the combatants from the combat, if no combatant is supplied it will open a dialogue to try and pick one
 * @param {Number} combatantIndex
 */
function removeCombatant(combatantIndex){
    if(combatantIndex != undefined) doRemove(combatants[combatantIndex]);
    else showSelection('remove');
}

/**
 * actually removes the supplied combatant from the hierarchy
 * @param {JSON} combatant 
 */
function doRemove(combatant){
    const index = combatants.indexOf(combatant);
    if(index > -1) combatants.splice(index, 1);
    setMain(createCombatTable(), screen.combat);
}

/**
 * Heals one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function healCombatant(combatantIndex){
    if(combatantIndex != undefined) doHeal(combatantIndex);
    else showSelection('heal');
}

/**
 * Starts the healing procedure by showing the heal window
 * @param {Number} combatantIndex 
 */
function doHeal(combatantIndex){
    selectedCombatant = combatantIndex;
    const combatant = combatants[combatantIndex];
    setMain(templates.heal.replace(/%%NAME%%/g, combatant.name), screen.input);
}
/**
 * Damages one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function damageCombatant(combatantIndex){
    if(combatantIndex != undefined) doDamage(combatantIndex);
    else showSelection('damage');
}

/**
 * Starts the damaging procedure by showing the damage window
 * @param {Number} combatantIndex 
 */
function doDamage(combatantIndex){
    selectedCombatant = combatantIndex;
    const combatant = combatants[combatantIndex];
    setMain(templates.damage.replace(/%%NAME%%/g, combatant.name), screen.input);
}

/**
 * Changes the hitpoints of a combatant with the provided amount
 * @param {Number} index 
 * @param {Number} amount 
 * @param {Boolean} positive
 */
function changeHealth(index, amount, positive){
    if(!isNaN(amount)){
        amount = parseInt(amount);
        amount *= positive ? 1 : -1;
        const currentHealth = isNaN(parseInt(combatants[index].hit_points)) ? 0 : parseInt(combatants[index].hit_points);
        combatants[index].hit_points = currentHealth + amount;
    }
    setMain(createCombatTable(), screen.combat);
}

/**
 * Info on one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function infoCombatant(combatantIndex){
    if(combatantIndex != undefined) doInfo(combatantIndex);
    else showSelection('know more about');
}

/**
 * Starts the info procedure by showing the info window
 * @param {Number} combatantIndex 
 */
function doInfo(combatantIndex){
    selectedCombatant = combatantIndex;
    const combatant = combatants[combatantIndex];
    setMain(showInfo(combatant), screen.input);
}

/**
 * Populates the info template and returns it
 * @param {Object} fight 
 */
function showInfo(fight){
    let temp = templates.info.replace(/%%NAME%%/g, formatName(fight));
    temp = temp.replace(/%%AC%%/g, fight.armor_class);
    temp = temp.replace(/%%HP%%/g, fight.hit_points);
    temp = temp.replace(/%%SPEED%%/g, fight.speed ? getSpeed(fight) : "--");
    temp = temp.replace(/%%STR%%/g, fight.strength ? scoreToMod(fight.strength) : "--");
    temp = temp.replace(/%%DEX%%/g, fight.dexterity ? scoreToMod(fight.dexterity) : "--");
    temp = temp.replace(/%%CON%%/g, fight.constitution ? scoreToMod(fight.constitution) : "--");
    temp = temp.replace(/%%INT%%/g, fight.intelligence ? scoreToMod(fight.intelligence) : "--");
    temp = temp.replace(/%%WIS%%/g, fight.wisdom ? scoreToMod(fight.wisdom) : "--");
    temp = temp.replace(/%%CHR%%/g, fight.charisma ? scoreToMod(fight.charisma) : "--");
    const extras = [];
    if(fight.proficiencies) extras.push(formatProficiencies(fight.proficiencies));
    if(fight.damage_resistances && fight.damage_resistances.length > 0) 
        extras.push(formatList(fight.damage_resistances, "Damage Resistances"));
    if(fight.damage_vulnerabilities && fight.damage_vulnerabilities > 0) 
        extras.push(formatList(fight.damage_vulnerabilities, "Damage Vulnerabilities"));
    if(fight.damage_immunities && fight.damage_immunities.length > 0) 
        extras.push(formatList(fight.damage_immunities, "Damage Immunities"));
    if(fight.condition_immunities && fight.condition_immunities.length > 0) 
        extras.push(formatList(fight.condition_immunities, "Condition Immunities"));
    if(fight.senses) extras.push(formatSenses(fight.senses));
    if(fight.languages) extras.push(`<li><b>Languages: </b>${fight.languages}</li>`);
    if(fight.challenge_rating) extras.push(`<li><b>Challenge Rating: </b>${fight.challenge_rating}</li>`);
    temp = temp.replace(/%%EXTRAS%%/g, "<ul class='extras'>" + extras.join("") + "</ul>");
    const abilities = [];
    if(fight.special_abilities) abilities.push(formatAbilities(fight.special_abilities));
    temp = temp.replace(/%%ABILITIES%%/, "<ul>" + abilities.join("") + "</ul>");
    return temp;
}

/**
 * Neatly formats the provided array of abilities
 * @param {Array} abs 
 */
function formatAbilities(abs){
    const output = [];
    for(let ab of abs){
        output.push(`<li><b><i>${ab.name}${getUsage(ab)}: </i></b> ${formatDesc(ab.desc)}</li>`);
    }
    return output.join("");
}

/**
 * Tries to neatly format things like spellcasting descriptions
 * @param {String} desc 
 */
function formatDesc(desc){
    const lines = desc.split("\n");
    const output = [];
    let foundList = false;
    for(let line of lines){
        if(line.trim().length < 1){
            output.push("<ul>");
            foundList = true;
        }else{
            output.push(foundList ? `<li>${line.replace('-', '-<b>').replace(':', '</b>:')}</li>` : line);
        }
    }
    if(foundList) output.push("</ul>");
    return output.join("");
}

/**
 * Returns a neatly formatted option of usage for an ability
 * @param {Object} ab 
 */
function getUsage(ab){
    if(!ab.usage) return '';
    return ` (${ab.usage.times} ${ab.usage.type})`;
}

/**
 * Formats the name, type and alignment
 * @param {Object} combatant 
 */
function formatName(combatant){
    const partOne =  combatant.name;
    let output = "";
    const extraParts = [];
    if(combatant.size) extraParts.push(combatant.size);
    if(combatant.type) extraParts.push(combatant.type);
    if(combatant.subtype) extraParts.push(`(${combatant.subtype})`);
    if(extraParts.length > 0) output += extraParts.join(" ");
    if(combatant.alignment) output += ", " + combatant.alignment;
    return partOne + (output.length > 0 ? " - <span class='extraInfo'>"  + output + "</span>" : "");
}

/**
 * Formats a list of damage vulnerabilities, immunities or resistances with a header
 * @param {Array} list 
 * @param {String} header 
 */
function formatList(list, header){
    return `<li><b>${header}: </b>${list.join(", ")}</li>`
}

/**
 * Formats a list of senses
 * @param {Object} senses 
 */
function formatSenses(senses){
    const keys = Object.keys(senses);
    const output = [];
    for(let key of keys){
        let k = key.replace('_', ' ');
        output.push(`${k} ${senses[key]}`);
    }
    return `<li><b>Senses: </b>${output.join(", ")}</li>`;
}

/**
 * Format a list of strings with proficiencies
 * @param {Array} profs 
 */
function formatProficiencies(profs){
    const skills = [];
    const savingThrows = [];
    for(let prof of profs){
        let p = prof.name.toLowerCase();
        if(p.indexOf("saving throw:") > -1){
            savingThrows.push(parseProf(prof));
        }else if(p.indexOf("skill:") > -1){
            skills.push(parseProf(prof));
        }
    }
    output = ""
    if(savingThrows.length > 0) output += `<li><b>Saving Throws: </b>` + savingThrows.join(", "); + "</li>"
    if(skills.length > 0) output += `<li><b>Skills: </b>` + skills.join(", "); + "</li>"
    return output;
}

/**
 * Parses a proficiency into human readable form
 * @param {Object} prof 
 */
function parseProf(prof){
    return prof.name.split(": ")[1] + (prof.value > 0 ? "+" : "") + prof.value
}

/**
 * Returns the number and score for a specific score
 * @param {Number} score 
 */
function scoreToMod(score){
    const mod = Math.floor((score - 10) / 2);
    return `${score} (${mod > 0 ? '+' : ''}${mod})`;
}

/**
 * Returns a nicely formatted speed description
 * @param {Object} combatant 
 */
function getSpeed(combatant){
    const keys = Object.keys(combatant.speed);
    const desc = [];
    for(let key of keys){
        desc.push(`${combatant.speed[key]} ${key}`);
    }
    return desc.join(", ");
}

/**
 * Rename one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function renameCombatant(combatantIndex){
    if(combatantIndex != undefined) doRename(combatantIndex);
    else showSelection('rename');
}

/**
 * Starts the renaming procedure by showing the rename window
 * @param {Number} combatantIndex 
 */
function doRename(combatantIndex){
    selectedCombatant = combatantIndex;
    const combatant = combatants[combatantIndex];
    setMain(templates.rename.replace(/%%NAME%%/g, combatant.name), screen.input);
}

/**
 * Tries to change the name of the combatant at the provided index to the specified string
 * @param {Number} index the index in the list of combatants
 * @param {String} name the new name of this combatant
 */
function changeName(index, name){
    if(name.trim().length > 0){
        combatants[index].name = name.trim();
    }
    setMain(createCombatTable(), screen.combat);
}

/**
 * Change AC for one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function armorCombatant(combatantIndex){
    if(combatantIndex != undefined) doArmor(combatantIndex);
    else showSelection('rearmor');
}

/**
 * Starts the process to change the Armor Class of a specific combatant
 * @param {Number} combatantIndex 
 */
function doArmor(combatantIndex){
    selectedCombatant = combatantIndex;
    const combatant = combatants[combatantIndex];
    let temp = templates.rearmor.replace(/%%NAME%%/g, combatant.name);
    setMain(temp.replace(/%%AC%%/g, combatant.armor_class), screen.input);
}

/**
 * Tries to change the Armor Class of the combatant at the provided index to the specified string
 * @param {Number} index the index in the list of combatants
 * @param {String} ac the new armor class of this combatant
 */
function changeArmor(index, ac){
    if(ac > 0 && ac.length > 0){
        combatants[index].armor_class = ac;
    }
    setMain(createCombatTable(), screen.combat);
}

/**
 * Change initiative for one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function initiativeCombatant(combatantIndex){
    if(combatantIndex != undefined) doInitiative(combatantIndex);
    else showSelection('reorder');
}

/**
 * Starts the process to change the Initiative of a specific combatant
 * @param {Number} combatantIndex 
 */
function doInitiative(combatantIndex){
    selectedCombatant = combatantIndex;
    const combatant = combatants[combatantIndex];
    let temp = templates.reorder.replace(/%%NAME%%/g, combatant.name);
    setMain(temp.replace(/%%INITIATIVE%%/g, combatant.initiative), screen.input);
}

/**
 * Tries to change the initiative of the combatant at the provided index to the specified string
 * @param {Number} index the index in the list of combatants
 * @param {String} initiative the new initiative of this combatant
 */
function changeInitiative(index, initiative){
    if(initiative > 0 && initiative.length > 0){
        combatants[index].initiative = initiative;
    }
    setMain(createCombatTable(), screen.combat);
}

/**
 * Skips to the next combatant in the initiative order
 */
function nextCombatant(){
    activeIndex += 1;
    if(activeIndex >= combatants.length){
        activeIndex = 0;
        round++;
    }
    setMain(createCombatTable(), screen.combat);
}

/**
 * Moves back to the previous combatant in the initiative order
 */
function prevCombatant(){
    activeIndex -= 1;
    if(activeIndex < 0){
        activeIndex = combatants.length - 1;
        round --;
    }
    setMain(createCombatTable(), screen.combat);
}