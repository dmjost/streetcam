#!/usr/bin/env node
// Regenerate mn-cams.js — Minneapolis / Twin Cities (MnDOT) traffic cameras.
//
// No key required. Camera coordinates come from MnDOT's traffic-camera GIS layer
// (served via the Dakota County ArcGIS mirror). The live 511mn.org app locks its
// coordinates behind a persisted-query GraphQL, so this GIS layer is the open
// coordinate source. Images come from the CARS public host, which IS CORS-open,
// so Minneapolis snaps hash in-browser.
//
// Output: mn-cams.js  ->  window.MN_CAMS = [[name, lat, lon, id], ...]
// Images: https://public.carsprogram.org/cameras/MN/{id}
//
// Note: this GIS layer carries camera IDs and coordinates but no descriptive road
// names, so names are id-based. Coverage skews to the Twin Cities metro.

import { writeFileSync } from 'node:fs';

const base = 'https://gis2.co.dakota.mn.us/arcgis/rest/services/DCGIS_OL_Transportation/MapServer/12/query';
const url = `${base}?where=1%3D1&outFields=CAMERAID&returnGeometry=true&outSR=4326&f=json&resultRecordCount=4000`;
const res = await fetch(url);
if (!res.ok) {
  console.error('MnDOT GIS layer returned HTTP', res.status);
  process.exit(1);
}
const j = await res.json();
const feats = j.features || [];
if (feats.length < 150) {
  console.error('Unhealthy feed. Expected 150+ cameras, got', feats.length);
  process.exit(1);
}

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = [];
for (const f of feats) {
  const id = f.attributes && f.attributes.CAMERAID;
  const g = f.geometry;
  if (!id || !g) continue;
  const lat = g.y, lon = g.x;
  if (!(lat > 43 && lat < 49.5) || !(lon > -97.6 && lon < -89)) continue; // drop bad/zero coords
  rows.push(`  ['MnDOT ${esc(id)}', ${lat.toFixed(5)}, ${lon.toFixed(5)}, '${esc(id)}']`);
}

if (rows.length < 150) {
  console.error('After filtering, only', rows.length, 'usable cameras. Refusing to write a partial list.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const header =
`// Minneapolis / Twin Cities (MnDOT) traffic cameras - pre-built.
// Coords from the MnDOT traffic-camera GIS layer (Dakota County ArcGIS mirror).
// Generated ${date}. ${rows.length} cameras. Images: https://public.carsprogram.org/cameras/MN/{id} (CORS *).
// window.MN_CAMS = [[name, lat, lon, id], ...]
`;
writeFileSync(new URL('./mn-cams.js', import.meta.url), header + 'window.MN_CAMS = [\n' + rows.join(',\n') + '\n];\n');
console.log('Wrote mn-cams.js with', rows.length, 'cameras');
