import {addEngine, getDefaultEngines, getEngineSpec, removeEngine} from "./storage.js";
var ID_TO_ADD = Math.random().toString(36).substr(2, 9);

function highlightSearch(url, engine) {
    return browser.tabs.create({"url": url, "active": true}).then(
        tab => fetch("element_picker.js").then(response => response.text()).then(
            preamble => browser.tabs.executeScript(tab.id, {file: "browser-polyfill.min.js"}).then(
                () => browser.tabs.executeScript(tab.id, {
                    code: preamble + `
                    result_xpath = "${engine.xpath_result}";
                    attr_xpath["title"] = "${engine.xpath_title}";
                    attr_xpath["url"] = "${engine.xpath_url}";
                    attr_xpath["summary"] = "${engine.xpath_summary}";
                    is_selecting = true;
                    overlay_dom.style.setProperty("pointer-events", "none", "important");
                    popup_dom.onload=() => {
                        popup_dom.style.display="none";
                        popup_doc = popup_dom.contentDocument;
                        updateResultXPath();
                    };`
                })
            )
        )
    );
}

function editEngine(engine) {
    ID_TO_ADD = engine.id;
    document.getElementById("engine_name").value = engine.name;
    document.getElementById("engine_alias").value = engine.alias;
    document.getElementById("engine_keywords").value = engine.keywords;
    document.getElementById("engine_url").value = engine.baseurl;
    document.getElementById("engine_xpath_res").value = engine.xpath_result;
    document.getElementById("engine_xpath_title").value = engine.xpath_title;
    document.getElementById("engine_xpath_url").value = engine.xpath_url;
    document.getElementById("engine_xpath_summary").value = engine.xpath_summary;
    document.getElementById("engine_timeout").value = engine.timeout;
    document.getElementById("engine_ttl").value = engine.ttl;
    document.getElementById("engine_create_form").childNodes[1].innerHTML = "Edit Engine";
    document.getElementById("engine_create_form").classList.remove("advanced");
    document.getElementById("engine_create_form").classList.remove("hidden");
    document.getElementById("engine_create_form").childNodes[1].scrollIntoView();
}

function saveEngine(id) {
    let engine = {
        id:             id,
        name:           document.getElementById("engine_name").value,
        alias:          document.getElementById("engine_alias").value,
        keywords:       document.getElementById("engine_keywords").value,
        baseurl:        document.getElementById("engine_url").value,
        xpath_result:   document.getElementById("engine_xpath_res").value,
        xpath_title:    document.getElementById("engine_xpath_title").value,
        xpath_url:      document.getElementById("engine_xpath_url").value,
        xpath_summary:  document.getElementById("engine_xpath_summary").value,
        timeout:        document.getElementById("engine_timeout").value,
        ttl:            document.getElementById("engine_ttl").value
    };
    addEngine(engine).then(() => location.reload(), console.log);
}

function restoreDefaultEngines() {
    getDefaultEngines().then(function(engines) {
        [...engines].reduce((p, engine) => p.then(() => addEngine(engine)), Promise.resolve()).then(() => location.reload(), console.log);
    }, console.log);
}

function toggleAdvanced() {
    let advancedDom = document.getElementsByClassName("advanced");
    [...advancedDom].forEach(function(el) {
        if (el.classList.contains("hidden")) {
            el.classList.remove("hidden");
        }
        else {
            el.classList.add("hidden");
        }
    });
}

getEngineSpec().then(function(engines) {
    var en_div = document.getElementById("engines");
    var button_restore = document.getElementById("restore_engines");
    button_restore.addEventListener("click", restoreDefaultEngines);
    engines.forEach(function(engine) {
        var button_remove = document.createElement("button");
        button_remove.appendChild(document.createTextNode("Remove"));
        button_remove.addEventListener("click",
            () => removeEngine(engine.id).then(() => location.reload(), console.log)
        );
        var button_debug = document.createElement("button");
        button_debug.appendChild(document.createTextNode("Debug"));
        button_debug.addEventListener("click", function() {
            highlightSearch(engine.baseurl.replace("{searchTerms}", "sample"), engine).then(function() {}, console.log);
        });
        button_debug.className = "advanced hidden";
        var button_edit = document.createElement("button");
        button_edit.appendChild(document.createTextNode("Edit"));
        button_edit.addEventListener("click", () => editEngine(engine));
        var table = document.createElement("table");
        var tr = document.createElement("tr"); var th = document.createElement("th"); th.appendChild(document.createTextNode(engine.name)); th.setAttribute("colspan", 2); tr.appendChild(th); table.appendChild(tr);
        tr = document.createElement("tr");
        var td = document.createElement("td"); td.appendChild(button_edit); td.appendChild(button_debug); td.appendChild(button_remove); td.setAttribute("colspan", 2); tr.appendChild(td);
        table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Aliases")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.alias)); tr.appendChild(td); table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Keywords")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.keywords)); tr.appendChild(td); table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Search URL")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.baseurl)); tr.appendChild(td); tr.className="advanced hidden"; table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Result XPath")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.xpath_result)); tr.appendChild(td); tr.className="advanced hidden"; table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Title XPath")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.xpath_title)); tr.appendChild(td); tr.className="advanced hidden"; table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("URL XPath")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.xpath_url)); tr.appendChild(td); tr.className="advanced hidden"; table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Summary XPath")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.xpath_summary)); tr.appendChild(td); tr.className="advanced hidden"; table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Timeout (ms)")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.timeout)); tr.appendChild(td); table.appendChild(tr);
        tr = document.createElement("tr"); td = document.createElement("td"); td.appendChild(document.createTextNode("Cache time (ms)")); tr.appendChild(td); td = document.createElement("td"); td.appendChild(document.createTextNode(engine.ttl)); tr.appendChild(td); table.appendChild(tr);
        en_div.appendChild(table);
    });

    var params = new URL(location.href).searchParams;
    ["engine_name", "engine_alias", "engine_keywords", "engine_url", "engine_xpath_res", "engine_xpath_title", "engine_xpath_url", "engine_xpath_summary", "engine_timeout", "engine_ttl"].forEach(function(param) {
        if (params.get(param)) {
            document.getElementById(param).value = decodeURIComponent(params.get(param));
            let advancedDom = document.getElementsByClassName("advanced");
            [...advancedDom].forEach(function(el) {
                if (el.classList.contains("hidden")) {
                    el.classList.remove("hidden");
                }
            });
            document.getElementById("engine_create_form").childNodes[1].scrollIntoView();
        }
    });
}, console.log);

document.getElementById("engine_create_form").reset();
document.getElementById("engine_create_form").addEventListener("submit", (e) => {
    e.preventDefault();
    saveEngine(ID_TO_ADD);
});
document.getElementById("toggle_advanced").addEventListener("click", toggleAdvanced);
