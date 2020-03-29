all: firefox chromium

lint:
	eslint ./src

firefox: lint
	./package.sh firefox

firefox-android: lint
	./package.sh firefox-android

chromium: lint
	./package.sh chromium

run-firefox: firefox
	./run.sh metasearch-firefox.zip firefox-desktop

run-firefox-android: firefox
	./run.sh metasearch-firefox.zip firefox-android $(args)

run-chromium: chromium
	./run.sh metasearch-chromium.zip chromium
