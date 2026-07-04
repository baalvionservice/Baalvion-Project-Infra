'use strict';
/**
 * First-party analytics tracker, served verbatim from GET /api/v1/collect.js.
 *
 * A site opts in with a single tag — no per-site code, no bundler change:
 *   <script async src="https://<cms>/api/v1/collect.js" data-site="imperialpedia"></script>
 *
 * It derives the collect endpoint from its own src, generates a durable visitor
 * id (localStorage) + a 30-min sliding session id (sessionStorage), and emits
 * session_start / page_view / scroll / session_end via navigator.sendBeacon
 * (fetch keepalive fallback). SPA route changes re-fire page_view. Cookieless and
 * consent-friendly: no cookies, no PII, respects Do-Not-Track.
 */
const TRACKER_VERSION = '1.0.0';

const TRACKER_JS = `(function(){
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    var s = document.currentScript || (function(){ var a = document.getElementsByTagName('script'); return a[a.length-1]; })();
    if (!s) return;
    var site = s.getAttribute('data-site');
    if (!site) return;
    var endpoint = s.src.replace(/collect\\.js.*$/, 'collect');

    function rid(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2,10); }
    function ls(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
    function lss(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
    function ss(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } }
    function sss(k,v){ try { sessionStorage.setItem(k,v); } catch(e){} }

    var vid = ls('_ba_vid'); if (!vid) { vid = rid('v'); lss('_ba_vid', vid); }

    var now = Date.now(), sess = null, isNew = false;
    try { sess = JSON.parse(ss('_ba_sess')); } catch(e){}
    if (!sess || (now - sess.t) > 1800000) { sess = { id: rid('s'), t: now }; isNew = true; }
    sess.t = now; sss('_ba_sess', JSON.stringify(sess));

    var lang = (navigator.language || '').slice(0,16);

    function send(events){
      try {
        var body = JSON.stringify({ site: site, events: events });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
        } else {
          fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: body, keepalive: true, mode: 'cors' }).catch(function(){});
        }
      } catch(e){}
    }
    function base(extra){
      var b = { sessionId: sess.id, visitorId: vid, page: location.pathname, url: location.href, referrer: document.referrer || '', lang: lang, occurredAt: new Date().toISOString() };
      for (var k in extra) b[k] = extra[k];
      return b;
    }

    var pageStart = Date.now();
    var q = [];
    if (isNew) q.push(base({ event: 'session_start' }));
    q.push(base({ event: 'page_view' }));
    send(q);

    // Core Web Vitals (LCP / CLS / INP) via PerformanceObserver — flushed on hide.
    var vitals = { lcp: 0, cls: 0, inp: 0 };
    try {
      if ('PerformanceObserver' in window) {
        new PerformanceObserver(function(l){ var es = l.getEntries(); var last = es[es.length-1]; if (last) vitals.lcp = Math.round(last.startTime); })
          .observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ if (!e.hadRecentInput) vitals.cls += e.value; }); })
          .observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ var d = e.duration || 0; if (d > vitals.inp) vitals.inp = Math.round(d); }); })
          .observe({ type: 'event', buffered: true, durationThreshold: 40 });
      }
    } catch(e){}

    // Scroll-depth milestones.
    var marks = { 25:false, 50:false, 75:false, 100:false };
    var t = null;
    function onScroll(){
      if (t) return;
      t = setTimeout(function(){
        t = null;
        var d = document.documentElement, b = document.body;
        var h = Math.max(d.scrollHeight, b ? b.scrollHeight : 0);
        if (h <= 0) return;
        var pct = Math.round(((d.scrollTop || window.pageYOffset) + window.innerHeight) / h * 100);
        [25,50,75,100].forEach(function(m){ if (pct >= m && !marks[m]) { marks[m] = true; send([base({ event: 'scroll', value: m, metadata: { depth: m } })]); } });
      }, 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // Session end on tab hide/unload, with active-time on page.
    var ended = false;
    function onHide(){
      if (ended || document.visibilityState !== 'hidden') return;
      ended = true;
      var dur = Math.round((Date.now() - pageStart) / 1000);
      send([
        base({ event: 'session_end', value: dur, metadata: { durationS: dur } }),
        base({ event: 'web_vitals', module: 'seo', metadata: { lcp: vitals.lcp, cls: Math.round(vitals.cls * 1000) / 1000, inp: vitals.inp } }),
      ]);
    }
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', function(){ document.visibilityState; ended = false; onHide(); });

    // SPA navigation: re-fire page_view + reset scroll marks on path change.
    var lastPath = location.pathname;
    function spa(){
      if (location.pathname === lastPath) return;
      lastPath = location.pathname;
      pageStart = Date.now();
      ended = false;
      marks = { 25:false, 50:false, 75:false, 100:false };
      sess.t = Date.now(); sss('_ba_sess', JSON.stringify(sess));
      send([base({ event: 'page_view' })]);
    }
    var _ps = history.pushState;
    history.pushState = function(){ var r = _ps.apply(this, arguments); spa(); return r; };
    window.addEventListener('popstate', spa);

    // Expose a tiny API for custom events (e.g. ecommerce): window.baalvion.track(event, props)
    window.baalvion = window.baalvion || {};
    window.baalvion.track = function(event, props){ send([base(Object.assign({ event: String(event) }, props || {}))]); };
  } catch(e){ /* never break the host page */ }
})();`;

module.exports = { TRACKER_JS, TRACKER_VERSION };
