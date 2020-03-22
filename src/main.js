import {addCache, getCache, getEngineSpec} from './storage.js';
var results_global = {},
    engines_promise = getEngineSpec(),
    params = new URL(location.href).searchParams;
if (params.get('q')) {
    document.getElementById('searchbar').value = params.get('q');
    performSearch(params.get('q'));
}

function get(url, engine, hidden) {
    return getCache(engine, url).then(function(cached) {
        if (cached) {
            return (callback_succ) => callback_succ(cached);
        }
        else {
            return browser.tabs.create({"url": url, "active": false}).then(function(tab) {
                if (hidden && browser.tabs.hide) {
                    browser.tabs.hide(tab.id);
                }
                return browser.tabs.executeScript(tab.id, {file: 'browser-polyfill.min.js'})
                    .then(() =>  browser.tabs.executeScript(tab.id, {file: 'helper.js'}))
                    .then(() => {
                        let port = browser.tabs.connect(tab.id);
                        port.postMessage(engine);
                        return function(callback_succ, callback_err) {
                            port.onMessage.addListener(function(r) {
                                if (r.resp) {
                                    addCache(engine, url, r.resp);
                                    callback_succ(r.resp);
                                }
                                else {
                                    callback_err(r.err || r);
                                }
                            });
                        };
                    });
            });
        }
    });
}

function searchAndAddToDom(url, engine, hidden) {
    return get(url, engine, hidden).then(function(get_resp) {
        get_resp(function(resp) {
            resp.forEach((el) => el['engine_name'] = engine.name);
            results_global[engine.id] = resp;
            updateResults(results_global);
        }, console.log);
    });
}

function updateResults(results) {
    let new_results_dom = document.createElement('div');
    Object.entries(results)
        .reduce((acc, arr) => [...acc, ...arr[1]], [])
        .sort((u,v) => decodeURIComponent(u.url)==decodeURIComponent(v.url)?u.score - v.score:(decodeURIComponent(u.url)<decodeURIComponent(v.url)?-1:1))
        .reduce((acc, u) => {
            var prev = acc.length > 0 ? {...acc[acc.length-1]} : {};
            if (acc.length > 0 && decodeURIComponent(prev.url) == decodeURIComponent(u.url) && !prev.engine_name.includes(u.engine_name)) {
                prev.engine_name += ', ' + u.engine_name;
                prev.score = prev.score < u.score ? prev.score : u.score;
                if (acc.length >= 2) {
                    return [...acc.slice(0, -1), prev];
                }
                return [prev];
            }
            return [...acc, u];
        }, [])
        .sort((u, v) => u.score - v.score)
        .forEach(function (el) {
            var entry = document.createElement("div"); entry.className = 'result';
            var h2 = document.createElement("h2"); h2.appendChild(document.createTextNode(el.title)); h2.className = 'result_title';
            var a = document.createElement("a"); a.href = el.url; a.appendChild(h2); entry.appendChild(a);
            var div = document.createElement("div"); div.className = 'result_info'; entry.appendChild(div);
            var p0 = document.createElement("p"); p0.appendChild(document.createTextNode(decodeURIComponent(el.url))); p0.className = 'result_url'; div.appendChild(p0);
            var p2 = document.createElement("p"); p2.appendChild(document.createTextNode(el.engine_name)); p2.className = 'result_engine'; div.appendChild(p2);
            var p1 = document.createElement("p"); p1.appendChild(document.createTextNode(el.summary)); p1.className = 'result_summary'; entry.appendChild(p1);
            new_results_dom.appendChild(entry);
        });
    let results_dom = document.getElementById('searchresults');
    results_dom.parentNode.replaceChild(new_results_dom, results_dom);
    new_results_dom.setAttribute('id', 'searchresults');
}

function performSearch(search_term) {
    var h2 = document.createElement("h2");
    h2.appendChild(document.createTextNode("Enable inactive engine:"));
    document.getElementById('inactiveengines').appendChild(h2);
    engines_promise.then(function(engines) {
        let contains_alias = engines.reduce((acum, cur) => (acum || checkAlias(cur, search_term)), false);
        let sanitized_search = sanitizeSearch(engines, search_term);
        engines.forEach(function(engine) {
            if (shouldQueryEngine(engine, search_term, contains_alias)) {
                searchAndAddToDom(engine.baseurl.replace("{searchTerms}", encodeURIComponent(sanitized_search)), engine, true).catch(console.log);
            }
            else {
                addUnusedEngine(engine, sanitized_search);
            }
        });
    });
}

function addUnusedEngine(engine, sanitized_search) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(engine.name));
    button.addEventListener('click', function() {
        searchAndAddToDom(engine.baseurl.replace("{searchTerms}", encodeURIComponent(sanitized_search)), engine, true).catch(console.log);
        document.getElementById('inactiveengines').removeChild(button);
        if (document.getElementById('inactiveengines').children.length == 1) {
            document.getElementById('inactiveengines').removeChild(document.getElementById('inactiveengines').children[0]);
        }
    });
    document.getElementById('inactiveengines').appendChild(button);
}

function sanitizeSearch(engines, search_term) {
    return search_term.split(' ').reduce(function(accum, word) {
        var keep = true;
        engines.forEach(function(engine) {
            engine.alias.split(',').forEach(function(alias) {
                if (word === alias) {
                    keep = false;
                }
            });
        });
        if (keep) {
            if (accum) {
                return accum + ' ' + word;
            }
            return word
        }
        return accum;
    }, '');
}

function checkAlias(engine, search_term) {
    var ans = false;
    search_term.split(' ').forEach(function(word) {
        engine.alias.split(',').forEach(function(alias) {
            if (word === alias) {
                ans = true;
            }
        });
    });
    return ans;
}

function shouldQueryEngine(engine, search_term, check_alias) {
    if (check_alias) {
        return checkAlias(engine, search_term);
    }
    var ans = false;
    search_term.split(' ').forEach(function(word) {
        engine.keywords.split(',').forEach(function(keyword) {
            if (word.toLowerCase() === keyword || keyword === '*') {
                ans = true;
            }
        });
    });
    return ans;
}
