# Metasearch

**A search engine aggregator**

Metasearch is a meta-search engine in the form of an extension. It aggregates
results from online search engines, that can either be general (such as
DuckDuckGo) or domain-specific (such as IMDb).

All of these results are fetched through the browser (as separate tabs opened
by the extension), so there is no centralized "Metasearch" service. This means
that the user is no more anonymous than if you were directly accessing these
websites, but it also makes it very easy to access login-bound search engines
such as library websites.

The Metasearch extension looks as much as an online search engine as possible,
and is installed as one in the browser, so it can be set as the default search
engine.

## Philosophy

Metasearch intends to be easy to use, private, and versatile. While general
search engines, such as Google, are good at answering all kinds of searches, a
large part of the time, the answers come from a small selection of large
websites, such as Wikipedia, or StackOverflow. These websites have their own
search, but it would be quite cumbersome to search each one manually.
Metasearch aims to facilitate this process, and answer a large percentage of
queries with domain-specific search engines, while deferring to general search
engines in the rest.

Metasearch ought to be as fast as the fastest engine it queries (at least for
displaying initial results). As such, it is faster than other search
aggregators, such as Searx, which by design have to wait for the slowest
result. Furthermore, Metasearch is intended for personal use, and thus is
packaged as a browser extension, so the user does not need to manage their own
server.

## Usage

In order to improve user experience, each engine is associated with a set of
aliases and keywords (configured through the options page). Aliases (such as
ddg for DuckDuckGo) enable the associated engines and are removed from the
search query. If the search query contains any aliases, only the engines that
contain at least one of these aliases are queried. Different engines may share
aliases (both Merriam-Webster and Wiktionary share the "define" alias), and the
same engine may have multiple aliases (IMDb has the aliases "movie", "tv", and
"imdb"). Keywords (such as "python" for StackOverflow) enable the associated
engines but are not removed from the search query. The star (\*) keyword
matches all queries (enabled by default for DuckDuckGo and Wikipedia). If an
engine's keywords exist in the query, but its alias doesn't it will only be
queried if the query does not contain any aliases.
