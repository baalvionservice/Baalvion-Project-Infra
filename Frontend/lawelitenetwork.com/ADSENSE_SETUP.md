# Google AdSense Integration Guide

## Overview

This is a **production-ready** Google AdSense implementation for Law Elite Network, featuring:

- ✅ Responsive ad placements (mid-article, sidebar, footer)
- ✅ GDPR/CCPA consent compliance
- ✅ Analytics tracking and monitoring
- ✅ AMP support for mobile
- ✅ SEO optimization with proper CSP headers
- ✅ Performance monitoring dashboard
- ✅ TypeScript types and error handling

## Architecture

### Components

#### 1. `ResponsiveDisplayAd.tsx`
Main ad display component with lazy loading and intersection observer.

**Features:**
- Lazy loads ads when they enter viewport
- Prevents layout shift with reserved space
- Skeleton loading animation
- Analytics tracking

**Usage:**
```tsx
<ResponsiveDisplayAd
  slotId="4123514154"
  placement="mid-article"
  format="auto"
  fullWidthResponsive={true}
/>
```

#### 2. `AdPlacementStrategy.tsx`
Strategic placement manager for different article types and page layouts.

**Placements:**
- `mid-article` - After sufficient content (300+ words)
- `sidebar-top` - Desktop sidebar top
- `sidebar-bottom` - Desktop sidebar bottom
- `footer` - Page footer
- `category-hero` - Category page header
- `mobile-interstitial` - Mobile popup ad

**Usage:**
```tsx
<AdPlacementStrategy
  content={articleText}
  minWordsForMidArticleAd={300}
  enableSidebarAds={true}
  enableFooterAds={true}
>
  <ArticleContent />
</AdPlacementStrategy>
```

#### 3. `AdManager.tsx`
Centralized ad management with hooks for tracking.

**Hooks:**
- `useAdManager()` - Track impressions/clicks and get metrics
- `useAdConsent()` - Check GDPR consent status

**Usage:**
```tsx
const { trackImpression, trackClick, getMetrics } = useAdManager();

useEffect(() => {
  trackImpression('mid-article');
}, []);

// Get metrics
const metrics = getMetrics();
```

#### 4. `AMPAdSupport.tsx`
Accelerated Mobile Pages (AMP) ad support.

**Features:**
- Generates AMP-compliant ad HTML
- Mobile optimization
- Responsive sizing

**Usage:**
```tsx
const ampCode = generateAMPAdCode({
  slotId: '4123514154',
  width: 100,
  height: 320,
  layout: 'responsive',
});
```

### Integration with Articles

Ads are automatically injected into articles via `ArticleView.tsx`:

```tsx
<ArticleAdWrapper wordCount={wordCount} enableAds={true}>
  <div dangerouslySetInnerHTML={{ __html: content }} />
</ArticleAdWrapper>
```

The wrapper:
- Calculates word count
- Shows mid-article ads only if content is 300+ words
- Respects consent preferences
- Tracks all impressions

## Configuration

### Publisher ID

**Current:** `ca-pub-8968452296456450`

**To update:**
1. Update in `src/lib/cms.ts` (CMS-managed)
2. Or use `NEXT_PUBLIC_ADSENSE_CLIENT` environment variable
3. Or update in AdSense script tag in `src/app/layout.tsx`

### Ad Slots

All placements currently use slot ID `4123514154`. To create unique slots:

1. Login to Google AdSense
2. Go to Ads → Ad units
3. Create new ad unit (or use Auto ads)
4. Copy slot ID
5. Update `AD_PLACEMENTS` in `src/components/ads/AdManager.tsx`

### Environment Variables

```bash
# Optional - defaults to hardcoded ca-pub-8968452296456450
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-YOUR_ID

# CMS integration
CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/public
NEXT_PUBLIC_CMS_WEBSITE_SLUG=law-elite-network
```

## Compliance & Security

### GDPR Compliance

✅ **Implemented:**
- Google Consent Mode v2
- Default-deny cookies
- Banner requests user consent before ads personalize
- Stored in `localStorage` as `law_elite_cookie_consent`

**Location:** `src/components/CookieConsentBanner.tsx`

### CSP Headers

✅ **Configured for AdSense:**
- ✅ `script-src`: `*.googlesyndication.com`, `*.doubleclick.net`
- ✅ `connect-src`: Ad request domains
- ✅ `frame-src`: Ad creative iframes
- ✅ `img-src`: HTTPS ad images

**Location:** `next.config.ts` (headers array)

### ads.txt

✅ **Served at:** `/ads.txt`
- Prevents ad fraud
- Verifies publisher legitimacy
- Auto-revalidates daily
- CMS-managed if available

**Location:** `src/app/ads.txt/route.ts`

### robots.txt

✅ **Optimized for:**
- Google AdSense crawlers
- SEO indexing
- Ad fraud prevention

**Location:** `public/robots.txt`

## Analytics & Monitoring

### Real-time Dashboard

Components:
- `AdPerformanceDashboard.tsx` - Metrics display
- `AdDashboardToggle.tsx` - Toggle button

**Usage:**
```tsx
import { AdPerformanceDashboard } from '@/components/ads';

<AdPerformanceDashboard />
```

### Metrics Collected

- **Impressions** - Number of ad displays
- **Clicks** - User interactions
- **CTR** - Click-through rate (%)
- **By placement** - Performance per ad location
- **Session tracking** - Unique session IDs

### API Endpoints

#### POST `/api/ads/metrics`
Submit ad performance metrics from client.

```bash
curl -X POST https://lawelitenetwork.com/api/ads/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_...",
    "metrics": [
      {
        "placement": "mid-article",
        "slotId": "4123514154",
        "impressions": 3,
        "clicks": 1
      }
    ],
    "url": "/criminal-law/article",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2026-08-15T12:00:00Z"
  }'
```

#### GET `/api/ads/metrics?days=7`
Retrieve aggregated metrics (admin only).

```bash
curl https://lawelitenetwork.com/api/ads/metrics?days=7
```

## Performance Optimization

### Lazy Loading
- Ads load only when they enter viewport
- 50px threshold for pre-loading
- Intersection Observer API

### Layout Shift Prevention
- Reserved space with `minHeight` prop
- Skeleton loading animation
- No unexpected content reflow

### Image Optimization
- HTTPS required
- WebP support where available
- Responsive sizing

### Code Splitting
- Ad components are client-side only
- Server renders without ads for faster FCP
- Hydration-safe

## Testing & Verification

### Local Testing

1. **Setup AdSense ads:**
   ```bash
   # Use preview mode in AdSense console
   # No live traffic needed
   ```

2. **Test consent flow:**
   - Clear cookies
   - Reload page
   - Accept consent banner
   - Verify ads load

3. **Test metrics:**
   ```tsx
   // In browser console
   const metrics = sessionStorage.getItem('ad_metrics');
   console.log(JSON.parse(metrics));
   ```

### Verification Checklist

- [ ] Publisher ID verified in AdSense console
- [ ] Site claim approved
- [ ] ads.txt accessible at `/ads.txt`
- [ ] robots.txt allows Googlebot
- [ ] CSP headers allow ad scripts
- [ ] Consent banner working
- [ ] Ads display when consent given
- [ ] No layout shift when ads load
- [ ] Analytics tracking working
- [ ] Mobile ads responsive

### Common Issues

**Ads not showing:**
1. Check AdSense account status (Settings → Account)
2. Verify publisher ID is correct
3. Check CSP headers allow scripts
4. Ensure consent is given (check cookies)
5. Test in AdSense preview mode

**Clicks not counted:**
1. Verify analytics script loaded
2. Check `gtag` function available
3. Test tracking with `useAdManager()` hook

**Layout shift:**
1. Increase `minHeight` prop
2. Add container width constraints
3. Use fixed aspect ratio

## Production Deployment

### Pre-launch Checklist

```
[ ] Replace placeholder publisher ID with verified account
[ ] Create 3-5 unique ad slots for different placements
[ ] Enable auto-ads OR create manual placements
[ ] Submit site for AdSense review if new account
[ ] Configure CSP headers for domain
[ ] Test ads on staging environment
[ ] Verify all ads display correctly
[ ] Check mobile responsiveness
[ ] Monitor first week for policy violations
[ ] Set up analytics/monitoring dashboard
[ ] Create backup ad provider (optional)
```

### Monitoring After Launch

**First Week:**
- Monitor 5-10% of traffic for issues
- Check AdSense console for errors
- Verify impressions are being logged
- Monitor revenue/CPM trends

**Ongoing:**
- Weekly review of metrics
- A/B test ad placements
- Optimize based on CTR data
- Monitor for policy violations

## Troubleshooting

### Enable Debug Logging

```tsx
// In browser console
localStorage.setItem('DEBUG_ADS', 'true');
location.reload();
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "AdSense script not initialized" | Script didn't load | Check CSP, network errors |
| "Invalid publisher ID" | Wrong format | Use ca-pub-XXXXX format |
| "Site not monetizing" | Account not approved | Submit for review in AdSense |
| "High percentage of invalid traffic" | Ad fraud detected | Review targeting, check bot traffic |

## Further Reading

- [Google AdSense Help](https://support.google.com/adsense)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [Google Consent Mode v2](https://support.google.com/googleanalytics/answer/10161064)
- [AMP Ad Best Practices](https://amp.dev/about/ads/)

## Support

For issues or questions:
1. Check this guide first
2. Review Google AdSense Help Center
3. Check browser console for errors
4. Test with AdSense preview mode
5. Contact Law Elite support team
