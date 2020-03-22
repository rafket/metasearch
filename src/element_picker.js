function drawRect(path, el) {
    const rect = el.getBoundingClientRect();
    path.setAttribute('x', rect.left);
    path.setAttribute('y', rect.y);
    path.setAttribute('width', rect.width);
    path.setAttribute('height', rect.height);
}

function selectElement(callback) {
    is_selecting = true;
    updateResultXPath();
    var lastElement = undefined;
    var highlight = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var highlight_path = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    var levels = 0;
    var selectedElement = undefined;
    highlight_path.style = 'stroke: #0F0 !important; stroke-width: 0.5px !important; fill: rgba(63,255,63,0.2) !important;';
    highlight.style = 'position: fixed !important; top: 0 !important; left: 0 !important; cursor: crosshair !important; width: 100% !important; height: 100% !important;';
    highlight.appendChild(highlight_path);
    overlay_dom.appendChild(highlight);
    const mouseMove = function(ev) {
        overlay_dom.style.setProperty('pointer-events', 'none', 'important');
        var cur = document.elementFromPoint(ev.clientX, ev.clientY);
        overlay_dom.style.setProperty('pointer-events', 'auto', 'important');
        if (cur != lastElement) {
            levels = 0;
            drawRect(highlight_path, cur);
            lastElement = cur;
            selectedElement = cur;
        }
    }

    const mouseWheel = function(ev) {
        if (ev.ctrlKey && ev.deltaY != 0) {
            ev.preventDefault();
            if (ev.deltaY > 0) {
                levels += 1;
            }
            else {
                levels = levels>0?levels-1:0;
            }
            for (var par = lastElement, i=0; i<levels; ++i) {
                if (par.localName.toLowerCase() != 'body') {
                    par = par.parentNode;
                }
                else {
                    levels = i;
                }
            }
            drawRect(highlight_path, par);
            selectedElement = par;
        }
    }

    const mouseClick = function() {
        if (selectedElement) {
            document.removeEventListener('mousemove', mouseMove);
            document.removeEventListener('wheel', mouseWheel);
            overlay_dom.removeEventListener('click', mouseClick);
            is_selecting = false;
            callback(selectedElement);
        }
    }

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('wheel', mouseWheel);
    overlay_dom.addEventListener('click', mouseClick);
}

function createXPathFromElement(el, upto=undefined, nlevels=100000) {
    var path = [];
    for (var i=0; el && el.nodeType == 1 && el != upto && i<nlevels && el.parentNode; el = el.parentNode, i++) {
        var siblings = [...el.parentNode.childNodes].filter((s) => s.localName == el.localName);
        if (siblings.length == 1) {
            path.unshift(el.localName.toLowerCase());
        }
        else {
            path.unshift(el.localName.toLowerCase() + '[' + (siblings.indexOf(el) + 1) + ']');
        }
    }
    return (path.length>0?(upto?'./':'/'):'') + path.join('/');
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
    var common_class = null;
    for (var l=0; l<minlength; ++l) {
        let class_eq = parents.reduce((acc, cur, idx) => idx==0?[...cur[l].classList]:(idx<elements.length?acc.filter(v => [...cur[l].classList].includes(v)):acc.filter(v => ![...cur[l].classList].includes(v))), []);
        if (class_eq.length > 0) {
            common_class = [class_eq[0], l];
            break;
        }
    }
    if (common_class) {
        return '//*[contains(concat(\' \',@class,\' \'), \' ' + common_class[0] + ' \')]' + createXPathFromElement(parents[0][0], null, common_class[1]);
    }
}

document.onscroll = () => updateResultXPath();
function updateResultXPath() {
    popup_doc.getElementById('result_xpath').innerText = result_xpath?result_xpath:'(none)';
    attrs.forEach(attr => popup_doc.getElementById(attr + '_xpath').innerText = attr_xpath[attr]?attr_xpath[attr]:'(none)');
    overlay_dom.innerHTML = '';
    if (!result_xpath || !overlay_dom) {
        return;
    }
    let els = document.evaluate(result_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var highlight = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    highlight.style = 'position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;';
    overlay_dom.appendChild(highlight);
    for (var i=0; i<els.snapshotLength; ++i) {
        let el = els.snapshotItem(i);
        var attr_el = {};
        attrs.forEach(attr => attr_el[attr] = attr_xpath[attr]?document.evaluate(attr_xpath[attr], el, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue:null);

        var highlight_path = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        highlight_path.style = 'stroke: #00F !important; stroke-width: 0.5px !important; fill: rgba(63,63,255,0.20) !important; cursor: crosshair !important;'
        drawRect(highlight_path, el);

        if (!is_selecting) {
            highlight_path.style.setProperty('pointer-events', 'auto', 'important');
            highlight_path.addEventListener('click', function() {
                exclude.push(el);
                results = results.filter(u => u !== el);
                result_xpath = generateCommonXPath(results, exclude);
                updateResultXPath();
                popup_doc.getElementById('results').innerText = results&&results.length>0?results.map((r) => createXPathFromElement(r, null)).join('\n'):'(none)';
                popup_doc.getElementById('exclude').innerText = exclude&&exclude.length>0?exclude.map((r) => createXPathFromElement(r, null)).join('\n'):'(none)';
            });
        }
        highlight.appendChild(highlight_path);

        const highlightEl = function(el, color) {
            if (el) {
                var hp = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                hp.style = `stroke: ${color} !important; stroke-width: 2px !important; fill: none !important;`;
                drawRect(hp, el);
                highlight.appendChild(hp);
            }
        }

        if (attr_xpath['title'] && (attr_el['title'] && attr_el['title'].innerText)) {
            highlightEl(attr_el['title'], '#0FF');
        }
        if (attr_xpath['url'] && (attr_el['url'] && attr_el['url'].href)) {
            highlightEl(attr_el['url'], '#F0F');
        }
        if (attr_xpath['summary'] && (attr_el['summary'] && attr_el['summary'].innerText)) {
            highlightEl(attr_el['summary'], '#FF0');
        }
    }
}

function getRelativeResultXPath(el) {
    var els = document.evaluate(result_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i=0; i<els.snapshotLength; ++i) {
        let result = els.snapshotItem(i);
        if (result.contains(el)) {
            return createXPathFromElement(el, result, 100000);
        }
    }
    return undefined;
}

function findArgument(url) {
    var urlobj = new URL(url);
    var params = urlobj.searchParams; //new URLSearchParams(urlobj.search);
    var entry = [undefined, undefined];
    var entries = (typeof params.entries()[Symbol.iterator] === 'function')?params.entries():params.entries().wrappedJSObject;
    for (var cur of entries) {
        if (document.documentElement.innerText.split(cur[1]).length > document.documentElement.innerText.split(entry[1]).length) {
            entry = cur;
        }
    }
    if (entry[0]) {
        params.set(entry[0], '{searchTerms}');
        return urlobj.protocol + '//' + urlobj.host + urlobj.pathname + '?' + params.toString();
    }
    return url;
}

var popup_dom = document.createElement('iframe'),
    overlay_dom = document.createElement('metasearch-overlay'),
    attrs = ['title', 'url', 'summary'],
    popup_doc,
    results = [],
    exclude = [],
    result_xpath,
    attr_xpath = {},
    is_selecting = false;

overlay_dom.style = 'background: transparent none repeat scroll 0% 0% !important; border: 0px none !important; border-radius: 0px !important; box-shadow: none !important; display: block !important; height: 100% !important; left: 0px !important; margin: 0px !important; max-height: none !important; max-width: none !important; opacity: 1 !important; outline: currentcolor none 0px !important; padding: 0px !important; position: fixed !important; top: 0px !important; visibility: visible !important; width: 100% !important; z-index: 0;';
browser.runtime.sendMessage({get_file: 'element_picker.html'})
    .then(src => popup_dom.srcdoc = src)
    .catch(console.log);

document.documentElement.appendChild(popup_dom);
document.documentElement.appendChild(overlay_dom);

popup_dom.onload = function() {
    popup_dom.style = 'position: fixed !important; z-index: 2147483647 !important; bottom: 0 !important; right: 0 !important; height: 400px !important; width: 300px !important; border: none !important';
    popup_dom.style.setProperty('pointer-events', 'auto', 'important');
    popup_dom.style.display = 'block';
    popup_doc = popup_dom.contentDocument;
    popup_doc.getElementById('result_add').addEventListener('click', function() {
        popup_dom.style.display = 'none';
        selectElement(function(el) {
            results.push(el);
            exclude = exclude.filter(u => u !== el);
            result_xpath = generateCommonXPath(results, exclude);
            updateResultXPath();
            popup_doc.getElementById('results').innerText = results&&results.length>0?results.map((r) => createXPathFromElement(r, null)).join('\n'):'(none)';
            popup_doc.getElementById('exclude').innerText = exclude&&exclude.length>0?exclude.map((r) => createXPathFromElement(r, null)).join('\n'):'(none)';
            popup_dom.style.display = 'block';
        });
    });
    popup_doc.getElementById('result_remove').addEventListener('click', function() {
        results.pop();
        result_xpath = generateCommonXPath(results, exclude);
        updateResultXPath();
        popup_doc.getElementById('results').innerText = results.map((r) => createXPathFromElement(r, undefined)).join('\n');
    });
    attrs.forEach(function(attr) {
        popup_doc.getElementById(attr + '_select').addEventListener('click', function() {
            popup_dom.style.display = 'none';
            selectElement(function(el) {
                attr_xpath[attr] = getRelativeResultXPath(el)
                updateResultXPath();
                popup_dom.style.display = 'block';
            });
        });
    });
    popup_doc.getElementById('submit').addEventListener('click', function() {
        browser.runtime.sendMessage({open_tab: {url: browser.runtime.getURL('options.html') + '?engine_xpath_res='+encodeURIComponent(result_xpath)+'&engine_xpath_title='+encodeURIComponent(attr_xpath['title'])+'&engine_xpath_url='+encodeURIComponent(attr_xpath['url'])+'&engine_xpath_summary='+encodeURIComponent(attr_xpath['summary'])+'&engine_name='+encodeURIComponent(document.title)+'&engine_url='+encodeURIComponent(findArgument(location.href))+'&engine_timeout=3000&engine_ttl=300000', active: true}}).then(
            () => browser.runtime.sendMessage({kill_me: true})
        );
    });
    updateResultXPath();
}
