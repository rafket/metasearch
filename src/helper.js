function extractXPaths(xpath_result, xpath_sub, retries=10) {
    let xpath_eval = document.evaluate(xpath_result, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (xpath_eval.snapshotLength == 0) {
        if (retries == 0) {
            return new Promise(resolve => resolve([]));
        }
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        return wait(10).then(() => extractXPaths(xpath_result, xpath_sub, retries-1));
    }
    var results = [];
    for (var i=0; i<xpath_eval.snapshotLength; i++) {
        let result = xpath_eval.snapshotItem(i);
        var tmp = {};
        for (let key in xpath_sub) {
            tmp[key] = document.evaluate(xpath_sub[key], result, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
        results.push(tmp);
    }
    return new Promise(resolve => resolve(results));
}

function getXPath(xpath_result, xpath_title, xpath_url, xpath_summary) {
    return extractXPaths(xpath_result, {"title": xpath_title, "url": xpath_url, "summary": xpath_summary}, 0).then(function(elements) {
        var results = [];
        elements.forEach(function (el, i) {
            if (el["title"] != null && el["title"].innerText) {
                results.push({"title": el["title"].innerText, "url": (el["url"] || window.location).href, "summary": (el["summary"] || {"innerText": ""}).innerText || "", "score": i/elements.length});
            }
        });
        return results;
    });
}

browser.runtime.onConnect.addListener(function(port) {
    var prev_resp = null;
    port.postMessage({"resp": "hello"});
    port.onMessage.addListener(function(m) {
        const sendXPath = function() {
            getXPath(m.xpath_result, m.xpath_title, m.xpath_url, m.xpath_summary).then(
                function(resp) {
                    if (!resp) {
                        return;
                    }
                    var isDiff = !prev_resp || (prev_resp.length != resp.length);
                    if (!isDiff) {
                        for (var i=0; i<resp.length; ++i) {
                            if (!Object.keys(resp[i]).every((key) =>  resp[i][key] === prev_resp[i][key])) {
                                isDiff = true;
                                break;
                            }
                        }
                    }
                    if (isDiff) {
                        port.postMessage({"resp": resp});
                        prev_resp = resp;
                    }
                }, function(err) {
                    port.postMessage({"error": err});
                });
        };
        sendXPath();
        const observer = new MutationObserver(() => sendXPath());
        observer.observe(document, {attributes: true, childList: true, subtree: true});
    });
});
