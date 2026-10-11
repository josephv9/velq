#!/usr/bin/env python3
"""Apply the reviewable stylesheet to the active PHP bundle, idempotently."""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = '\n/* BEGIN VELQ BRIGHT PREMIUM */\n'
END = '\n/* END VELQ BRIGHT PREMIUM */\n'

def decode_bundle(source):
    match = re.search(r"\$assets=json_decode\(base64_decode\('([^']+)'\),true\);", source)
    if not match:
        raise ValueError('Active asset bundle was not found')
    return match, json.loads(base64.b64decode(match[1]))

def apply():
    path = ROOT / 'velq-site.php'
    source = path.read_text()
    match, assets = decode_bundle(source)
    style = base64.b64decode(assets['/style.css']['data']).decode()
    style = style.split(MARKER)[0].rstrip() + MARKER + (ROOT / 'design/bright-premium.css').read_text() + END
    assets['/style.css']['data'] = base64.b64encode(style.encode()).decode()
    encoded = base64.b64encode(json.dumps(assets, separators=(',', ':'), ensure_ascii=False).encode()).decode()
    path.write_text(source[:match.start(1)] + encoded + source[match.end(1):])
    print('Applied premium stylesheet; all other bundle assets and PHP routing retained.')

if __name__ == '__main__':
    apply()
