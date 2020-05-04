import {getEngineSpec} from "./storage.js";

function performSearch(engine, searchTerm) {
    var output;
    var begin_time = Date.now();
    browser.runtime.sendMessage({open_engine: {url: engine.baseurl.replace("{searchTerms}", encodeURIComponent(searchTerm)), timeout: engine.timeout}})
        .then(tabid => {
            let port = browser.tabs.connect(tabid);
            port.postMessage(engine);
            port.onMessage.addListener(function(r) {
                if (r && r.resp) {
                    output = {resp: r.resp, time: Date.now() - begin_time};
                    console.log(output);
                }
                else {
                    console.log(r.err || r);
                }
            });
        });
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    return wait(engine.timeout).then(() => output);
}

var engines_dom = document.getElementById("engines");
getEngineSpec().then(function(engines) {
    var prom = new Promise(resolve => resolve());
    engines.forEach(function(engine) {
        var eng = document.createElement("tr"),
            eng_name = document.createElement("td"),
            eng_stat = document.createElement("td");
        eng_name.innerText = engine.name;
        eng_stat.innerText = "...";
        engines_dom.appendChild(eng);
        eng.appendChild(eng_name);
        eng.appendChild(eng_stat);
        prom = prom.then(() => performSearch(engine, "sample"))
            .then(r => {
                console.log(engine.name, r);
                if (r && r.resp && r.resp.length) {
                    eng_stat.innerText = "OK " + r.resp.length + " " + r.time + " ms";
                    eng_stat.style.color = "green";
                }
                else if (r) {
                    eng_stat.innerText = "NO RESULTS";
                    eng_stat.style.color = "red";
                }
                else {
                    eng_stat.innerText = "TIMED OUT";
                    eng_stat.style.color = "red";
                }
            });
    });
});
