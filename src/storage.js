let MAX_CACHE = 500;

export function getEngineSpec() {
    return browser.storage.sync.get("engines")
        .then(res => res.engines?res.engines.map(sanitizeEngine):getDefaultEngines())
        .then(res => res.sort((a,b) => a.name<b.name?-1:1));
}

function sanitizeEngine(engine) {
    if (!engine.name) engine.name = "Untitled Engine";
    if (!engine.alias) engine.alias = "";
    if (!engine.keywords) engine.keywords = "";
    if (!engine.baseurl) engine.baseurl = "";
    if (!engine.xpath_result) engine.xpath_result = "";
    if (!engine.xpath_title) engine.xpath_title = "";
    if (!engine.xpath_url) engine.xpath_url = "";
    if (!engine.xpath_summary) engine.xpath_summary = "";
    if (!engine.timeout) engine.timeout = 30000;
    if (!engine.ttl) engine.ttl = 1000 * 60 * 5;
    return engine;
}

export function addEngine(engine) {
    return getEngineSpec()
        .then(engines => browser.storage.sync.set({
            engines: (engines || []).filter(en => en.id != engine.id).concat([engine])
        }));
}

export function removeEngine(id) {
    return getEngineSpec()
        .then(engines => browser.storage.sync.set({
            engines: engines.filter(en => en.id !== id)
        }));
}

export function getDefaultEngines() {
    return fetch("default_engines.json").then(response => response.json());
}

function genCacheKey(eid, url) {
    return "cache:" + btoa(eid) + ":" + btoa(url);
}

function revCacheKey(key) {
    let spl = key.split(":");
    return {eid: atob(spl[1]), url: atob(spl[2])};
}

export function addCache(engine, url, contents) {
    return reapCache().then(() => browser.storage.local.set({
        [genCacheKey(engine.id, url)]: {ts: Date.now(), contents: contents, ttl: engine.ttl}
    }));
}

export function getCache(engine, url) {
    let key = genCacheKey(engine.id, url);
    return browser.storage.local.get(key)
        .then(res => res[key])
        .then(res => (res && res.ts + res.ttl > Date.now())?res.contents:null);
}

function exportCache() {
    return browser.storage.local.get()
        .then(res => Object.entries(res)
            .filter(el => el[0].startsWith("cache:"))
            .map(el => ({info: revCacheKey(el[0]), data: el[1]}))
        );
}

export function downloadCache() {
    return exportCache()
        .then(res => JSON.stringify(res, null, 2))
        .then(res => new Blob([res], {type: "text/json"}))
        .then(res => URL.createObjectURL(res))
        .then(res => window.open(res));
}

function reapCache() {
    let curtime = Date.now();
    return browser.storage.local.get()
        .then(function(res) {
            let entries = Object.entries(res);
            var promises = entries.filter(el => el[1].ts + el[1].ttl <= curtime).map(el => browser.storage.local.remove(el[0]));
            let remaining = entries.filter(el => el[1].ts + el[1].ttl > curtime);
            if (remaining.length > MAX_CACHE) {
                let rem = remaining.reduce((acc, cur) => acc ? (Math.round(Math.random()*remaining.length)==0 ? cur : acc) : cur, null);
                promises.push(browser.storage.local.remove(rem));
            }
            return Promise.all(promises);
        });
}
