# Quick Reference: Google AdSense Implementation

## File Structure
```
Frontend/Law-Elite-Network-main/
├── src/
│   ├── components/ads/
│   │   ├── ResponsiveDisplayAd.tsx        # Main ad component
│   │   ├── AdManager.tsx                  # Ad control & tracking
│   │   ├── AdPlacementStrategy.tsx        # Placement logic
│   │   ├── AMPAdSupport.tsx               # Mobile AMP ads
│   │   ├── AdPerformanceDashboard.tsx    # Monitoring UI
│   │   └── index.ts                      # Exports
│   ├── components/knowledge/
│   │   ├── ArticleView.tsx                # Article with ads
│   │   └── ArticleAdWrapper.tsx           # Ad injection
│   ├── lib/
│   │   └── ad-analytics.ts                # Analytics service
│   └── app/api/ads/
│       └── metrics/route.ts               # Metrics API
├── public/
│   └── robots.txt                         # SEO config
├── ADSENSE_SETUP.md                       # Technical guide
└── ADSENSE_DEPLOYMENT.md                  # Deployment guide
```

## Common Tasks

### Add Ad to New Page
```tsx
import { SimpleMidArticleAd } from '@/components/ads';

export function MyPage() {
  return (
    <div>
      <h1>My Content</h1>
      <SimpleMidArticleAd />
    </div>
  );
}
```

### Track Ad Interaction
```tsx
'use client';
import { useAdManager } from '@/components/ads';

export function MyComponent() {
  const { trackImpression, trackClick } = useAdManager();

  useEffect(() => {
    trackImpression('my-placement');
  }, [trackImpression]);

  return <div onClick={() => trackClick('my-placement')}>...</div>;
}
```

### Check Metrics
```tsx
const { getMetrics } = useAdManager();
const metrics = getMetrics();
console.log('Total impressions:', metrics.totalImpressions);
console.log('CTR:', metrics.averageCTR);
```

### Verify Consent
```tsx
const { isAdConsentGiven } = useAdConsent();

if (isAdConsentGiven) {
  return <ResponsiveDisplayAd slotId="..." />;
}
```

## Configuration

**Publisher ID:** `ca-pub-8968452296456450`  
**Default Slot:** `4123514154`

Update via:
1. Environment: `NEXT_PUBLIC_ADSENSE_CLIENT`
2. CMS: Website → SEO → Monetization
3. Code: `src/app/layout.tsx` (line 230)

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ads.txt` | GET | Ad verification |
| `/api/ads/metrics` | POST | Submit metrics |
| `/api/ads/metrics?days=7` | GET | Get metrics |
| `robots.txt` | GET | SEO crawling |

## Hooks

```typescript
// Ad management
const { trackImpression, trackClick, getMetrics } = useAdManager();

// Analytics
const { recordImpression, recordClick, getMetrics } = useAdAnalytics();

// Consent checking
const { isAdConsentGiven } = useAdConsent();
```

## Environment Variables

```bash
# Optional - replace with your publisher ID
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-YOUR_ID

# CMS integration (optional)
CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/public
NEXT_PUBLIC_CMS_WEBSITE_SLUG=law-elite-network
```

## Debugging

```javascript
// Browser console
// Check if ads loaded
console.log('adsbygoogle' in window);

// View metrics
console.log(sessionStorage.getItem('ad_metrics'));

// Enable debug mode
localStorage.setItem('DEBUG_ADS', 'true');
location.reload();
```

## Important Links

- [Google AdSense Console](https://adsense.google.com)
- [AdSense Help](https://support.google.com/adsense)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)
- [Publisher Setup Guide](ADSENSE_SETUP.md)
- [Deployment Guide](ADSENSE_DEPLOYMENT.md)

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Ads not showing | Script not loaded | Check CSP, network |
| No metrics | Consent denied | Check cookie banner |
| Layout shift | No minHeight | Add minHeight prop |
| Policy warning | Suspicious activity | Review content |

## Testing Checklist

- [ ] Ads display on articles (300+ words)
- [ ] Ads responsive on mobile
- [ ] No layout shift
- [ ] Consent banner works
- [ ] Analytics tracking works
- [ ] ads.txt accessible
- [ ] robots.txt allows crawlers
- [ ] CSP headers correct
- [ ] No console errors
- [ ] Preview mode working

---

**Last Updated:** 2026-08-15  
For detailed info, see ADSENSE_SETUP.md
