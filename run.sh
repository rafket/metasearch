#!/bin/sh

file="$1"
platform="$2"
dir=$(mktemp -d)
unzip -q "$1" -d "$dir" && web-ext lint -s "$dir" && web-ext run --verbose -s "$dir" -t "$platform" "${@:3}" && rm -r "$dir"
