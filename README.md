# Unionised worksites map

React + TypeScript + Leaflet. Loads three CSVs in memory, joins them on
Work Location Address, and shows each worksite's data object in a popup.

## Setup

1. Put your CSVs in `csv/` at the project root (same names as before).
2. `npm install`
3. `npm run dev`

## Data flow

`src/data/loadWorksites.ts` parses the CSVs (imported as raw strings, so they
are bundled and held in memory) and builds a `Worksite[]` keyed by normalised
address. Types are in `src/types.ts`; the map is `src/App.tsx`.
Addresses with no geocode match are listed in the browser console.
