import {getEngineSpec} from "./storage.js";

function performSearch(engine, searchTerm) {
    var output;
    var begin_time = Date.now();
    var first_res;
    return browser.runtime.sendMessage({open_engine: {url: engine.baseurl.replace("{searchTerms}", encodeURIComponent(searchTerm)), timeout: engine.timeout}})
        .then(tabid => {
            let port = browser.tabs.connect(tabid);
            port.postMessage(engine);
            port.onMessage.addListener(function(r) {
                if (r && r.resp) {
                    if (!first_res && r.resp.length > 0) {
                        first_res = Date.now() - begin_time;
                    }
                    output = {resp: r.resp, time: Date.now() - begin_time, first_res: first_res};
                }
                else {
                    console.log(r.err || r);
                }
            });
            return new Promise(resolve => {
                const remFunc = (remTid) => {
                    console.log("Closed tab", remTid);
                    if (remTid == tabid) {
                        browser.tabs.onRemoved.removeListener(remFunc);
                        resolve(output);
                    }
                };
                browser.tabs.onRemoved.addListener(remFunc);
            });
        });
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
                    eng_stat.innerText = "OK " + r.resp.length + " " + r.first_res + " ms -- " +  r.time + " ms";
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
                return 1;
            });
    });
});
