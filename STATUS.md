# StreetCam — Status (corrected)

**Updated 2026-06-13.** Corrects the stale "not yet in a repo" line in the Drive note `streetcam-workstream-2026-06-13.md`.

## Durable storage — RESOLVED
- **GitHub:** https://github.com/dmjost/streetcam (public). v0.1 pushed. HEAD `dac24d7` — "Add StreetCam v0.1: app, NY camera list, README, .gitignore". Prior commit `e5ca79d` "Create README.md". Local Desktop clone tracks `origin/main`.
- **Drive mirror:** this folder (`JostwareCanonical/streetcam/`) holds a second durable copy of v0.1 — index.html, nyc-cams.js, README.md, .gitignore. GitHub and Drive fail independently.
- The project that vanished once is now in two independent durable homes. Risk closed.

## What v0.1 is
Single self-contained static app (index.html + nyc-cams.js). No server.
- ~5,250 live cameras: NY 960 (baked into nyc-cams.js), NC 1,027 (live ArcGIS query), CA 3,266 (live Caltrans, all 12 districts).
- Search by name, filter by state, "Near me" distance sort, live viewer with auto-refresh, Snap button.
- Snap writes a stamped JPG + JSON verification manifest (time, place, source URL, GPS, SHA-256 when the source allows in-browser byte access).
- NC and CA camera data is NOT snapshotted anywhere — both are live feed queries at runtime. Only the NY list exists as stored data (nyc-cams.js).

## Hosting — CONFIGURED 2026-06-13
- Domain registered: **streetcam.world** (Namecheap).
- Host: **GitHub Pages**, serving `dmjost/streetcam` main branch / root. Custom domain set to streetcam.world (CNAME file committed to repo by GitHub — Dave should `git pull` to sync local).
- Namecheap Advanced DNS records added: four A records `@` → 185.199.108.153 / .109.153 / .110.153 / .111.153, and CNAME `www` → dmjost.github.io. Default parking records removed. (SPF TXT @ record left in place.)
- Pending: DNS propagation (minutes to a few hours), then GitHub "Enforce HTTPS" toggle becomes available once the cert provisions.

## 2026-06-13 later — FL added, NC feed broken
- **Florida added (working).** addFL() pulls the FDOT/FL511 ArcGIS layer (services.arcgis.com/3wFbqsFPLeKqOlIK, FL511_Traffic_Cameras) for ID + coords + name (~4,627 rows, ~3,916 with coords; CORS-enabled, paginated 2000). IMPORTANT: the feed's divas IMAGE field is dead (503 / deprecated). Images come from **fl511.com/map/Cctv/{ID}** — fl511's own image proxy, which the feed's ID maps to directly (verified 200 + cross-origin <img> display from streetcam.world). FL511 also offers HLS video (divas.cloud:8200/chan-*/index.m3u8) but stills via the proxy fit the app, so no video build needed. FL is the largest feed, bigger than CA's 3,266.
- **Boot hang fixed.** App was awaiting ALL feeds before rendering; the hung NC request froze it. Now renders incrementally (NY instant, others as they land) + AbortController fetch timeouts on every feed.
- **NC BROKEN (provider-side) — RESOLVED 2026-06-14, see section below.** NCDOT hosted ArcGIS layer (services.arcgis.com/NuWFvHYDMVmmxMeM) is bloated to ~40M duplicate rows. returnDistinctValues (the dedup the app relied on) now returns empty → NC shows 0. groupBy dedup is too slow to run in-browser. Official eapps.ncdot.gov/services/traffic-prod/v1/cameras API is not CORS-accessible (and timed out server-side). addNC left fail-safe (returns 0, never pages 40M). Real fix = pre-built nc-cams.js. Asheville/Buncombe coverage is OUT until this is fixed.
- Rail: confirmed no public camera IMAGE feed for MTA, Amtrak, Caltrain, Metrolink, BART. They publish train-tracking (GTFS-rt), not snapshot cameras. Not added.

## 2026-06-14 — NC RESTORED (1,104 cameras)
- **NC is back.** NCDOT migrated its public data API on 2026-05-27. The old eapps.ncdot.gov/services/traffic-prod/v1/cameras endpoint now returns only a migration notice. The retry watcher detected the new endpoint and rebuilt NC as a pre-built list, the same approach NY uses.
- **New source:** https://www.drivenc.gov/api/v2/get/cameras (requires a developer key, throttled 10 calls / 60s). The key is used once at build time only. It is NOT in the repo or the shipped app.
- **nc-cams.js generated:** 1,104 NC cameras (of 1,140 returned, those with an enabled view and valid coordinates). Format mirrors nyc-cams.js: window.NC_CAMS = [[name, lat, lon, id], ...]. Names built from roadway + direction + county.
- **addNC() re-enabled** in index.html: builds from window.NC_CAMS and serves images from the verified proxy https://www.drivenc.gov/map/Cctv/{id}. The disabled return 0 stub is removed. Script include nc-cams.js added next to nyc-cams.js. Inline script and nc-cams.js both pass a node compile check. Asheville/Buncombe coverage is back.
- **Auto-refresh set up (2026-06-14).** build-nc.mjs regenerates nc-cams.js from the keyed DriveNC endpoint, and .github/workflows/refresh-nc.yml runs it on the 1st of each month (plus on-demand via the Actions tab), committing any change so GitHub Pages redeploys. One-time setup: add a repo secret NC_DRIVENC_KEY with the DriveNC developer key. The key lives only in GitHub secrets, never in the repo. The script has an 800-camera health gate so it never ships a partial list.

## Open items
- **NY list refresh:** NY list is baked into nyc-cams.js — a hosted build should add a periodic refresh step (cams change). GitHub Pages has no built-in cron; a GitHub Action on a schedule could regenerate the list.
- **Snap-to-Photos on iPhone:** mobile browsers save to Files, not Photos, unless long-press / share sheet. CORS-locked frames (NY, NC) open in a new tab for long-press save; CA may allow direct canvas save. Needs a dedicated mobile pass.
- **Verification phase 2:** C2PA-style signed manifests + a public verify page that re-checks a manifest against the live source. Phase 1 (content hash + provenance manifest) proves bytes unaltered since capture and ties to official source; it does not prove the upstream feed wasn't spoofed. Phase 2 closes that.
- **gh CLI:** not installed on Dave's machine (`brew install gh` if wanted later — not required).
