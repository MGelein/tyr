
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
 * Removes one of the combatants from the combat, if no combatant is supplied it will open a dialogue to try and pick one
 */
function removeCombatant(combatant){

}

/**
 * Heals one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function healCombatant(combatant){

}

/**
 * Damages one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function damageCombatant(combatant){

}

/**
 * Info on one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function infoCombatant(combatant){

}

/**
 * Rename one of the combatants, if no combatant is supplied it will open a dialogue to try and pick one
 */
function renameCombatant(combatant){

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