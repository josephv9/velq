#!/usr/bin/env python3
"""Verify styling-only changes preserve active content, integrations and SEO."""
import base64
import importlib.util
import subprocess
import sys
sys.dont_write_bytecode = True
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('premium', ROOT / 'scripts/apply-bright-premium.py')
premium = importlib.util.module_from_spec(spec)
spec.loader.exec_module(premium)
baseline = subprocess.check_output(['git', 'show', 'd81869f0d57a4d745d6753401375d32cf9504ea3:velq-site.php'], cwd=ROOT).decode()
current = (ROOT / 'velq-site.php').read_text()
before_match, before = premium.decode_bundle(baseline)
after_match, after = premium.decode_bundle(current)
assert baseline[:before_match.start(1)] == current[:after_match.start(1)]
assert baseline[before_match.end(1):] == current[after_match.end(1):]
assert before.keys() == after.keys(), 'Asset route set changed'
for route in before:
    if route != '/style.css':
        assert before[route] == after[route], f'Protected asset changed: {route}'
original_css = base64.b64decode(before['/style.css']['data']).decode()
updated_css = base64.b64decode(after['/style.css']['data']).decode()
assert updated_css.split(premium.MARKER)[0] == original_css.rstrip()
assert updated_css.count(premium.MARKER) == 1
assert updated_css.endswith(premium.END)
expected = (ROOT / 'design/bright-premium.css').read_text()
assert updated_css.split(premium.MARKER)[1] == expected + premium.END
premium.apply()
assert (ROOT / 'velq-site.php').read_text() == current, 'Repackaging is not idempotent'
print(f'PASS: {len(before)-1} protected assets unchanged, including HTML, JS, SEO and images.')
print('PASS: PHP routing, Shopify CSP, waitlist proxy and analytics endpoint unchanged.')
print('PASS: Existing CSS retained; stylesheet matches source; reapplying is idempotent.')
