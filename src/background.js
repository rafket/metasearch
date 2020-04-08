browser.browserAction.onClicked.addListener(function() {
    browser.tabs.create({"url": "/main.html"});
});

browser.webRequest.onBeforeRequest.addListener(
    req => browser.tabs.update(req.tabId, {url: req.url.replace("https://metasearch/", browser.runtime.getURL("/main.html"))}),
    {urls: ["https://metasearch/*"]}
);

browser.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.update_me) {
            return browser.tabs.update(sender.tab.id, request.update_me);
        }
        if (request.get_file) {
            return fetch(request.get_file).then(response => response.text());
        }
        if (request.open_engine) {
            var tabid;
            var prom = browser.tabs.create({url: request.open_engine.url, active: false})
                .then(tab => {
                    if (browser.tabs.hide) {
                        browser.tabs.hide(tab.id);
                    }
                    setTimeout(() => browser.tabs.remove(tab.id), request.open_engine.timeout);
                    tabid = tab.id;
                })
                .then(() => browser.tabs.executeScript(tabid, {file: "browser-polyfill.min.js"}))
                .then(() => browser.tabs.executeScript(tabid, {file: "helper.js"}))
                .then(() => tabid);
            return prom;
        }
    }
);

browser.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "install") {
        browser.tabs.create({"url": "/install.html"});
        browser.runtime.getBrowserInfo()
            .then(info => {if (info.name == "Fennec") window.external.AddSearchProvider("https://raw.githubusercontent.com/rafket/metasearch/master/src/opensearch.xml");});
    }
});

if (browser.contextMenus) {
    browser.contextMenus.create({
        id: "metasearch-add-engine",
        title: "Add current page as engine",
        contexts: ["browser_action"]
    });

    browser.contextMenus.onClicked.addListener(function(info, tab) {
        if (info.menuItemId == "metasearch-add-engine") {
            browser.tabs.executeScript(tab.id, {
                file: "browser-polyfill.min.js"
            }).then(() => browser.tabs.executeScript(tab.id, {
                file: "element_picker.js"
            }));
        }
    });
}
