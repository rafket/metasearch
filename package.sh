#!/bin/sh

platform="$1"
dir=$(mktemp -d)
cp -r ./src/* "$dir"
cp -r ./platform/$platform/* "$dir"
cp LICENSE.md "$dir"

(cd "$dir" && zip -qr "metasearch-$platform.zip" ./) && cp "$dir/metasearch-$platform.zip" ./ && rm -r "$dir"
