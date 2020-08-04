const templates = {toLoad: ["start", "filereadersupport", "combatoverview", "combatant", "newcombatant", "emptytable", "editcontrols", "combatcontrols", "newplayer", "newmonster", "nummonster", "selectcombatant", "rename", "rearmor", "reorder", "damage", "heal", "save"]};
const mode = {current: "", edit: "EDIT", run: "RUN"};
const screen = {current:"start", start:"start", combat: "combat", input:"input"};
const totalTemplates = templates.toLoad.length;
let combatants = [];
let round = 1;
let monsterTemplate = {};//This holds the latest API response if it was a valid monster
let selectedCombatant = -1;
let activeIndex = 0; //Where we are with our selection cursor

/**
 * Called when the document is loaded, this is the entry point of our code
 */
window.onload = () => {
    document.getElementById('loader').innerHTML = 'Template 0/' + totalTemplates;
    loadTemplates();
}

/**
 * Creates the global key listener that checks the screen every time someone presses a key, then quickly 
 * checks if this happened to be a hotkey currently on screen
 * @param {KeyboardEvent} event 
 */
document.onkeydown = (event) =>{
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
            const now = (new Date()).getTime();
            hotkeyElement.click();
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
    //Check if we all have a valid initiative
    for(let i = 0; i < combatants.length; i++){
        if(isNaN(combatants[i].initiative)){
            setTimeout( () => {initiativeCombatant(i)}, 100);
            return "";
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
    if(mode.current == mode.run) row = row.replace(/%%CLASS%%/g, index == activeIndex ? 'selected': '');
    return row;
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
    console.log(combatString);
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
    }, 300);
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
    else setMain(createCombatTable(), screen.combat);
}

/**
 * Continues editing from the start screen
 */
function continueEdit(){
    setMain(createCombatTable(), screen.combat);
}

/**
 * Shows the start menu
 */
function showMain(){
    const temp = templates.start.replace(/%%MODE%%/g, mode.current == mode.edit ? 'Editing' : 'Running');
    setMain(temp, screen.start);
    const button = document.getElementById('continueEditing');
    if(!button) return;
    if(combatants.length > 0){
        button.style.display = 'inline-block';
    }else{
        button.style.display = 'none';
    }
}