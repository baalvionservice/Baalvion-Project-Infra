# Google AdSense Implementation Guide

## Current Status

Your Imperialpedia site has been set up with Google AdSense infrastructure, but approval was rejected due to several issues. This guide explains what's been configured and what you need to do to get approved.

## What's Already Configured ✅

### 1. **AdSense Script in Layout** 
- Location: [src/app/layout.tsx](./src/app/layout.tsx#L174-L182)
- The main AdSense script loads dynamically from your CMS or environment variable
- Meta tag `google-adsense-account` is set automatically

### 2. **AdSense Component Library**
- Location: [src/components/common/AdSense.tsx](./src/components/common/AdSense.tsx)
- Two components available:
  - `<AdSenseUnit />` - Individual ad placement
  - `<AdSenseContainer />` - Wrapped ad with styling

### 3. **Site Structure**
- ✅ `robots.txt` - [src/app/robots.ts](./src/app/robots.ts)
- ✅ `sitemap.xml` - [src/app/sitemap.xml/route.ts](./src/app/sitemap.xml/route.ts)
- ✅ `ads.txt` - [src/app/ads.txt/route.ts](./src/app/ads.txt/route.ts)
- ✅ Privacy/Terms/Disclaimer pages
- ✅ Contact page

## What You Need to Do 🚀

### Step 1: Set Your AdSense Publisher ID

**In `.env.local`:**
```bash
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxxxxxxxx
```

Get your Publisher ID from [Google AdSense](https://www.google.com/adsense/):
1. Sign in to AdSense
2. Go to Account → Account information
3. Copy your Publisher ID (format: `ca-pub-xxxxxxxxxxxxxxxx`)

### Step 2: Create Ad Units in AdSense

In Google AdSense, create the following ad units:

1. **Homepage Top Ad** (Slot: `1234567890`)
   - Type: Responsive display ad
   - Size: Auto

2. **Homepage Mid Ad** (Slot: `1234567891`)
   - Type: Horizontal responsive ad

3. **Homepage Bottom Ad** (Slot: `1234567892`)
   - Type: Responsive display ad

4. **Article Page Ads** (Create multiple slots for article templates)
   - Type: In-article ads
   - Slots: `2234567890`, `2234567891`, `2234567892`

### Step 3: Update Ad Unit Slots

Replace the placeholder slots (`1234567890`, etc.) with your actual AdSense ad unit IDs:

**Homepage:**
```tsx
<AdSenseUnit slot="YOUR_ACTUAL_SLOT_ID" format="auto" />
```

**Article Pages:**
```tsx
// In article component
<AdSenseUnit slot="YOUR_ACTUAL_ARTICLE_SLOT" format="auto" />
```

### Step 4: Add Ads to More Pages

Add ad units to high-traffic pages:

```tsx
import { AdSenseUnit } from '@/components/common/AdSense';

export default function YourPage() {
  return (
    <div>
      {/* Your content */}
      <h1>Page Title</h1>
      
      {/* Add ads between content sections */}
      <section>
        <Content1 />
      </section>
      
      <div className="my-8">
        <AdSenseUnit slot="YOUR_SLOT_ID" format="auto" />
      </div>
      
      <section>
        <Content2 />
      </section>
      
      <div className="my-8">
        <AdSenseUnit slot="YOUR_SLOT_ID_2" format="auto" />
      </div>
    </div>
  );
}
```

## Common Issues & Solutions

### Issue: "Ad code is missing or incomplete"
**Solution:**
1. ✅ Verify `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` is set in `.env.local`
2. ✅ Reload the page in your browser
3. ✅ Check DevTools → Network → search for "adsbygoogle" (should load with 200 status)
4. ✅ Check DevTools → Console → type `window.adsbygoogle` (should show array)

### Issue: "Your site is unreachable"
**Solution:**
1. ✅ Ensure your domain is publicly accessible
2. ✅ Check `robots.txt` allows Google crawlers (already configured)
3. ✅ Verify sitemap is accessible at `/sitemap.xml`
4. ✅ Test in Google Search Console

### Issue: "Insufficient unique content"
**Solution:**
- Your site has good content structure, but ensure:
  1. ✅ Articles have original, high-quality content (3000+ words recommended)
  2. ✅ Pages aren't duplicates or thin content
  3. ✅ Metadata (title, description) is unique per page
  4. ✅ No copyrighted content without proper attribution

### Issue: "Policy violations"
**Solution:**
- Review Google AdSense policies:
  1. ✅ No adult/explicit content
  2. ✅ No copyrighted content
  3. ✅ No malware or spam
  4. ✅ Proper privacy policy linked
  5. ✅ Contact information provided
  6. ✅ No misleading content

**Check your site for compliance:**
- [Privacy Policy](./src/app/privacy-policy/) - ✅ Exists
- [Terms of Service](./src/app/terms-of-service/) - ✅ Exists
- [Disclaimer](./src/app/disclaimer/) - ✅ Exists
- [Contact Page](./src/app/contact/) - ✅ Exists
- [Copyright Policy](./src/app/copyright-policy/) - ✅ Exists

## How to Test Ads Locally

### 1. **Check if script loads:**
```javascript
// In browser console:
window.adsbygoogle  // Should return array-like object
```

### 2. **Check if ad units render:**
```javascript
// Should see <ins class="adsbygoogle" data-ad-slot="...">
document.querySelectorAll('.adsbygoogle')
```

### 3. **Live testing with actual AdSense account:**
```bash
# Set your real Publisher ID
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-YOUR_REAL_ID npm run dev

# Visit http://localhost:3029
# Check DevTools → Elements → look for adsbygoogle script
# Check DevTools → Network → look for ads loading from googlesyndication.com
```

## Deployment Checklist

Before deploying to production:

- [ ] `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` set in production environment
- [ ] Ad unit slots updated with real IDs (not test slots)
- [ ] Ads render on homepage (check in DevTools)
- [ ] Ads render on article pages
- [ ] AdSense script loads (check Network tab)
- [ ] No console errors in DevTools
- [ ] Site is HTTPS (required by AdSense)
- [ ] All policy pages are accessible and complete
- [ ] Contact information is correct
- [ ] robots.txt allows Google crawlers
- [ ] sitemap.xml is valid and accessible

## Ad Unit Placement Best Practices

### Homepage
- 1 ad above the fold (300x250 or auto)
- 1 ad between content sections
- 1 ad near footer

### Article Pages
- 1 in-article ad (within first 1000 words)
- 1 sidebar ad (300x250)
- 1 bottom ad (300x250 or responsive)

### Do NOT:
- ❌ Place ads too close together (minimum 1-2 sections between)
- ❌ Make ads larger than content
- ❌ Use auto-refresh ads without explicit user consent
- ❌ Place ads in iframe hidden elements
- ❌ Use "Click here to see ads" deceptive placements

## Links & Resources

- [Google AdSense Policy Center](https://support.google.com/adsense)
- [AdSense Approval Requirements](https://support.google.com/adsense/answer/10015918)
- [ads.txt Guide](https://support.google.com/adsense/answer/7532444)
- [Robots.txt Guide](https://support.google.com/webmasters/answer/6062598)
- [Sitemap Guide](https://support.google.com/webmasters/answer/183668)

## Next Steps

1. ✅ Set `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` in `.env.local`
2. ✅ Create ad units in Google AdSense
3. ✅ Update ad unit slots with real IDs
4. ✅ Test locally with DevTools
5. ✅ Deploy to production
6. ✅ Submit site for AdSense review through Google Search Console
7. ✅ Wait for approval (usually 3-5 business days)

## Support

If ads aren't showing:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` is correct
3. Check that AdSense script loads (Network tab)
4. Ensure site meets AdSense policy requirements
5. Check AdSense account hasn't been disabled

For policy violations, review Google's [Unsuitable Content](https://support.google.com/adsense/answer/10015918) guidelines and update your site accordingly.
