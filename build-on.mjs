#!/usr/bin/env node
// Regenerate on-cams.js from the Ontario 511 cameras API.
//
// Public API, no key required.
// Source: https://511on.ca/api/v2/get/cameras
// The API does NOT send CORS headers, so the browser cannot fetch it directly.
// We bake the list at build time, the same approach as nyc-cams.js / nc-cams.js.
//
// Output: on-cams.js  ->  window.ON_CAMS = [[name, lat, lon, viewId], ...]
// Images are served by the app from https://511on.ca/map/Cctv/{viewId}
// (the same image-proxy mechanism as DriveNC / FL511).

import { writeFileSync } from 'node:fs';

const url = 'https://511on.ca/api/v2/get/cameras?format=json&lang=en';
const res = await fetch(url, { headers: { Accept: 'application/json' } });
if (!res.ok) {
  console.error('Ontario 511 API returned HTTP', res.status);
  process.exit(1);
}

let data;
try {
  data = await res.json();
} catch (e) {
  console.error('Ontario 511 response was not JSON:', String(e));
  process.exit(1);
}

// Health gate: Ontario publishes 300+ cameras. A short list means the feed moved.
if (!Array.isArray(data) || data.length < 300) {
  console.error('Unhealthy feed. Expected 300+ cameras, got', Array.isArray(data) ? data.length : typeof data);
  process.exit(1);
}

const clean = s => (s || '').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = [];
for (const c of data) {
  if (!c.Latitude || !c.Longitude) continue;
  const view = (c.Views || []).find(v => v.Status === 'Enabled');
  if (!view) continue;
  const id = view.Id;
  let base = (c.Roadway && c.Roadway !== 'Other') ? c.Roadway : clean(c.Location);
  if (!base) base = clean(c.Location) || ('Camera ' + id);
  const dir = (c.Direction && !['None', 'Unknown', 'All Directions', 'Both Directions'].includes(c.Direction))
    ? ' ' + c.Direction : '';
  let name = (base + dir).trim();
  if (base !== clean(c.Location) && c.Location) name += ' · ' + clean(c.Location);
  rows.push(`  ['${esc(name)}', ${c.Latitude}, ${c.Longitude}, ${id}]`);
}

if (rows.length < 300) {
  console.error('After filtering, only', rows.length, 'usable cameras. Refusing to write a partial list.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const header =
`// Ontario (Toronto + ON) traffic cameras - pre-built from the Ontario 511 API
// (https://511on.ca/api/v2/get/cameras). Generated ${date}. ${rows.length} cameras.
// Image proxy: https://511on.ca/map/Cctv/{id}. API has no CORS, baked like nc-cams.js.
// window.ON_CAMS = [[name, lat, lon, id], ...]
`;
const text = header + 'window.ON_CAMS = [\n' + rows.join(',\n') + '\n];\n';

writeFileSync(new URL('./on-cams.js', import.meta.url), text);
console.log('Wrote on-cams.js with', rows.length, 'cameras');
