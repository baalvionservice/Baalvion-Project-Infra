#!/usr/bin/env python3
"""Crawl the site (sitemap + every internal link) and report anything broken.

  python3 scripts/check-site.py                       # http://localhost:8000
  python3 scripts/check-site.py https://imperialpedia.com

Checks every page for: HTTP status, a canonical URL equal to the page's own URL, exactly one <h1>.
Exit code 1 when something fails. Needs only the Python standard library.
"""
import re, sys, urllib.request, urllib.error
from urllib.parse import urljoin, urldefrag, urlparse

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000').rstrip('/')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
opener = urllib.request.build_opener(NoRedirect)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (compatible; Imperialpedia-site-check)')]   # Cloudflare rejects the default Python agent

def get(url):
    try:
        r = opener.open(url, timeout=25); return r.status, r.read().decode('utf8', 'ignore')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf8', 'ignore')
    except Exception:
        return 0, ''

status, sitemap = get(BASE + '/sitemap.xml')
queue = [re.sub(r'^https?://[^/]+', BASE, u) for u in re.findall(r'<loc>([^<]+)</loc>', sitemap)] or [BASE + '/']
seen, problems = {}, []
skip = re.compile(r'\.(jpe?g|png|webp|svg|css|js|pdf|ico|xml|txt|gif|woff2?)$|^/(imp-admin|assets|uploads|web-story|google-login|submit-job-application|cdn-cgi)')
while queue:
    url = urldefrag(queue.pop())[0]
    path = urlparse(url).path
    if url in seen or not url.startswith(BASE) or skip.search(path) or '${' in url or "'" in url: continue
    code, body = get(url)
    seen[url] = code
    if code != 200:
        problems.append((code, url, 'status')); continue
    can = re.search(r'<link rel="canonical" href="([^"]*)"', body)
    h1 = len(re.findall(r'<h1[ >]', body))
    if not can or can.group(1).rstrip('/') != url.rstrip('/'): problems.append((200, url, 'canonical is %s' % (can.group(1) if can else 'missing')))
    if h1 != 1: problems.append((200, url, '%d <h1> tags' % h1))
    queue += [urljoin(url, m) for m in re.findall(r'href="([^"#]+)"', body)]

print('%d pages checked on %s, %d problems' % (len(seen), BASE, len(problems)))
for code, url, why in problems: print('  %s  %s  (%s)' % (code, url, why))
sys.exit(1 if problems else 0)
