import {getEngineSpec} from "./storage.js";

function performSearch(engine, searchTerm) {
    var output;
    browser.runtime.sendMessage({open_engine: {url: engine.baseurl.replace("{searchTerms}", encodeURIComponent(searchTerm)), timeout: engine.timeout}})
        .then(tabid => {
            let port = browser.tabs.connect(tabid);
            port.postMessage(engine);
            return function(callback_succ, callback_err) {
                port.onMessage.addListener(function(r) {
                    if (r.resp) {
                        callback_succ(r.resp);
                    }
                    else {
                        callback_err(r.err || r);
                    }
                });
            };
        }).then(function(get_resp) {
            get_resp(function(resp) {
                output = resp;
            });
        }, console.log);
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
            .then(resp => {
                console.log(engine.name, resp);
                if (resp && resp.length) {
                    eng_stat.innerText = "OK " + resp.length;
                    eng_stat.style.color = "green";
                }
                else {
                    eng_stat.innerText = "FAIL";
                    eng_stat.style.color = "red";
                }
            });
    });
});
