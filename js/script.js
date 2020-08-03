const templates = {toLoad: ["start", "filereadersupport", "combatoverview", "combatant"]};
const mode = {current: "", edit: "EDIT", run: "RUN"};
const screen = {current:"start", start:"start", combat: "combat", input:"input"};

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
    const hotkeys = document.getElementsByClassName('hotkey');
    for(const hotkeyElement of hotkeys){
        if(event.key.toUpperCase() === hotkeyElement.innerHTML.toUpperCase()){
            hotkeyElement.click();
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
    setTimeout(() => {
        setMain(content);
    }, Math.random() * 1000 + 2000);
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
 * @param {String} combatString the lines of a combat file
 * @param {String} combatMode either mode.edit or mode.run 
 */
function loadCombat(combatString, combatMode){
    mode.current = combatMode;
    setMain(templates.combatoverview);
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
    document.getElementById('main').innerHTML = newContent;
}