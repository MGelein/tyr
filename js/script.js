const templates = {toLoad: ["start", "filereadersupport", "combatoverview", "combatant", "newcombatant", "emptytable", "editcontrols", "combatcontrols"]};
const mode = {current: "", edit: "EDIT", run: "RUN"};
const screen = {current:"start", start:"start", combat: "combat", input:"input"};
const hotkeyHistory = {key: '', time:0};
let combatants = [];
let round = 1;

/**
 * Called when the document is loaded, this is the entry point of our code
 */
window.onload = () => {
    loadTemplates();
}

/**
 * Creates the global key listener that checks the screen every time someone presses a key, then quickly 
 * checks if this happened to be a hotkey currently on screen
 * @param {KeyboardEvent} event 
 */
document.onkeydown = (event) =>{
    if(event.keyCode == 27){
        const bbHolder = document.getElementById('backButtonHolder');
        if(!bbHolder.classList.contains('hidden')) {
            document.getElementById('backButton').click();
        }
        return;
    }
    const hotkeys = document.getElementsByClassName('hotkey');
    for(const hotkeyElement of hotkeys){
        const keyName = event.key.toUpperCase();
        if(keyName === hotkeyElement.innerHTML.toUpperCase()){
            const now = (new Date()).getTime();
            if(hotkeyHistory.key == event.key.toUpperCase() && now - hotkeyHistory.time < 200){
                hotkeyHistory.time = now;
                return;
            }
            hotkeyElement.click();
            hotkeyHistory.key = event.key.toUpperCase();
            hotkeyHistory.time = now;
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
    let content = "";
    if(!FileReader) content = templates.filereadersupport;
    else content = templates.start;
    setMain(content);
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
    setMain(createCombatTable());
}

/**
 * Fills/updates the combatOverview template with the right amount of data from the
 * combatants object.
 */
function createCombatTable(){
    let rows = [];
    if(combatants.length == 0) rows.push(templates.emptytable);
    else{
        for(combatant of combatants){
            rows.push(createCombatRow(combatant));
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
function createCombatRow(combatant){
    if(!combatant.initiative){//If initiative was not explicitly set, calculate it
        combatant.initiative = Math.floor((combatant.dexterity - 10) / 2); + 10;
    }
    let row = templates.combatant;
    row = row.replace(/%%NAME%%/g, combatant.name);
    row = row.replace(/%%AC%%/g, combatant.armor_class);
    row = row.replace(/%%HP%%/g, combatant.hit_points);
    row = row.replace(/%%INITIATIVE%%/g, combatant.initiative);
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
    if(combatString) loadCombat(combatString, mode.run);
    else{
        document.getElementById('fileUploader').click();
    }
}

function uploadFile(event){
    const fileUploader = event.target;
    const files = fileUploader.files;
    if(files.length <= 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function(){runExisting(reader.result)};
    reader.readAsText(file, 'utf8');
}

/**
 * Sets the innerHTML of the main container. Just a little shorthand
 * @param {String} newContent 
 */
function setMain(newContent){
    const bbHolder = document.getElementById('backButtonHolder');
    if(newContent === templates.start){
        if(!bbHolder.classList.contains('hidden')){
            bbHolder.classList.add('hidden');
        }
    }else{
        bbHolder.classList.remove('hidden');
    }
    document.getElementById('main').innerHTML = newContent;
}


/**
 * Sends a request to the official SRD 5E API
 * @param {String} name 
 */
async function requestMonster(name){
    return JSON.parse(await get(`https://www.dnd5eapi.co/api/monsters/${name.toLowerCase().replace(/\s/g, '-')}/`));
}