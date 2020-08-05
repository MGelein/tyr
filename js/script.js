const templates = {toLoad: ["start", "filereadersupport", "combatoverview", "combatant", "newcombatant", "emptytable", "editcontrols", "combatcontrols", "newplayer", "newmonster", "nummonster", "selectcombatant", "rename", "rearmor", "reorder", "damage", "heal", "save", "summary", "info"]};
const xpPerCR = {0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8:3900, 9:5000,
10: 5900, 11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000, 21:33000,
22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000, 28: 120000, 30: 155000};
const mode = {current: "", edit: "EDIT", run: "RUN"};
const screen = {current:"start", start:"start", combat: "combat", input:"input"};
const totalTemplates = templates.toLoad.length;
let combatants = [];
let round = 1;
let monsterTemplate = {};//This holds the latest API response if it was a valid monster
let selectedCombatant = -1;
let activeIndex = 0; //Where we are with our selection cursor
let screenSwitchTime = 0;
let inScreenSwitchCooldown = false;

/**
 * Called when the document is loaded, this is the entry point of our code
 */
window.onload = () => {
    document.getElementById('loader').innerHTML = 'Template 0/' + totalTemplates;
    loadTemplates();
}

/**
 * This is the actual keyboard listener, gets attached after screen switches
 * @param {KeyboardEvent} event 
 */
function keyListener(event){
    //Special case for ESC
    if(event.keyCode == 27){
        const bbHolder = document.getElementById('backButtonHolder');
        if(!bbHolder.classList.contains('hidden')) {
            document.getElementById('backButton').click();
        }
        return;
    }
    let pressedKey = event.key;
    //Super hacky way to make arrows behave like prev/next keys
    if(event.keyCode == 38) pressedKey = 'p';
    if(event.keyCode == 40) pressedKey = 'n';

    //Otherwise check all current hotkeys on the screen
    const hotkeys = document.getElementsByClassName('hotkey');
    for(const hotkeyElement of hotkeys){
        if(pressedKey.toUpperCase() === hotkeyElement.innerHTML.toUpperCase()){
            setTimeout( () => {
                hotkeyElement.click();
            }, 50);
            const button = hotkeyElement.parentElement;
            if(!button.classList.contains('clicked')){
                setTimeout(()=>{
                    button.classList.remove('clicked');
                }, 300);
            }
            button.classList.add('clicked');
        }
    }
}

/**
 * Starts loading all templates we will need
 */
function loadTemplates(){
    for(let name of templates.toLoad) loadTemplate(name);
}

/**
 * Called when all templates have been loaded succesfully
 */
function loadedTemplates(){
    if(!FileReader) setMain(templates.filereadersupport, screen.start);
    else showMain();
}

/**
 * Loads a single template defined by its name, stores it and checks if that was all
 * @param {String} name 
 */
function loadTemplate(name){
    get(`data/${name}.html`).then( template => {
        templates[name] = template;
        const loadIndex = templates.toLoad.indexOf(name);
        if(loadIndex > -1) templates.toLoad.splice(loadIndex, 1);
        document.getElementById('loader').innerHTML = `Template ${totalTemplates - templates.toLoad.length}/${totalTemplates}`;
        if(templates.toLoad.length == 0) loadedTemplates();
    });
}

/**
 * Loads the provided combat description and starts into the provided combat mode
 * @param {String} combatString the lines of a combat file, this is basically JSON
 * @param {String} combatMode either mode.edit or mode.run 
 */
function loadCombat(combatString, combatMode){
    mode.current = combatMode;
    combatants = parseCombatString(combatString);
    setMain(createCombatTable(), screen.combat);
}

/**
 * Fills/updates the combatOverview template with the right amount of data from the
 * combatants object.
 */
function createCombatTable(){
    //Check if we all have a valid initiative, but only do this in combat mode
    if(mode.current == mode.run){
        for(let i = 0; i < combatants.length; i++){
            if(isNaN(combatants[i].initiative)){
                setTimeout( () => {initiativeCombatant(i)}, 100);
                return "";
            }
        }
    }
    let rows = [];
    if(combatants.length == 0) rows.push(templates.emptytable);
    else{
        combatants.sort((a, b) => {
            return parseInt(b.initiative) - parseInt(a.initiative);
        });
        for(let i = 0; i < combatants.length; i++){
            const combatant = combatants[i];
            rows.push(createCombatRow(combatant, i));
        }
    }
    let table = templates.combatoverview;
    table = table.replace(/%%COMBATANTS%%/g, rows.join(""));
    table = table.replace(/%%CONTROLS%%/g, mode.current == mode.edit ? templates.editcontrols : templates.combatcontrols);
    table = table.replace(/%%TITLE%%/g, getModeTitle())
    return table;
}

/**
 * Creates a single entry in the combat row
 * @param {Object} combatant a single combatant, may be undefined if there are no combatants yet
 */
function createCombatRow(combatant, index){
    if(!combatant.initiative){//If initiative was not explicitly set, calculate it
        combatant.initiative = Math.floor((combatant.dexterity - 10) / 2) + 10;
    }
    let row = templates.combatant;
    row = row.replace(/%%ID%%/g, index);
    row = row.replace(/%%NAME%%/g, combatant.name);
    row = row.replace(/%%AC%%/g, combatant.armor_class);
    row = row.replace(/%%HP%%/g, combatant.hit_points);
    row = row.replace(/%%INITIATIVE%%/g, combatant.initiative);
    let summary = '';
    if(mode.current == mode.run) {
        row = row.replace(/%%CLASS%%/g, index == activeIndex ? 'selected': '');
        summary = index == activeIndex ? templates.summary.replace(/%%CONTENT%%/g, getSummary(combatant)) : "";
    }
    row = row.replace(/%%SUMMARY%%/g, summary);
    return row;
}

/**
 * Generates a short summary for the provided combatant
 * @param {Object} combatant 
 */
function getSummary(combatant){
    if(!combatant.actions) return `<span class='actionSummary'><b>Player Actions</b></span>`;
    const actionSummary = []
    for(let action of combatant.actions){
        let actionSumm = ''
        actionSumm = `<span class='actionSummary'><b>${action.name}: </b> ${action.desc}</span>`
        actionSummary.push(actionSumm);
    }
    return actionSummary.join(""); 
}

/**
 * Returns a short summary of the damage for this attack
 * @param {Object} damages
 */
function getActionDamage(damages){
    let summary = []
    for(let damage of damages){
        summary.push(`${damage.damage_dice} ${damage.damage_type.name}`);
    }
    return summary.join(" + ");
}

/**
 * Returns the title add-on depending on the mode we're currently in
 */
function getModeTitle(){
    if(mode.current == mode.edit) return "Editing";
    else if(mode.current == mode.run) return `Round ${round}`;
    else return "Unknown Mode";
}

/**
 * Parses the provided combat string (this should be JSON) and returns the list of combatants
 * @param {String} s the string of JSON
 */
function parseCombatString(s){
    s = s.trim();
    if(s.length < 10) return [];
    const objects = JSON.parse(s);
    return objects;
}

/**
 * Called by the button create new. This starts a new empty combat in edit mode
 */
function createNew(){
    loadCombat("", mode.edit)
}

/**
 * Allows the use to run an already created combat, if no string is passed the user should upload a file
 */
function runExisting(combatString){
    if(combatString) loadCombat(combatString, mode.run);
    else{
        document.getElementById('fileUploader').click();
    }
}

/**
 * This will try to read the file and parse it
 * @param {FileEvent} event 
 */
function uploadFile(event){
    const fileUploader = event.target;
    const files = fileUploader.files;
    if(files.length <= 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function(){runExisting(reader.result)};
    reader.readAsText(file, 'utf8');
    fileUploader.value = '';
}

/**
 * Sets the innerHTML of the main container. Just a little shorthand
 * @param {String} newContent 
 * @param {String} newScreen
 */
function setMain(newContent, newScreen){
    console.log(newScreen);
    document.onkeyup = undefined;
    screenSwitchTime = (new Date()).getTime;
    inScreenSwitchCooldown = true;
    screen.current = newScreen;
    const bbHolder = document.getElementById('backButtonHolder');
    if(newContent === templates.start){
        if(!bbHolder.classList.contains('hidden')){
            bbHolder.classList.add('hidden');
        }
    }else{
        bbHolder.classList.remove('hidden');
    }
    document.getElementById('main').innerHTML = newContent;
    setTimeout(() =>{
        const focusElement = document.getElementsByClassName('focus')[0];
        if(focusElement) focusElement.focus();//If anything has the focus class, make it focus
        document.onkeyup = keyListener;
    }, 200);
}

/**
 * Shows the selection template with the provided action
 * @param {String} action 
 */
function showSelection(action){
    if(combatants.length < 1) return;
    let selection = templates.selectcombatant;
    selection = selection.replace(/%%ACTION%%/g, action);
    let selectionList = ["<button onclick='goBack()'><i class='hotkey'>0</i>&nbsp;Cancel</button>"];
    for(let i = 0; i < combatants.length; i+=2){
        const cA = combatants[i];
        const cB = combatants[i + 1];
        const cBText = cB ? `<button onclick='selCombatant(${i + 1})'><i class='hotkey'>${i + 2}</i>&nbsp;${combatants[i + 1].name}</button>`: ''
        selectionList.push(`<button onclick='selCombatant(${i})'><i class='hotkey'>${i + 1}</i>&nbsp;${combatants[i].name}</button>&nbsp;${cBText}`);
    }
    selection = selection.replace(/%%COMBATANTS%%/g, selectionList.join("<br>"));
    setMain(selection, screen.input);
}

/**
 * Called by the selection screen, this forwards our choice
 * @param {Number} number 
 */
function selCombatant(number){
    selectedCombatant = number;
    const action = document.getElementById('action').innerHTML;
    if(action === 'remove') removeCombatant(number);
    else if(action === 'heal') healCombatant(number);
    else if(action === 'damage') damageCombatant(number);
    else if(action === 'rename') renameCombatant(number);
    else if(action === 'know more about') infoCombatant(number);
    else if(action === 'rearmor') armorCombatant(number);
    else if(action === 'reorder') initiativeCombatant(number);
}


/**
 * Sends a request to the official SRD 5E API
 * @param {String} name 
 */
async function requestMonster(name){
    return JSON.parse(await get(`https://www.dnd5eapi.co/api/monsters/${name.trim().toLowerCase().replace(/\s/g, '-')}/`));
}

/**
 * Goes back to either the start menu (from the combat tool), or the combat menu (from any other screen)
 */
function goBack(){
    if(screen.current == screen.combat) showMain();
    else if(screen.current == screen.input) setMain(createCombatTable(), screen.combat);
}

/**
 * Continues editing from the start screen
 */
function continueEdit(){
    setMain(createCombatTable(), screen.combat);
}

function changeMode(){
    mode.current = mode.current == mode.edit ? mode.run : mode.edit;
    setMain(createCombatTable(), screen.combat);
}

/**
 * Shows the start menu
 */
function showMain(){
    let temp = templates.start;
    temp = temp.replace(/%%NEXTMODE%%/g, mode.current == mode.edit ? "Run Current" : "Edit Current");
    temp = temp.replace(/%%HK%%/g, mode.current == mode.edit ? "R" : "E");
    setMain(temp, screen.start);
    const button = document.getElementById('continueEditing');
    const modeButton = document.getElementById('modeChange');
    if(button && modeButton){
        if(combatants.length > 0){
            button.style.display = 'inline-block';
            modeButton.style.display = 'inline-block';
        }else{
            button.style.display = 'none';
            modeButton.style.display = 'none';
        }
    }
    const bbHolder = document.getElementById('backButtonHolder');
    if(!bbHolder.classList.contains('hidden')) bbHolder.classList.add('hidden')
}