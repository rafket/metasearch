all: firefox chromium

firefox:
	./package.sh firefox

chromium:
	./package.sh chromium

run-firefox: firefox
	./run.sh metasearch-firefox.zip firefox-desktop

run-chromium: chromium
	./run.sh metasearch-chromium.zip chromium
