
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
        setMain(templates.nummonster.replace(/%%NAME%%/g, name), screen.input);
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
    if(combatantIndex != undefined) doHeal(combatants[combatantIndex]);
    else showSelection('heal');
}

/**
 * Damages one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function damageCombatant(combatantIndex){
    if(combatantIndex != undefined) doDamage(combatants[combatantIndex]);
    else showSelection('damage');
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
function renameCombatant(combatant){
    if(combatantIndex != undefined) doRename(combatants[combatantIndex]);
    else showSelection('rename');
}

/**
 * Skips to the next combatant in the initiative order
 */
function nextCombatant(){

}

/**
 * Moves back to the previous combatant in the initiative order
 */
function prevCombatant(){

}