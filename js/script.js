/**
 * Called when the document is loaded, this is the entry point of our code
 */
window.onload = ()=>{
    get("js/ajax.js").then(data => {console.log(data)});
};