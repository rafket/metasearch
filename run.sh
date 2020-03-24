#!/bin/sh

file="$1"
platform="$2"
dir=$(mktemp -d)
unzip "$1" -d "$dir" && web-ext run -s "$dir" -t "$platform" && rm -r "$dir"
