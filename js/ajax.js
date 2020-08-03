/**
 * Requests and asnychronously returns the response text
 * @param {String} url the url of the file to GET
 */
async function get(url){
    response = await fetch(url, {cache: "reload"});
    return await response.text()
}