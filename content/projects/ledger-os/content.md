# Ledger OS

## Problem

The founding team was running the entire company's books in a single Notion database with 14 linked tables. Every entry required four clicks, three tab switches, and a manual currency conversion. Month-end close took four people four days, and the resulting numbers needed to be re-keyed into the actual accounting software.

## Process

We started with a week of contextual inquiry — sitting next to the founders while they closed the books. From there, I drafted a single-screen, keyboard-driven ledger that kept the mental model of double-entry bookkeeping but hid the ceremony. Every screen was tested against the spreadsheet, not against best practice.

The biggest design decision was what to remove. The team had been told they needed a chart of accounts editor, a journal entry form, a reconciliation screen, and a reporting tab. We built only the first two, and made the journal entry form powerful enough to subsume the rest.

## Solution

A single dense screen with three panels: accounts on the left, journal entries in the middle, and a running balance on the right. Everything is reachable from the keyboard. A command bar handles the 5% of operations that don't deserve a button.

The chart of accounts lives behind a single keypress, and it's structured to be edited in place — no separate tree view, no drag-and-drop. The journal entry form uses natural language for the account name, not a dropdown, because the team was already typing the account name in their heads.

## Results

- Shipped in March 2026 to a closed beta of 12 companies.
- Month-end close dropped from four days to six hours.
- NPS is +62.
- The team is now expanding to invoicing and reconciliation on top of the same primitive.
