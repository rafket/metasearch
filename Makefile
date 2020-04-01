all: firefox chromium

lint:
	eslint ./src

firefox: lint
	./package.sh firefox

chromium: lint
	./package.sh chromium

run-firefox: firefox
	./run.sh metasearch-firefox.zip firefox-desktop

run-firefox-android: firefox
	./run.sh metasearch-firefox.zip firefox-android $(args)

run-chromium: chromium
	./run.sh metasearch-chromium.zip chromium
