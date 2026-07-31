#!/usr/bin/env node
// Validates every <script type="__bundler/..."> block in the given HTML
// files (defaults to all tracked .html files). These blocks hold JSON that
// the page parses at load time — if one doesn't parse, the whole site
// renders blank with an "Error unpacking" toast.
//
// Run after any edit to index.html:  node scripts/check-bundles.js
const fs = require('fs');
const { execSync } = require('child_process');

let files = process.argv.slice(2);
if (files.length === 0) {
  files = execSync('git ls-files "*.html"', { encoding: 'utf8' }).split('\n').filter(Boolean);
}

let failed = false;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const openRe = /<script type="(__bundler\/[a-z_]+)">/g;
  let m;
  while ((m = openRe.exec(html)) !== null) {
    const kind = m[1];
    const bodyStart = m.index + m[0].length;
    const end = html.indexOf('</script>', bodyStart);
    const body = html.slice(bodyStart, end);
    let ok = true;
    let msg = '';
    try {
      JSON.parse(body);
    } catch (e) {
      ok = false;
      msg = e.message;
    }
    // A literal "</script" or "<!--" inside the JSON derails the browser's
    // HTML parser even when the JSON itself is valid. The template block
    // keeps every "<" encoded as \u003c for this reason.
    if (ok && /<!--/.test(body)) {
      ok = false;
      msg = 'contains literal <!-- (HTML parser hazard)';
    }
    if (ok && kind === '__bundler/template' && /</.test(body)) {
      ok = false;
      msg = 'template must keep every "<" encoded as \\u003c';
    }
    if (ok) {
      console.log(`OK    ${file} :: ${kind}`);
    } else {
      failed = true;
      console.error(`FAIL  ${file} :: ${kind} — ${msg}`);
    }
  }
}

if (failed) {
  console.error('\nBundler JSON is corrupt. The site will show "Error unpacking" and render blank.');
  console.error('Any text edited into a __bundler block must be JSON-escaped (\\n, \\", \\u003c for <).');
  process.exit(1);
}
