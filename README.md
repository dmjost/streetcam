# StreetCam

Search public DOT street cameras, view them live in the browser, snap a frame, and keep a record that is hard to fake.

A single self-contained web app. No server, no build step, no dependencies. Open `index.html` and it runs.

## What it does

- Search ~5,250 live public cameras across three states by name, filter by state, or sort by "Near me."
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

| State | Count | Source |
|-------|-------|--------|
| NY | ~960 | NYC DOT TMC open camera feed (embedded in `nyc-cams.js`) |
| NC | ~1,027 | NCDOT TIMS / DriveNC (live ArcGIS query) |
| CA | ~3,266 | Caltrans, all 12 districts (live query) |

NY is baked into `nyc-cams.js`. NC and CA load live at runtime. The model extends to any state 511 system.

## Files

- `index.html` — the entire app (UI, search, viewer, snap, manifest logic)
- `nyc-cams.js` — embedded NY camera list

## Status

v0.1. Verified end-to-end: all three feeds load and one live image from each state renders.

## Roadmap

- GPS follow mode (continuous nearest-camera surfacing as you move)
- Verification phase 2: signed manifests / C2PA, plus a public verify page that re-checks a manifest against the live source
- Mobile snap-to-Photos pass (mobile browsers save to Files, not Photos, without a share-sheet step)
- Hosted build: refresh the embedded NY list periodically, since cameras change

## License

TBD.
