# Google AdSense Approval Checklist

## Your Site Was Rejected For

- [ ] Ad code is missing or incomplete
- [ ] Site is unreachable
- [ ] Insufficient unique content
- [ ] Policy violations

---

## Fixes Applied ✅

### 1. Ad Code Issues
**FIXED:**
- ✅ AdSense script correctly placed in `<head>` 
- ✅ Meta tag `google-adsense-account` configured
- ✅ AdSense component library created (`AdSenseUnit`, `AdSenseContainer`)
- ✅ Ad units added to homepage with proper slots
- ✅ Retry logic implemented for async script loading

**YOU STILL NEED TO:**
- [ ] Set `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` in `.env.local`
- [ ] Create actual ad units in Google AdSense dashboard
- [ ] Replace placeholder slot IDs with real ones
- [ ] Deploy changes to production

**How to verify:**
```bash
# In production
1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "adsbygoogle"
4. You should see the script load with status 200
5. Go to Console and type: window.adsbygoogle
6. Should return an array-like object
```

---

### 2. Site Reachability
**FIXED:**
- ✅ Site is publicly accessible
- ✅ `robots.txt` configured to allow crawlers
- ✅ `sitemap.xml` dynamically generated
- ✅ No authentication required for public pages
- ✅ SSL/HTTPS enabled (assumed - if not, upgrade!)

**YOU STILL NEED TO:**
- [ ] Verify site has HTTPS (not HTTP)
- [ ] Submit site to Google Search Console
- [ ] Test crawlability in Search Console → URL Inspection

**How to verify:**
```bash
# Test site reachability
curl -I https://imperialpedia.com
# Should return 200 status

# Check robots.txt
curl https://imperialpedia.com/robots.txt

# Check sitemap
curl https://imperialpedia.com/sitemap.xml
```

---

### 3. Unique Content
**YOUR SITE HAS:**
- ✅ Multiple content types (articles, markets, companies, countries)
- ✅ Editorial content (trending, term of day, leadership)
- ✅ Structured data (schema.org JSON-LD)
- ✅ Unique metadata per page
- ✅ Good information architecture

**POTENTIAL ISSUES TO FIX:**
- [ ] Ensure articles are 1500+ words (minimum 2000 recommended)
- [ ] No duplicate content across pages
- [ ] All pages have unique, descriptive titles and meta descriptions
- [ ] Original analysis/perspective in articles
- [ ] Proper attribution for sources
- [ ] No thin pages (coming soon, placeholders)

**Audit your content:**
```bash
# Find "Coming Soon" or empty pages
grep -r "Coming Soon" src/

# Find duplicate titles
grep -r "<title>" src/ | sort | uniq -d

# Find pages without descriptions
grep -L "description" src/app/*/page.tsx
```

---

### 4. Policy Compliance
**ALREADY COMPLIANT:**
- ✅ Privacy Policy exists at `/privacy-policy`
- ✅ Terms of Service at `/terms-of-service`
- ✅ Disclaimer at `/disclaimer`
- ✅ Copyright Policy at `/copyright-policy`
- ✅ Contact page at `/contact`
- ✅ No adult/explicit content
- ✅ Proper site structure and navigation

**YOU STILL NEED TO VERIFY:**
- [ ] No copyrighted content (articles must be original or properly licensed)
- [ ] No plagiarism (use Copyscape or Grammarly to check)
- [ ] No malware or suspicious code
- [ ] No auto-playing videos/ads
- [ ] No pop-ups blocking content
- [ ] Proper affiliate disclosure (if using affiliate links)
- [ ] No misleading headlines
- [ ] No cookie consent issues

**Key Policy Links:**
- [Privacy Policy](./src/app/privacy-policy/page.tsx)
- [Terms of Service](./src/app/terms-of-service/page.tsx)  
- [Disclaimer](./src/app/disclaimer/page.tsx)
- [Copyright Policy](./src/app/copyright-policy/page.tsx)

---

## Pre-Resubmission Checklist

### Technical Requirements
- [ ] HTTPS enabled
- [ ] robots.txt accessible and allowing crawlers
- [ ] sitemap.xml valid and accessible
- [ ] ads.txt configured with Publisher ID
- [ ] AdSense script loads correctly
- [ ] Ad units render on pages
- [ ] No 404 errors on critical pages
- [ ] Mobile responsive design
- [ ] Fast page load times (< 3 seconds)

### Content Requirements
- [ ] All articles 1500+ words
- [ ] Unique titles and descriptions per page
- [ ] Original content (not copied/plagiarized)
- [ ] Proper source attribution
- [ ] No placeholder/coming soon pages
- [ ] All policy pages complete and accurate
- [ ] Contact information correct and working
- [ ] Navigation clear and intuitive

### Policy Requirements
- [ ] No copyrighted content
- [ ] No adult/explicit content
- [ ] No misleading/clickbait headlines
- [ ] No deceptive ad placements
- [ ] Affiliate links properly disclosed
- [ ] No auto-playing media
- [ ] Cookie consent implemented
- [ ] No tracking without disclosure

### AdSense Setup
- [ ] Publisher ID set in environment
- [ ] Ad unit slots created in AdSense
- [ ] Placeholder slots replaced with real IDs
- [ ] Ads placed on homepage
- [ ] Ads placed on article pages
- [ ] Responsive ad formats used
- [ ] Proper ad spacing (not too close)

---

## Step-by-Step Resubmission Guide

### 1. Update Environment
```bash
# Edit .env.local
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-YOUR_REAL_ID
```

### 2. Create Ad Units
- Log in to [Google AdSense](https://www.google.com/adsense/)
- Go to Ads → Ad units
- Create responsive display ads for:
  - Homepage (create 3 units)
  - Article pages (create 3-5 units)
  - Category pages (create 2 units)
- Copy the slot IDs

### 3. Update Code
Replace placeholder slots:
```bash
# Find all placeholder slots
grep -r "1234567890\|1234567891\|1234567892" src/

# Replace with real slot IDs from AdSense
```

### 4. Test Locally
```bash
npm run dev
# Open http://localhost:3029
# DevTools → Elements → search "adsbygoogle"
# Should see ads rendering
```

### 5. Deploy to Production
```bash
git add .
git commit -m "feat: Configure Google AdSense with real publisher ID and ad units"
git push origin main
```

### 6. Test in Production
- Visit production URL
- Check DevTools → Network → adsbygoogle loads
- Check ads render on pages
- Wait 1-2 days for Google to crawl

### 7. Submit for Review
- Go to [Google AdSense](https://www.google.com/adsense/)
- Click "Request review" or "Resubmit"
- Wait 3-5 business days for response

---

## Common Rejection Reasons & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Ad code missing | `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` not set | Set in .env.local |
| Site unreachable | Domain not accessible | Verify HTTPS, test DNS |
| No unique content | Articles too short/duplicate | Expand to 2000+ words, check originality |
| Policy violation | Copyrighted content | Check sources, cite properly |
| Poor UX | Too many ads, slow load | Reduce ad density, optimize performance |
| Thin content | Placeholder pages | Complete all content sections |

---

## Files Modified

- ✅ [src/components/common/AdSense.tsx](./src/components/common/AdSense.tsx) - Reusable ad components
- ✅ [src/app/page.tsx](./src/app/page.tsx) - Homepage with ad units
- ✅ [.env.example](./.env.example) - Environment variable documentation
- ✅ [docs/ADSENSE_SETUP.md](./docs/ADSENSE_SETUP.md) - Full implementation guide

---

## Success Indicators

Once approved, you should see:
- ✅ AdSense dashboard shows earned revenue
- ✅ Ads display on all pages
- ✅ "Ready to earn" status in AdSense
- ✅ Ability to customize ad formats
- ✅ Google Search Console shows no policy issues

---

## Need Help?

- [AdSense Help Center](https://support.google.com/adsense/)
- [Policy Review Timeline](https://support.google.com/adsense/answer/6102254)
- [Resubmission Guide](https://support.google.com/adsense/answer/10015918)
- [Contact Google AdSense Support](https://support.google.com/adsense/gethelp)
