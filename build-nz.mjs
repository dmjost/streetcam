#!/usr/bin/env node
// Regenerate nz-cams.js from the NZTA (Waka Kotahi) traffic cameras feed.
//
// Public feed, no key required.
// Source: https://trafficnz.info/service/traffic/rest/4/cameras/all  (XML)
// The feed and image host have no CORS, so the list is baked at build time
// (same approach as nyc-cams.js / nc-cams.js).
//
// Output: nz-cams.js  ->  window.NZ_CAMS = [[name, lat, lon, imageUrl], ...]
// Images: https://trafficnz.info/camera/{id}.jpg (no CORS -> snaps fall back to open-tab save).

import { writeFileSync } from 'node:fs';

const res = await fetch('https://trafficnz.info/service/traffic/rest/4/cameras/all');
if (!res.ok) {
  console.error('NZTA feed returned HTTP', res.status);
  process.exit(1);
}
const xml = await res.text();

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const get = (blk, tag) => {
  const m = blk.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1].trim() : '';
};

const blocks = xml.split('<camera>').slice(1);
if (blocks.length < 100) {
  console.error('Unhealthy feed. Expected 100+ cameras, got', blocks.length);
  process.exit(1);
}

const rows = [];
for (const b of blocks) {
  if (get(b, 'offline').toLowerCase() === 'true') continue;
  const lat = parseFloat(get(b, 'latitude')), lon = parseFloat(get(b, 'longitude'));
  let img = get(b, 'imageUrl');
  if (!img || !lat || !lon) continue;
  if (img.startsWith('/')) img = 'https://trafficnz.info' + img;
  // description is a clean leaf sentence; <region> is a nested element, so pull its <name> child
  let name = get(b, 'description') || get(b, 'name') || 'Camera';
  const rm = b.match(/<region>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/region>/);
  const region = rm ? rm[1].trim() : '';
  if (region && !name.toLowerCase().includes(region.toLowerCase())) name += ' · ' + region;
  rows.push(`  ['${esc(name)}', ${lat}, ${lon}, '${esc(img)}']`);
}

if (rows.length < 100) {
  console.error('After filtering, only', rows.length, 'usable cameras. Refusing to write a partial list.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const header =
`// New Zealand (Auckland + NZ) traffic cameras - pre-built from the NZTA Waka Kotahi feed
// (https://trafficnz.info/service/traffic/rest/4/cameras/all). Generated ${date}. ${rows.length} cameras.
// Feed and images have no CORS, so baked like nyc-cams.js. window.NZ_CAMS = [[name, lat, lon, imageUrl], ...]
`;
writeFileSync(new URL('./nz-cams.js', import.meta.url), header + 'window.NZ_CAMS = [\n' + rows.join(',\n') + '\n];\n');
console.log('Wrote nz-cams.js with', rows.length, 'cameras');
