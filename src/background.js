browser.browserAction.onClicked.addListener(function() {
    browser.tabs.create({"url": "/main.html"});
});

browser.webRequest.onBeforeRequest.addListener(
    req => browser.tabs.update(req.tabId, {url: req.url.replace("https://metasearch/", browser.runtime.getURL("/main.html"))}),
    {urls: ["https://metasearch/*"]}
);

browser.runtime.onMessage.addListener(
    function(request, sender) {
        if (request.timeout) {
            setTimeout(() => browser.tabs.remove(sender.tab.id), request.timeout);
        }
        if (request.kill_me) {
            browser.tabs.remove(sender.tab.id);
        }
        if (request.open_tab) {
            return browser.tabs.create(request.open_tab);
        }
        if (request.get_file) {
            return fetch(request.get_file).then(response => response.text());
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
