# Lattice Docs

## Problem

The API reference was technically complete but practically useless: 11 tabs to read before you could make your first call, no working examples for the failure modes that mattered, and a search that returned marketing pages before docs.

## Process

Sat with five customer teams for two days. Rebuilt the information architecture from the request shape up, not from the URL up. Prototyped in a static HTML build that I could A/B test against the live site.

## Solution

A single endpoint page: request on the left, response on the right, failure modes collapsed at the bottom. Every page has a working copy-pasteable curl example. Search prioritises reference pages over marketing.

## Results

- Time from landing on a docs page to a successful 200 response dropped 47%.
- Doc-search success rate is up 62%.
- Support tickets about the API are down a third.
