all: firefox chromium

lint:
	eslint ./src

firefox: lint
	./package.sh firefox

chromium: lint
	./package.sh chromium

run-firefox: firefox
	./run.sh metasearch-firefox.zip firefox-desktop

run-chromium: chromium
	./run.sh metasearch-chromium.zip chromium
