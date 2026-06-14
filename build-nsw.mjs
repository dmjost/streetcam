#!/usr/bin/env node
// Regenerate nsw-cams.js from the Transport for NSW Live Traffic cameras feed.
//
// Public feed, no key required.
// Source: https://data.livetraffic.com/cameras/traffic-cam.json
// The feed does NOT send CORS headers, so the browser cannot fetch it directly.
// We bake the list at build time, the same approach as nyc-cams.js / nc-cams.js.
//
// Output: nsw-cams.js  ->  window.NSW_CAMS = [[name, lat, lon, imageUrl], ...]
// Images come straight from https://webcams.transport.nsw.gov.au/... (also no CORS,
// so snaps fall back to open-tab-and-save, same as NY/NC).

import { writeFileSync } from 'node:fs';

const url = 'https://data.livetraffic.com/cameras/traffic-cam.json';
const res = await fetch(url, { headers: { Accept: 'application/json' } });
if (!res.ok) {
  console.error('NSW feed returned HTTP', res.status);
  process.exit(1);
}

let data;
try {
  data = await res.json();
} catch (e) {
  console.error('NSW response was not JSON:', String(e));
  process.exit(1);
}

const feats = (data && data.features) || [];
// Health gate: NSW publishes ~190+ cameras. A short list means the feed moved.
if (feats.length < 120) {
  console.error('Unhealthy feed. Expected 120+ cameras, got', feats.length);
  process.exit(1);
}

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = [];
for (const f of feats) {
  const g = f.geometry, p = f.properties || {};
  if (!g || !Array.isArray(g.coordinates) || g.coordinates.length < 2) continue;
  const [lon, lat] = g.coordinates;
  const img = p.href; // image URL (p.view is a text caption, p.title is the short name)
  if (!img || lat == null || lon == null) continue;
  let name = (p.title || 'Camera').trim();
  if (p.region) name += ' · ' + String(p.region).replace(/_/g, ' ');
  rows.push(`  ['${esc(name)}', ${lat}, ${lon}, '${esc(img)}']`);
}

if (rows.length < 120) {
  console.error('After filtering, only', rows.length, 'usable cameras. Refusing to write a partial list.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const header =
`// NSW (Sydney + NSW) traffic cameras - pre-built from the Transport for NSW Live Traffic feed
// (https://data.livetraffic.com/cameras/traffic-cam.json). Generated ${date}. ${rows.length} cameras.
// Feed has no CORS, so it is baked like nyc-cams.js. window.NSW_CAMS = [[name, lat, lon, imageUrl], ...]
`;
const text = header + 'window.NSW_CAMS = [\n' + rows.join(',\n') + '\n];\n';

writeFileSync(new URL('./nsw-cams.js', import.meta.url), text);
console.log('Wrote nsw-cams.js with', rows.length, 'cameras');
