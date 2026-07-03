# Trace Grid

## Problem

The product could answer any question about a distributed system, but only if you already knew the right query to write. New users opened the dashboard, stared at a complex form, and filed a support ticket within 90 seconds.

## Process

Spent two weeks shadowing the on-call rotation. Built a query-suggestion model by hand from the top 200 saved queries, then prototyped the resulting autocomplete. Validated with moderated tests against the existing form-based UI.

The key insight: 80% of the value came from 12 query shapes. We didn't need an LLM to suggest queries — we needed the system to remember what its power users actually asked.

## Solution

The home screen is now a single search bar with a live waterfall preview underneath. Every query is shareable as a URL, and the most useful queries surface in a personal feed. The legacy form is still there, hidden behind a keyboard shortcut, for the 5% of cases that need it.

## Results

- Time to first insight dropped from 90 seconds to 4.
- Free-to-paid conversion is up 41% quarter-over-quarter.
- Support volume on the dashboard dropped 58%.
