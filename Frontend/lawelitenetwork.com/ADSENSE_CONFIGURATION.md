# Law Elite Network - AdSense Configuration Checklist

## ✅ Environment Configuration

### Files Updated

#### `.env.local` (Added)
```bash
# Google AdSense Publisher ID
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-8968452296456450

# CMS Configuration
CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/public
NEXT_PUBLIC_CMS_WEBSITE_SLUG=law-elite-network

# Optional: For canonical URLs in metadata
# NEXT_PUBLIC_APP_URL=https://lawelitenetwork.com
```

#### `.env.example` (Created)
Complete template showing all available configuration options:
- CMS endpoints
- AdSense publisher ID format
- Google Search Console verification
- Bing Webmaster Tools verification
- Feature flags for ads/analytics
- Debug logging options

**Usage:** Copy to `.env.local` and fill in your values

---

## ✅ Ad Components & Integration

### Created Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ResponsiveDisplayAd` | `src/components/ads/` | Main ad display with lazy loading |
| `AdManager` | `src/components/ads/` | Ad control & metrics tracking |
| `AdPlacementStrategy` | `src/components/ads/` | Strategic placement logic |
| `AdPerformanceDashboard` | `src/components/ads/` | Real-time monitoring UI |
| `AMPAdSupport` | `src/components/ads/` | Mobile AMP ads |
| `ArticleAdWrapper` | `src/components/knowledge/` | Ad injection into articles |

### Integration Points

**ArticleView.tsx:**
- Added word count calculation
- Integrated `ArticleAdWrapper` for automatic ad insertion
- Ads show after 300+ words in articles

**Ad Analytics:**
- `src/lib/ad-analytics.ts` - Tracking service
- `src/app/api/ads/metrics/route.ts` - API endpoint

---

## ✅ Meta Data Configuration

### Article Pages

**Metadata Generation:** `src/app/[categorySlug]/[articleSlug]/layout.tsx`

Generated metadata includes:
- ✅ Title (with branding)
- ✅ Description
- ✅ Keywords (including article tags)
- ✅ Canonical URL
- ✅ Author information
- ✅ Robots directives (index: true, follow: true)
- ✅ OpenGraph tags (type, URL, title, description, publish date, modified date, authors, images)
- ✅ Twitter Card (summary_large_image)

**Structured Data:** `src/lib/seo/article-seo.tsx`

Generates JSON-LD schemas:
- ✅ Article / NewsArticle schema
- ✅ FAQ Page schema (auto-extracted from content)
- ✅ Breadcrumb List schema
- ✅ Author metadata
- ✅ Publisher information

**Google AdSense Meta Tag:**
```html
<meta name="google-adsense-account" content="ca-pub-8968452296456450" />
```
Location: `src/app/layout.tsx` (line ~225)

---

## ✅ SEO & Configuration Files

### robots.txt
**Location:** `public/robots.txt`

Configured for:
- ✅ Google AdSense crawlers (Googlebot, Google-AdBot, AdsBot-Google)
- ✅ Allow all public content
- ✅ Disallow private areas (admin, api, .env)
- ✅ Allow static assets
- ✅ Disallow bad bots (AhrefsBot, SemrushBot, MJ12bot)
- ✅ Crawl delay: 1 second
- ✅ Sitemap references

**AdSense-specific rules:**
```
User-agent: Google-AdBot
Allow: /
Allow: /ads.txt

User-agent: AdsBot-Google
Allow: /
Allow: /ads.txt
```

### ads.txt Endpoint
**Location:** `src/app/ads.txt/route.ts`

- ✅ Serves at `/ads.txt`
- ✅ CMS-managed publisher ID with fallback
- ✅ Daily revalidation
- ✅ Prevents ad fraud

### Next.js Configuration
**Location:** `next.config.ts`

**CSP Headers for AdSense:**
```
script-src: *.googlesyndication.com, *.doubleclick.net
connect-src: Google ad networks, *.adtrafficquality.google
frame-src: *.googlesyndication.com, *.doubleclick.net
img-src: https: (all HTTPS images)
```

---

## ✅ AdSense Script Configuration

**Location:** `src/app/layout.tsx` (lines 224-242)

Implementation:
```tsx
{ADSENSE_CLIENT && (
  <>
    <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  </>
)}
```

**Why native `<script>` instead of Next.js `<Script>`:**
- AdSense crawler regex-matches literal `<script>` tag in HTML
- Next.js `<Script>` component doesn't emit literal tag
- Using native tag enables proper site verification

---

## ✅ Consent & Compliance

### Google Consent Mode v2
**Location:** `src/app/layout.tsx` (lines 205-218)

Default state:
```javascript
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
});
```

### Cookie Consent Banner
**Location:** `src/components/CookieConsentBanner.tsx`

- ✅ Default-deny consent
- ✅ Updates consent state on accept
- ✅ Stores in localStorage as `law_elite_cookie_consent`
- ✅ Respects GDPR/CCPA requirements

---

## 🔧 Configuration Checklist

### Before Production Deployment

- [ ] **Verify Publisher ID**
  ```bash
  # Your current ID: ca-pub-8968452296456450
  # Action: Login to AdSense and confirm:
  # 1. Account is VERIFIED ✓
  # 2. Site is APPROVED ✓
  # 3. Publisher ID matches ✓
  ```

- [ ] **Create Ad Slots (Optional)**
  ```bash
  # Current setup: All placements use slot 4123514154
  # Option 1: Use current setup (all ads use same slot)
  # Option 2: Create unique slots per placement:
  #   - mid-article
  #   - sidebar-top
  #   - sidebar-bottom
  #   - footer
  #   - mobile-interstitial
  ```

- [ ] **Environment Variables**
  ```bash
  # Local Development (.env.local)
  NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-8968452296456450 ✓
  
  # Production (Vercel)
  # Set in Vercel Dashboard → Settings → Environment Variables
  ```

- [ ] **Test Ad Display**
  ```bash
  pnpm run dev
  # Navigate to: http://localhost:3000/[category]/[article]
  # Check:
  # - Ads display after ~300 words ✓
  # - Ads are responsive on mobile ✓
  # - No layout shift when ads load ✓
  # - Sidebar ads show on desktop ✓
  # - Footer ad displays ✓
  ```

- [ ] **Verify Metadata**
  ```bash
  # Open article page → Right-click → Inspect
  # Check <head> for:
  # - <meta name="google-adsense-account" ... > ✓
  # - <script async src="...adsbygoogle.js?client=ca-pub-..." > ✓
  # - OpenGraph tags (og:title, og:description, og:image) ✓
  # - Twitter tags (twitter:card, twitter:title) ✓
  ```

- [ ] **Check robots.txt**
  ```bash
  curl https://lawelitenetwork.com/robots.txt
  # Verify:
  # - Allows Googlebot ✓
  # - Allows Google-AdBot ✓
  # - Allows /ads.txt ✓
  ```

- [ ] **Check ads.txt**
  ```bash
  curl https://lawelitenetwork.com/ads.txt
  # Should output:
  # google.com, pub-8968452296456450, DIRECT, f08c47fec0942fa0
  ```

- [ ] **Consent Banner Test**
  ```bash
  # On local:
  # 1. Clear cookies (DevTools → Storage → Clear All)
  # 2. Reload page
  # 3. Should see consent banner ✓
  # 4. Accept consent
  # 5. Verify ads load ✓
  # 6. Check localStorage for law_elite_cookie_consent ✓
  ```

- [ ] **Analytics Tracking**
  ```bash
  # In browser console:
  # 1. sessionStorage.getItem('ad_metrics') - Should have data
  # 2. Check Network tab - /api/ads/metrics calls
  # 3. Verify gtag events fire for ad impressions
  ```

- [ ] **CSP Headers**
  ```bash
  # Check headers:
  curl -I https://lawelitenetwork.com
  # Verify Content-Security-Policy header allows:
  # - googlesyndication.com ✓
  # - doubleclick.net ✓
  # - Google ad networks ✓
  ```

- [ ] **Google Search Console**
  ```bash
  # Action: Add/verify site in GSC
  # 1. Verify site ownership (if not already)
  # 2. Check Sitemap submitted
  # 3. Check Robots.txt allowed
  # 4. Monitor Coverage → Indexed pages
  ```

- [ ] **AdSense Console**
  ```bash
  # Action: Verify in AdSense Console
  # 1. Go to Ads → Ad units → Verify 4123514154 exists
  # 2. Check site is showing in Sites list
  # 3. Verify no policy violations
  # 4. Enable Auto ads (optional) or use manual slots
  ```

---

## 📊 Post-Deployment Monitoring

### Day 1-7
- [ ] Monitor impressions in AdSense console
- [ ] Check for policy violations
- [ ] Verify no excessive invalid traffic (HIT) warnings
- [ ] Monitor Core Web Vitals
- [ ] Check error logs for ad-related issues

### Week 2-4
- [ ] Analyze CTR by placement
- [ ] Compare revenue metrics
- [ ] Monitor user experience metrics
- [ ] Check for suspicious click patterns
- [ ] Review analytics data

### Monthly
- [ ] Optimize ad placements based on performance
- [ ] A/B test different ad sizes
- [ ] Review content for policy compliance
- [ ] Update documentation
- [ ] Plan improvements

---

## 🚀 Ad Placements Summary

| Placement | Format | Display | Slot ID |
|-----------|--------|---------|---------|
| Mid-Article | Auto (responsive) | After 300+ words | 4123514154 |
| Sidebar Top | Vertical (300x600) | Desktop only | 4123514154 |
| Sidebar Bottom | Vertical (300x600) | Desktop only | 4123514154 |
| Footer | Horizontal (728x90+) | All pages | 4123514154 |
| Category Hero | Auto (responsive) | Category pages | 4123514154 |
| Mobile Interstitial | Responsive | Mobile only | 4123514154 |

All currently use same slot ID for simplicity. Can be split into unique slots per placement in AdSense console.

---

## 🔗 Important Links

- [Google AdSense Console](https://adsense.google.com)
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [AdSense Help Center](https://support.google.com/adsense)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)

---

## 📝 Configuration Files Created

1. `.env.local` - Local environment with AdSense settings
2. `.env.example` - Template for environment variables
3. `ADSENSE_SETUP.md` - Technical implementation guide
4. `ADSENSE_DEPLOYMENT.md` - Production deployment guide
5. `ADSENSE_QUICK_REFERENCE.md` - Developer quick reference
6. `ADSENSE_CONFIGURATION.md` - This file

---

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT

**Last Updated:** 2026-08-15

**Next Step:** Verify publisher ID and deploy to production
