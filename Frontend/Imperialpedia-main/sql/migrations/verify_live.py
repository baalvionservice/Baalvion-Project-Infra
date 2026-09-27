#!/usr/bin/env python3
"""Compare every sitemap page on local (:8000) against the live site.

Run before and after importing 002_sync_content.sql. Afterwards each page should
show local-only <= ~2 (dates/nav noise); anything higher is content still stale on live.
Usage: python3 verify_live.py [live_base_url]
"""
import re, sys, html, subprocess
from concurrent.futures import ThreadPoolExecutor

LOCAL = 'http://localhost:8000'
LIVE = sys.argv[1] if len(sys.argv) > 1 else 'https://legacy.imperialpedia.com'

def get(u):
    r = subprocess.run(['curl', '-s', '-m', '30', u], capture_output=True, text=True)
    return r.stdout

def sentences(body):
    body = re.sub(r'<(script|style|nav|header|footer)\b.*?</\1>', '', body, flags=re.S)
    body = re.sub(r'https?://[^/\s"\']+', '', body)
    text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', body)))
    return {s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 25}

def check(path):
    a, b = sentences(get(LOCAL + path)), sentences(get(LIVE + path))
    return path, len(a - b), len(b - a)

paths = [re.sub(r'^https?://[^/]+', '', u) or '/' for u in re.findall(r'<loc>([^<]+)', get(LOCAL + '/sitemap.xml'))]
with ThreadPoolExecutor(6) as ex:
    rows = sorted(ex.map(check, paths), key=lambda r: -r[1])
stale = [r for r in rows if r[1] > 2]
print(f'{len(stale)} of {len(rows)} pages have content on local that live lacks')
for p, lo, vo in stale:
    print(f'{p[:90]:90} local-only={lo:3} live-only={vo:3}')
