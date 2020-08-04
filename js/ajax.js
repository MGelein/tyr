/**
 * Requests and asnychronously returns the response text
 * @param {String} url the url of the file to GET
 */
async function get(url){
    response = await fetch(url, {cache: "reload"});
    return await response.text()
}

/**
 * Starts download the provided string as a file
 * @param {String} filename
 * @param {String} data
 */
function download(filename, data){
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const download = document.getElementById('download');
    download.setAttribute("href", dataStr);
    download.setAttribute("download", filename);
    download.click();
}