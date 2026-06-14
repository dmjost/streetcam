#!/usr/bin/env node
// Regenerate nc-cams.js from NCDOT's DriveNC cameras API.
//
// Usage (local):   NC_DRIVENC_KEY=your_key node build-nc.mjs
// Usage (CI):      runs from .github/workflows/refresh-nc.yml with the
//                  NC_DRIVENC_KEY repo secret.
//
// The key is read from the environment and is NEVER written to disk or committed.
// Output: nc-cams.js  ->  window.NC_CAMS = [[name, lat, lon, id], ...]
// Images are served by the app from https://www.drivenc.gov/map/Cctv/{id}.

import { writeFileSync } from 'node:fs';

const key = process.env.NC_DRIVENC_KEY;
if (!key) {
  console.error('NC_DRIVENC_KEY is not set. Get a key at https://www.drivenc.gov/developers/doc');
  process.exit(1);
}

const url = `https://www.drivenc.gov/api/v2/get/cameras?key=${key}&format=json`;
const res = await fetch(url, { headers: { Accept: 'application/json' } });
if (!res.ok) {
  console.error('DriveNC API returned HTTP', res.status);
  process.exit(1);
}

let data;
try {
  data = await res.json();
} catch (e) {
  console.error('DriveNC response was not JSON:', String(e));
  process.exit(1);
}

// Health gate: NC has ~1,000+ cameras. A short list means the feed is unhealthy
// or has moved again. Never ship a partial list.
if (!Array.isArray(data) || data.length < 800) {
  console.error('Unhealthy feed. Expected 800+ cameras, got', Array.isArray(data) ? data.length : typeof data);
  process.exit(1);
}

const clean = s => (s || '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = [];
for (const c of data) {
  if (!c.Latitude || !c.Longitude) continue;
  const view = (c.Views || []).find(v => v.Status === 'Enabled');
  if (!view) continue;
  const id = view.Id;
  const dir = (c.Direction && !['None', 'All Directions', 'Both Directions'].includes(c.Direction))
    ? ' ' + c.Direction : '';
  let base = (c.Roadway && c.Roadway !== 'Other') ? c.Roadway : clean(c.Location);
  if (!base) base = clean(c.Location) || ('Camera ' + id);
  let name = (base + dir).trim();
  if (c.County) name += ' · ' + c.County;
  rows.push(`  ['${esc(name)}', ${c.Latitude}, ${c.Longitude}, ${id}]`);
}

if (rows.length < 800) {
  console.error('After filtering, only', rows.length, 'usable cameras. Refusing to write a partial list.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const header =
`// NC traffic cameras - pre-built from NCDOT DriveNC API (https://www.drivenc.gov/api/v2/get/cameras)
// Generated ${date}. ${rows.length} cameras. Image proxy: https://www.drivenc.gov/map/Cctv/{id}
// Same pattern as nyc-cams.js: window.NC_CAMS = [[name, lat, lon, id], ...]
`;
const text = header + 'window.NC_CAMS = [\n' + rows.join(',\n') + '\n];\n';

writeFileSync(new URL('./nc-cams.js', import.meta.url), text);
console.log('Wrote nc-cams.js with', rows.length, 'cameras');
