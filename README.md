# StreetCam

Search public DOT street cameras, view them live in the browser, snap a frame, and keep a record that is hard to fake.

A single self-contained web app. No server, no build step, no dependencies. Open `index.html` and it runs.

## What it does

- Search ~14,000 live public cameras across twelve regions by name, filter by region, or sort by "Near me."
- View any camera live with auto-refresh.
- **Snap** a frame. Each snap writes a stamped JPG plus a JSON verification manifest.

## Why it exists

The point is verification in a world of untruth. A snap carries provenance a third party can check:

- capture timestamp (UTC)
- camera identity and coordinates
- the official government source URL
- the viewer's GPS at capture
- a SHA-256 content hash of the image bytes (where the source allows in-browser byte access)

A citizen can capture a timestamped, location-stamped, source-attributed still from an official government camera and hold a record that resists tampering.

## Camera coverage

| Region | Count | Source | Load |
|--------|-------|--------|------|
| NY | ~960 | NYC DOT TMC open camera feed | baked (`nyc-cams.js`) |
| NC | ~1,104 | NCDOT DriveNC API | baked (`nc-cams.js`) |
| CA | ~3,266 | Caltrans, all 12 districts | live |
| FL | ~4,627 | FDOT / FL511 (ArcGIS) | live |
| London | ~785 | Transport for London JamCams | live |
| Hong Kong | ~1,013 | HK Transport Dept traffic snapshots (data.gov.hk) | live |
| Singapore | ~90 | data.gov.sg / LTA traffic images | live |
| Sydney/NSW | ~197 | Transport for NSW Live Traffic | baked (`nsw-cams.js`) |
| Toronto/ON | ~928 | Ontario 511 API | baked (`on-cams.js`) |
| Austin/TX | ~811 | City of Austin (data.austintexas.gov) | live |
| Minneapolis/MN | ~246 | MnDOT GIS + CARS images | baked (`mn-cams.js`) |
| New Zealand | ~255 | NZTA Waka Kotahi | baked (`nz-cams.js`) |

**Live** feeds are fetched in the browser at runtime (their APIs and images allow cross-origin access). **Baked** feeds come from sources with no CORS, so a build script snapshots the camera list into a `*-cams.js` file that ships with the app; a scheduled GitHub Action refreshes them. The model extends to any 511 system or public camera API. California, Hong Kong, and Minneapolis snaps include the SHA-256 hash; the others fall back to open-tab save where the image host blocks in-browser byte access. (Minneapolis names are camera-ID based — the open MnDOT GIS layer carries coordinates but no road names.)

## Files

- `index.html` — the entire app (UI, search, viewer, snap, manifest logic)
- `nyc-cams.js`, `nc-cams.js`, `nsw-cams.js`, `on-cams.js` — baked camera lists
- `build-nc.mjs`, `build-nsw.mjs`, `build-on.mjs` — regenerate the baked lists from source APIs
- `.github/workflows/` — scheduled Actions that refresh the baked lists

## Status

v0.1. Verified end-to-end: all feeds load and one live image from each region renders.

## Roadmap

- GPS follow mode (continuous nearest-camera surfacing as you move)
- Verification phase 2: signed manifests / C2PA, plus a public verify page that re-checks a manifest against the live source
- Mobile snap-to-Photos pass (mobile browsers save to Files, not Photos, without a share-sheet step)
- Hosted build: refresh the embedded NY list periodically, since cameras change

## License

TBD.
