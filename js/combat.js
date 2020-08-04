
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
        'initiative': -99,
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
    if(combatantIndex != undefined) doInfo(combatants[combatantIndex]);
    else showSelection('know more about');
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