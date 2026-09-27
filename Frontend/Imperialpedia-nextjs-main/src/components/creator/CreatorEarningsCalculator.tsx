'use client';

import React, { useState, useMemo } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalculatorHeader } from '@/components/financial-tools/CalculatorHeader';
import { Youtube, DollarSign, TrendingUp, HelpCircle, ShieldCheck, Sparkles, PieChart, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface NichePreset {
  label: string;
  avgRpm: number; // Estimated USD per 1,000 total views
  description: string;
}

const NICHE_PRESETS: Record<string, NichePreset> = {
  finance: {
    label: 'Finance, Investing & Business',
    avgRpm: 12.50,
    description: 'High advertiser demand (banks, brokers, SaaS); typical RPM ranges $8.00–$25.00+',
  },
  tech: {
    label: 'Tech, Software & Gadgets',
    avgRpm: 7.50,
    description: 'Moderate to high advertiser demand; typical RPM ranges $5.00–$14.00',
  },
  education: {
    label: 'Education, How-To & Career',
    avgRpm: 5.50,
    description: 'Steady advertiser interest; typical RPM ranges $3.50–$9.00',
  },
  lifestyle: {
    label: 'Vlogs, Fitness & Lifestyle',
    avgRpm: 3.50,
    description: 'Broad consumer appeal; typical RPM ranges $2.00–$6.00',
  },
  gaming: {
    label: 'Gaming & Esports',
    avgRpm: 2.20,
    description: 'High view counts but lower ad rates; typical RPM ranges $1.00–$4.00',
  },
  entertainment: {
    label: 'General Entertainment & Humor',
    avgRpm: 1.80,
    description: 'Mass market audience; typical RPM ranges $0.80–$3.50',
  },
  shorts: {
    label: 'YouTube Shorts (Short-form Video)',
    avgRpm: 0.06,
    description: 'Pooled revenue model; typical RPM ranges $0.03–$0.12 per 1,000 Shorts views',
  },
};

const COUNTRY_MULTIPLIERS: Record<string, { label: string; factor: number }> = {
  us: { label: 'United States / Canada / UK / Australia (Tier 1)', factor: 1.0 },
  eu: { label: 'Western Europe (Germany, France, Nordics)', factor: 0.82 },
  latam: { label: 'Latin America / Eastern Europe', factor: 0.45 },
  asia: { label: 'Asia / Pacific (Excl. AU/JP)', factor: 0.35 },
  global: { label: 'Global Mix / Worldwide Audience', factor: 0.65 },
};

export function CreatorEarningsCalculator() {
  const [platform, setPlatform] = useState<'youtube' | 'website' | 'sponsorship'>('youtube');
  const [monthlyViews, setMonthlyViews] = useState<string>('100000');
  const [nicheKey, setNicheKey] = useState<string>('finance');
  const [countryKey, setCountryKey] = useState<string>('us');
  const [customRpm, setCustomRpm] = useState<string>('');
  
  // Website specific state
  const [websitePageviews, setWebsitePageviews] = useState<string>('100000');
  const [websiteSessionRpm, setWebsiteSessionRpm] = useState<string>('18.00');

  // Sponsorship specific state
  const [sponsorshipImpressions, setSponsorshipImpressions] = useState<string>('50000');
  const [sponsorshipCpm, setSponsorshipCpm] = useState<string>('25.00');

  // Calculations for YouTube
  const calculatedYt = useMemo(() => {
    const views = Math.max(0, parseInt(monthlyViews, 10) || 0);
    const preset = NICHE_PRESETS[nicheKey] || NICHE_PRESETS.finance;
    const country = COUNTRY_MULTIPLIERS[countryKey] || COUNTRY_MULTIPLIERS.us;
    
    let effectiveRpm = customRpm ? parseFloat(customRpm) : preset.avgRpm * country.factor;
    if (isNaN(effectiveRpm) || effectiveRpm < 0) effectiveRpm = 0;

    const monthlyEarnings = (views / 1000) * effectiveRpm;
    const dailyEarnings = monthlyEarnings / 30.416;
    const annualEarnings = monthlyEarnings * 12;

    // Gross ad spend before YouTube's ~45% cut
    const grossAdSpend = platform === 'youtube' && nicheKey !== 'shorts' ? monthlyEarnings / 0.55 : monthlyEarnings;
    const youtubeCut = grossAdSpend - monthlyEarnings;

    return {
      views,
      effectiveRpm,
      dailyEarnings,
      monthlyEarnings,
      annualEarnings,
      grossAdSpend,
      youtubeCut,
    };
  }, [monthlyViews, nicheKey, countryKey, customRpm, platform]);

  // Calculations for Website
  const calculatedWeb = useMemo(() => {
    const pvs = Math.max(0, parseInt(websitePageviews, 10) || 0);
    const rpm = Math.max(0, parseFloat(websiteSessionRpm) || 0);
    const monthly = (pvs / 1000) * rpm;
    return {
      pageviews: pvs,
      rpm,
      daily: monthly / 30.416,
      monthly,
      annual: monthly * 12,
    };
  }, [websitePageviews, websiteSessionRpm]);

  // Calculations for Sponsorship
  const calculatedSponsor = useMemo(() => {
    const imps = Math.max(0, parseInt(sponsorshipImpressions, 10) || 0);
    const cpm = Math.max(0, parseFloat(sponsorshipCpm) || 0);
    const perIntegration = (imps / 1000) * cpm;
    return {
      impressions: imps,
      cpm,
      perIntegration,
      monthlyEst: perIntegration * 2, // Assuming 2 sponsored integrations/mo
      annualEst: perIntegration * 24,
    };
  }, [sponsorshipImpressions, sponsorshipCpm]);

  const formatUsd = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US').format(num);

  return (
    <div className="space-y-8">
      {/* Platform Switcher Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setPlatform('youtube')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            platform === 'youtube'
              ? 'bg-white dark:bg-gray-900 text-foreground shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-foreground'
          }`}
        >
          <Youtube className="w-4 h-4 text-red-600" />
          YouTube AdSense
        </button>

        <button
          type="button"
          onClick={() => setPlatform('website')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            platform === 'website'
              ? 'bg-white dark:bg-gray-900 text-foreground shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Website Traffic
        </button>

        <button
          type="button"
          onClick={() => setPlatform('sponsorship')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            platform === 'sponsorship'
              ? 'bg-white dark:bg-gray-900 text-foreground shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Brand Deals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs */}
        <Card className="lg:col-span-7 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Text variant="caption" className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
              {platform === 'youtube' && 'YouTube Views & RPM Parameters'}
              {platform === 'website' && 'Website Traffic & Ad Rate Parameters'}
              {platform === 'sponsorship' && 'Sponsorship & Brand Deal Inputs'}
            </Text>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Estimates
            </span>
          </div>

          <CardContent className="p-6 space-y-6">
            {platform === 'youtube' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="yt-views" className="text-sm font-semibold flex justify-between">
                    <span>Monthly YouTube Views</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      (~{formatNumber(Math.round(calculatedYt.views / 30.416))} views/day)
                    </span>
                  </Label>
                  <Input
                    id="yt-views"
                    type="number"
                    min="0"
                    step="1000"
                    value={monthlyViews}
                    onChange={(e) => setMonthlyViews(e.target.value)}
                    className="h-11 rounded-lg text-base"
                    placeholder="e.g. 100000"
                  />
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {[10000, 50000, 100000, 500000, 1000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMonthlyViews(String(preset))}
                        className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition"
                      >
                        {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Channel Niche / Content Category</Label>
                  <Select value={nicheKey} onValueChange={setNicheKey}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Select channel niche" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NICHE_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.label} (~${preset.avgRpm.toFixed(2)} base RPM)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground pt-1">
                    {NICHE_PRESETS[nicheKey]?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Primary Audience Geography</Label>
                  <Select value={countryKey} onValueChange={setCountryKey}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Select primary audience location" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COUNTRY_MULTIPLIERS).map(([key, item]) => (
                        <SelectItem key={key} value={key}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <Label htmlFor="custom-rpm" className="text-xs font-medium text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>Override RPM ($ per 1,000 views)</span>
                    <span>{customRpm ? 'Active Override' : 'Auto-calculated from Niche & Region'}</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">$</span>
                    <Input
                      id="custom-rpm"
                      type="number"
                      step="0.1"
                      min="0"
                      value={customRpm}
                      onChange={(e) => setCustomRpm(e.target.value)}
                      className="pl-7 h-10 rounded-lg text-sm"
                      placeholder={`Calculated: $${calculatedYt.effectiveRpm.toFixed(2)}`}
                    />
                  </div>
                </div>
              </>
            )}

            {platform === 'website' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="web-pvs" className="text-sm font-semibold">
                    Monthly Website Pageviews
                  </Label>
                  <Input
                    id="web-pvs"
                    type="number"
                    min="0"
                    step="5000"
                    value={websitePageviews}
                    onChange={(e) => setWebsitePageviews(e.target.value)}
                    className="h-11 rounded-lg text-base"
                    placeholder="e.g. 100000"
                  />
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {[25000, 50000, 100000, 250000, 1000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWebsitePageviews(String(preset))}
                        className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition"
                      >
                        {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="web-rpm" className="text-sm font-semibold flex justify-between">
                    <span>Website Page RPM ($ per 1,000 pageviews)</span>
                    <span className="text-xs text-muted-foreground font-normal">Typically $10 - $40</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400 font-medium text-sm">$</span>
                    <Input
                      id="web-rpm"
                      type="number"
                      step="0.5"
                      min="0"
                      value={websiteSessionRpm}
                      onChange={(e) => setWebsiteSessionRpm(e.target.value)}
                      className="pl-7 h-11 rounded-lg text-base"
                      placeholder="18.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Includes premium ad networks like Mediavine, Raptive, or Google AdSense.
                  </p>
                </div>
              </>
            )}

            {platform === 'sponsorship' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sponsor-imps" className="text-sm font-semibold">
                    Average Views / Impressions Per Sponsored Post
                  </Label>
                  <Input
                    id="sponsor-imps"
                    type="number"
                    min="0"
                    step="5000"
                    value={sponsorshipImpressions}
                    onChange={(e) => setSponsorshipImpressions(e.target.value)}
                    className="h-11 rounded-lg text-base"
                    placeholder="e.g. 50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsor-cpm" className="text-sm font-semibold flex justify-between">
                    <span>Sponsorship CPM Rate ($ per 1,000 impressions)</span>
                    <span className="text-xs text-muted-foreground font-normal">Typically $20 - $45</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400 font-medium text-sm">$</span>
                    <Input
                      id="sponsor-cpm"
                      type="number"
                      step="1"
                      min="0"
                      value={sponsorshipCpm}
                      onChange={(e) => setSponsorshipCpm(e.target.value)}
                      className="pl-7 h-11 rounded-lg text-base"
                      placeholder="25.00"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-2xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-emerald-100 dark:border-emerald-900/30">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Estimated Net Creator Revenue
              </span>
              
              <div className="mt-3">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {platform === 'youtube' && formatUsd(calculatedYt.monthlyEarnings)}
                  {platform === 'website' && formatUsd(calculatedWeb.monthly)}
                  {platform === 'sponsorship' && formatUsd(calculatedSponsor.perIntegration)}
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  {platform === 'sponsorship' ? 'per sponsored integration' : 'estimated monthly income'}
                </span>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="text-xs text-muted-foreground font-medium">Daily Estimate</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">
                    {platform === 'youtube' && formatUsd(calculatedYt.dailyEarnings)}
                    {platform === 'website' && formatUsd(calculatedWeb.daily)}
                    {platform === 'sponsorship' && formatUsd(calculatedSponsor.perIntegration / 30)}
                  </div>
                </div>

                <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="text-xs text-muted-foreground font-medium">Annualized Estimate</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">
                    {platform === 'youtube' && formatUsd(calculatedYt.annualEarnings)}
                    {platform === 'website' && formatUsd(calculatedWeb.annual)}
                    {platform === 'sponsorship' && formatUsd(calculatedSponsor.annualEst)}
                  </div>
                </div>
              </div>

              {platform === 'youtube' && (
                <div className="pt-2 text-xs space-y-2 border-t border-emerald-100 dark:border-emerald-900/40 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Effective Creator RPM:</span>
                    <span className="font-semibold text-foreground">${calculatedYt.effectiveRpm.toFixed(2)}</span>
                  </div>
                  {nicheKey !== 'shorts' && (
                    <div className="flex justify-between">
                      <span>YouTube 45% Share (Est):</span>
                      <span className="font-medium text-gray-500">${calculatedYt.youtubeCut.toFixed(2)}/mo</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Gross Advertiser Spend:</span>
                    <span className="font-medium text-gray-500">${calculatedYt.grossAdSpend.toFixed(2)}/mo</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Context & Helpful Guide Links */}
          <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-500" /> Key Income Factors
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real earnings depend on monetized view ratios (typically 50–70% of total views), viewer ad-blocker usage, seasonal ad rate surges (Q4 holiday demand), and video length (8+ minute videos allow mid-roll ads).
            </p>
            <div className="pt-2 flex flex-col gap-1.5 text-xs font-semibold">
              <Link href="/how-much-does-youtube-pay-per-1000-views" className="text-primary hover:underline flex items-center justify-between">
                <span>Read: How YouTube RPM vs CPM Works</span>
                <span>→</span>
              </Link>
              <Link href="/how-to-qualify-for-youtube-monetization" className="text-primary hover:underline flex items-center justify-between">
                <span>Check: YouTube Partner Program Eligibility</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
