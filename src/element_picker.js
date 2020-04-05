function drawRect(path, el) {
    const rect = el.getBoundingClientRect();
    path.setAttribute("x", rect.left);
    path.setAttribute("y", rect.y);
    path.setAttribute("width", rect.width);
    path.setAttribute("height", rect.height);
}

function selectElement(callback, predicate="true()") {
    is_selecting = true;
    updateResultXPath();
    var lastElement = undefined;
    var highlight = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var highlight_path = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    var levels = 0;
    var selectedElement = undefined;
    highlight_path.style = "stroke: #0F0 !important; stroke-width: 0.5px !important; fill: rgba(63,255,63,0.2) !important;";
    highlight.style = "position: fixed !important; top: 0 !important; left: 0 !important; cursor: crosshair !important; width: 100% !important; height: 100% !important;";
    highlight.appendChild(highlight_path);
    overlay_dom.appendChild(highlight);
    const checkAndSelect = function(el) {
        if (document.evaluate(predicate, el, null, XPathResult.BOOLEAN_TYPE, null).booleanValue) {
            selectedElement = el;
            highlight.style.setProperty("cursor", "crosshair", "important");
        }
        else {
            selectedElement = null;
            highlight.style.setProperty("cursor", "not-allowed", "important");
        }
    };

    const mouseMove = function(ev) {
        if (!highlight.parentNode) {
            overlay_dom.appendChild(highlight);
        }
        overlay_dom.style.setProperty("pointer-events", "none", "important");
        var cur = document.elementFromPoint(ev.clientX, ev.clientY);
        overlay_dom.style.setProperty("pointer-events", "auto", "important");
        if (cur != lastElement) {
            levels = 0;
            drawRect(highlight_path, cur);
            lastElement = cur;
            checkAndSelect(cur);
        }
    };

    const mouseWheel = function(ev) {
        if (ev.ctrlKey && ev.deltaY != 0) {
            ev.preventDefault();
            if (ev.deltaY > 0) {
                levels += 1;
            }
            else {
                levels = levels>0?levels-1:0;
            }
            var par = lastElement;
            for (let i=0; i<levels; ++i) {
                if (par.localName.toLowerCase() != "body") {
                    par = par.parentNode;
                }
                else {
                    levels = i;
                }
            }
            drawRect(highlight_path, par);
            checkAndSelect(par);
        }
    };

    const mouseClick = function() {
        if (selectedElement) {
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("wheel", mouseWheel);
            overlay_dom.removeEventListener("click", mouseClick);
            is_selecting = false;
            callback(selectedElement);
        }
    };

    document.addEventListener("mousemove", mouseMove, {passive: false});
    document.addEventListener("wheel", mouseWheel, {passive: false});
    overlay_dom.addEventListener("click", mouseClick, {passive: false});
}

function createXPathFromElement(el, upto=undefined, nlevels=100000) {
    var path = [];
    for (let i=0; el && el.nodeType == 1 && el != upto && i<nlevels && el.parentNode; el = el.parentNode, i++) {
        var siblings = [...el.parentNode.childNodes].filter((s) => s.localName == el.localName);
        if (siblings.length == 1) {
            path.unshift(el.localName.toLowerCase());
        }
        else {
            path.unshift(el.localName.toLowerCase() + "[" + (siblings.indexOf(el) + 1) + "]");
        }
    }
    return (path.length>0?(upto?"./":"/"):"") + path.join("/");
}

function generateCommonXPath(elements, exclude) {
    if (!elements || elements.length == 0) {
        return null;
    }
    var parents = [];
    var minlength = 1000000;
    [...elements, ...exclude].forEach(function(el) {
        var curpar = [];
        while (el) {
            el.classList = el.classList || [];
            curpar.push(el);
            el = el.parentNode;
        }
        minlength = curpar.length<minlength?curpar.length:minlength;
        parents.push(curpar);
    });
    var class_inc_exc = null;
    for (let l=0; l<minlength; ++l) {
        let class_include = parents.slice(0, elements.length).reduce((acc, cur, idx) => idx==0?[...cur[l].classList]:acc.filter(v => [...cur[l].classList].includes(v)), []),
            class_exclude = parents.slice(elements.length, parents.length).reduce((acc, cur) => [...acc, ...[...cur[l].classList].filter(v => !acc.includes(v))], []);
        let class_eq = class_include.filter(v => !class_exclude.includes(v)),
            class_neq = class_exclude.filter(v => !class_include.includes(v));
        console.log(class_include, class_exclude, class_eq, class_neq);
        if (class_eq.length > 0) {
            class_inc_exc = [class_eq, class_exclude, l];
            break;
        }
        else if (class_neq.length > 0) {
            class_inc_exc = [class_include, class_neq, l];
            break;
        }
    }
    var class_selector = class_inc_exc?[...class_inc_exc[0], ...class_inc_exc[1]].map((c, i) => (i<class_inc_exc[0].length?"(":"not(") + "contains(concat(\" \",@class,\" \"), \" " + c + " \"))").join(" and "):null;
    console.log(class_selector);
    var xpath = class_selector?"//*[" + class_selector + "]":"";
    var upto = class_inc_exc?class_inc_exc[2]:minlength-1;
    for (let l=upto-1; l>=0; --l) {
        let unique_el = parents.slice(0, elements.length).reduce((acc, cur, idx) => idx==0?[cur[l]]:(acc.includes(cur[l])?acc:[...acc,cur[l]]), []);
        //unique_ex = parents.slice(elements.length, parents.length).reduce((acc, cur, idx) => idx==0?[cur[l]]:(acc.includes(cur[l])?acc:[...acc,cur[l]]), []);
        var node;
        if (unique_el.length == 1 && unique_el[0].parentNode) {
            var siblings = [...unique_el[0].parentNode.childNodes].filter((s) => s.localName == unique_el[0].localName);
            if (siblings.length == 1) {
                node = unique_el[0].localName.toLowerCase();
            }
            else {
                node = unique_el[0].localName.toLowerCase() + "[" + (siblings.indexOf(unique_el[0]) + 1) + "]";
            }
        }
        else if (unique_el.length >= 1 && unique_el[0].localName) {
            node = unique_el[0].localName.toLowerCase();
        }
        else {
            node = "*";
        }
        xpath += "/" + node;
    }

    return xpath;
}

document.onscroll = () => updateResultXPath();
function updateResultXPath() {
    popup_doc.getElementById("result_xpath").innerText = result_xpath?result_xpath:"(none)";
    attrs.forEach(attr => popup_doc.getElementById(attr + "_xpath").innerText = attr_xpath[attr]?attr_xpath[attr]:"(none)");
    overlay_dom.innerHTML = "";
    if (!result_xpath || !overlay_dom) {
        return;
    }
    let els = document.evaluate(result_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var highlight = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    highlight.style = "position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;";
    overlay_dom.appendChild(highlight);
    for (let i=0; i<els.snapshotLength; ++i) {
        let el = els.snapshotItem(i);
        var attr_el = {};
        attrs.forEach(attr => attr_el[attr] = attr_xpath[attr]?document.evaluate(attr_xpath[attr], el, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue:null);

        var highlight_path = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        highlight_path.style = "stroke: #00F !important; stroke-width: 0.5px !important; fill: rgba(63,63,255,0.20) !important; cursor: crosshair !important;";
        drawRect(highlight_path, el);

        if (!is_selecting) {
            highlight_path.style.setProperty("pointer-events", "auto", "important");
            highlight_path.addEventListener("click", function() {
                if (!exclude.includes(el)) {
                    exclude.push(el);
                }
                results = results.filter(u => u !== el);
                result_xpath = generateCommonXPath(results, exclude);
                updateResultXPath();
                popup_doc.getElementById("results").innerText = results&&results.length>0?results.map((r) => createXPathFromElement(r, null)).join("\n"):"(none)";
                popup_doc.getElementById("exclude").innerText = exclude&&exclude.length>0?exclude.map((r) => createXPathFromElement(r, null)).join("\n"):"(none)";
            });
        }
        highlight.appendChild(highlight_path);

        const highlightEl = function(el, color) {
            if (el) {
                var hp = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                hp.style = `stroke: ${color} !important; stroke-width: 2px !important; fill: none !important;`;
                drawRect(hp, el);
                highlight.appendChild(hp);
            }
        };

        if (attr_xpath["title"] && (attr_el["title"] && attr_el["title"].innerText)) {
            highlightEl(attr_el["title"], "#0FF");
        }
        if (attr_xpath["url"] && (attr_el["url"] && attr_el["url"].href)) {
            highlightEl(attr_el["url"], "#F0F");
        }
        if (attr_xpath["summary"] && (attr_el["summary"] && attr_el["summary"].innerText)) {
            highlightEl(attr_el["summary"], "#FF0");
        }
    }
}

function getRelativeResultXPath(el) {
    var els = document.evaluate(result_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i=0; i<els.snapshotLength; ++i) {
        let result = els.snapshotItem(i);
        if (result.contains(el)) {
            return createXPathFromElement(el, result, 100000);
        }
    }
    return undefined;
}

var popup_dom = document.createElement("iframe"),
    overlay_dom = document.createElement("metasearch-overlay"),
    attrs = ["title", "url", "summary"],
    popup_doc,
    results = [],
    exclude = [],
    result_xpath,
    attr_xpath = {},
    format_url,
    is_selecting = false;

overlay_dom.style = "background: transparent none repeat scroll 0% 0% !important; border: 0px none !important; border-radius: 0px !important; box-shadow: none !important; display: block !important; height: 100% !important; left: 0px !important; margin: 0px !important; max-height: none !important; max-width: none !important; opacity: 1 !important; outline: currentcolor none 0px !important; padding: 0px !important; position: fixed !important; top: 0px !important; visibility: visible !important; width: 100% !important; z-index: 0;";
browser.runtime.sendMessage({get_file: "element_picker.html"})
    .then(src => popup_dom.srcdoc = src)
    .catch(console.log);

document.documentElement.appendChild(popup_dom);
document.documentElement.appendChild(overlay_dom);

popup_dom.onload = function() {
    popup_dom.style = "position: fixed !important; z-index: 2147483647 !important; bottom: 0 !important; right: 0 !important; height: 400px !important; width: 300px !important; border: none !important";
    popup_dom.style.setProperty("pointer-events", "auto", "important");
    popup_dom.style.display = "block";
    popup_doc = popup_dom.contentDocument;
    popup_doc.getElementById("url").innerText = location.href;
    popup_doc.getElementById("highlight_okay").addEventListener("click", function() {
        let sel = popup_doc.getSelection();
        if (sel.anchorNode == sel.focusNode && sel.anchorNode == popup_doc.getElementById("url").childNodes[0]) {
            var from = sel.anchorOffset, to = sel.focusOffset;
            if (from > to) {
                [from, to] = [to, from];
            }
            format_url = location.href.slice(0, from) + "{searchTerms}" + location.href.slice(to, location.href.length);
            popup_doc.getElementById("searchterm").innerText = format_url;
        }
    });
    popup_doc.getElementById("result_add").addEventListener("click", function() {
        popup_dom.style.display = "none";
        selectElement(function(el) {
            if (!results.includes(el)) {
                results.push(el);
            }
            exclude = exclude.filter(u => u !== el);
            result_xpath = generateCommonXPath(results, exclude);
            updateResultXPath();
            popup_doc.getElementById("results").innerText = results&&results.length>0?results.map((r) => createXPathFromElement(r, null)).join("\n"):"(none)";
            popup_doc.getElementById("exclude").innerText = exclude&&exclude.length>0?exclude.map((r) => createXPathFromElement(r, null)).join("\n"):"(none)";
            popup_dom.style.display = "block";
        });
    });
    popup_doc.getElementById("result_remove").addEventListener("click", function() {
        results.pop();
        result_xpath = generateCommonXPath(results, exclude);
        updateResultXPath();
        popup_doc.getElementById("results").innerText = results&&results.length>0?results.map((r) => createXPathFromElement(r, null)).join("\n"):"(none)";
    });
    popup_doc.getElementById("exclude_remove").addEventListener("click", function() {
        exclude.pop();
        result_xpath = generateCommonXPath(results, exclude);
        updateResultXPath();
        popup_doc.getElementById("exclude").innerText = exclude&&exclude.length>0?exclude.map((r) => createXPathFromElement(r, null)).join("\n"):"(none)";
    });
    attrs.forEach(function(attr) {
        popup_doc.getElementById(attr + "_select").addEventListener("click", function() {
            popup_dom.style.display = "none";
            selectElement(function(el) {
                attr_xpath[attr] = getRelativeResultXPath(el);
                updateResultXPath();
                popup_dom.style.display = "block";
            }, attr=="url"?"@href":"text()");
        });
    });
    popup_doc.getElementById("submit").addEventListener("click", function() {
        browser.runtime.sendMessage({open_tab: {url: browser.runtime.getURL("options.html") + "?engine_xpath_res="+encodeURIComponent(result_xpath)+"&engine_xpath_title="+encodeURIComponent(attr_xpath["title"])+"&engine_xpath_url="+encodeURIComponent(attr_xpath["url"])+"&engine_xpath_summary="+encodeURIComponent(attr_xpath["summary"])+"&engine_name="+encodeURIComponent(popup_doc.getElementById("name").value)+"&engine_url="+encodeURIComponent(format_url)+"&engine_timeout=3000&engine_ttl=300000", active: true}}).then(
            () => browser.runtime.sendMessage({kill_me: true})
        );
    });
    updateResultXPath();
};
