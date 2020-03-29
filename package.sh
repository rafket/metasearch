#!/bin/sh

platform="$1"
dir=$(mktemp -d)
cp -r ./src/* "$dir"
cp -rf ./platform/$platform/* "$dir"
cp LICENSE.md "$dir"
curl https://unpkg.com/webextension-polyfill@0.6.0/dist/browser-polyfill.min.js -s -o "$dir/browser-polyfill.min.js"

(cd "$dir" && zip -qr "metasearch-$platform.zip" ./) && cp "$dir/metasearch-$platform.zip" ./ && rm -r "$dir"
