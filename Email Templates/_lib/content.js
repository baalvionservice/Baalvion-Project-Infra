'use strict';
/**
 * Per-brand copy. `steps` and `resources` are shared across welcome/day1/day3/day7/reengagement
 * for a brand (exactly like the original hand-built templates — the CTA changes per day, the
 * "quick access" grid doesn't). Ported from the original bespoke copy where it already existed
 * (amarisemaisonavenue, controlthemarket, lawelitenetwork, marketunderworld, baalvion,
 * imperialpedia) and corrected where it didn't match the real product (baalvionstack was generic
 * "API key / SDK" copy — replaced with the actual proxy/data-network product). Newly authored for
 * the 8 domains that had no template before (about, admin, trade, ir, mining, jobs, connect,
 * dashboard).
 */

const CONTENT = {
  baalvion: {
    steps: [
      { h: 'Complete your profile', p: 'Add your name and preferences to personalise your experience across all Baalvion services.' },
      { h: 'Explore the dashboard', p: 'Your central hub for all tools, data, and services we offer.' },
      { h: 'Connect your first integration', p: 'Link your tools and let Baalvion do the heavy lifting.' },
    ],
    resources: [
      { icon: '📄', h: 'Documentation', p: 'Step-by-step guides' },
      { icon: '🔧', h: 'Tools', p: 'Explore the suite' },
      { icon: '💬', h: 'Community', p: 'Join the conversation' },
      { icon: '🛟', h: 'Support', p: "We're here to help" },
    ],
    welcome: {
      eyebrow: 'Welcome', h1: "You're now part of Baalvion.",
      p: ["Thank you for joining us. You now have access to everything Baalvion has to offer — the all-in-one platform for builders and innovators.", "Your account is active and ready. Here's everything you need to get started."],
      ctaText: 'Get started', ctaHref: '/dashboard',
    },
    day1: { tipLabel: 'Pro tip', tip: 'Users who complete setup in the first 24 hours are 3× more likely to see results in their first week.', h1: "Let's get you set up in 10 minutes.", p: 'Welcome back. Today we get your foundation in place so you start seeing real value from Baalvion immediately.', ctaSecTitle: 'Complete your profile', ctaSecP: 'Add your name and preferences to personalise your experience across all Baalvion services.', ctaText: 'Complete Day 1 setup' },
    day3: { tipLabel: 'Did you know', tip: 'Most people only use 20% of what Baalvion offers. Today we\'re showing you the other 80%.', h1: "You're past the basics. Now the good stuff.", p: "You've had a few days with Baalvion. Now it's time to unlock the features that separate casual users from power users.", ctaSecTitle: 'Explore the dashboard', ctaSecP: 'Your central hub for all tools, data, and services we offer.', ctaText: 'Continue your journey' },
    day7: { tipLabel: 'Your next milestone', tip: 'Users who reach a meaningful outcome in week 1 are 5× more likely to stay long-term.', h1: "One week in. Here's where to go from here.", p: "You've completed your first week with Baalvion. Now it's time to turn exploration into results.", ctaSecTitle: 'Connect your first integration', ctaSecP: 'Link your tools and let Baalvion do the heavy lifting.', ctaText: 'Complete your first week' },
    newsletter: { h1: 'Platform Updates & Growth Tips', p: 'Everything worth knowing this week — curated and delivered every Monday.', fromEmail: 'newsletter@baalvion.com', articles: [
      { tag: 'Featured', h: 'The most important development this week — and what it means for you', p: "A detailed breakdown of this week's biggest story, with analysis, context, and practical takeaways you can use immediately.", read: 'Read full article →' },
      { tag: 'Deep dive', h: 'Behind the scenes: how the top performers are doing it differently', p: "We interviewed leading voices in the space this week. Here's what we learned and what you can apply right now.", read: 'Read the deep dive →' },
      { tag: 'Quick reads', h: '5 things you should know by the end of the week', p: 'Short, sharp, and actionable. Five things curated by our editorial team — no filler.', read: 'Read the list →' },
    ], hlH: "Not getting enough from Baalvion? Here's what you might be missing.", hlP: 'Most members who see the best results use at least 3 features consistently. Take 2 minutes to find the ones you haven\'t tried.', hlBtn: 'Explore all features' },
    reengagement: { h1: "We noticed you've been away.", p: "Here's what you missed — and a free resource to get you back on track.", stats: [{ num: '30+', lbl: 'New updates' }, { num: '5', lbl: 'New features' }, { num: '1', lbl: 'Reason to return' }], offerH: "Here's what's new since you last visited", offerP: "We've shipped significant updates to Baalvion over the past 30 days — new features, improved performance, and content worth coming back for.", offerBtn: "See what's new" },
  },

  about: {
    steps: [
      { h: 'Subscribe to press updates', p: 'Get notified the moment we publish news, milestones, or leadership perspectives.' },
      { h: 'Read the founding story', p: 'Understand where Baalvion started and where the platform is headed.' },
      { h: 'Follow the newsroom', p: 'Bookmark about.baalvion.com for interviews, guides, and company updates.' },
    ],
    resources: [
      { icon: '📰', h: 'Newsroom', p: 'Latest press coverage' },
      { icon: '📖', h: 'Our Story', p: 'How Baalvion started' },
      { icon: '🎙️', h: 'Interviews', p: 'Leadership perspectives' },
      { icon: '✉️', h: 'Press Kit', p: 'Media resources' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now following Baalvion.", p: ['Thanks for subscribing to the Baalvion newsroom. You\'ll get our best stories, product milestones, and leadership guidance — nothing else.', "We publish sparingly and never sell your inbox to anyone."], ctaText: 'Read the latest', ctaHref: '/' },
    day1: { tipLabel: 'While you wait', tip: 'Our most-read piece this year covers how Baalvion approaches trust and infrastructure at global scale.', h1: 'A quick look at what we cover.', p: 'Product milestones, founder perspectives, and the occasional deep dive — that\'s the newsroom in one line.', ctaSecTitle: 'Start with our story', ctaSecP: 'The short version of why Baalvion exists and what we\'re building toward.', ctaText: 'Read our story' },
    day3: { tipLabel: 'Worth a read', tip: 'Subscribers who read at least one founding story stick around 2× longer.', h1: 'A few pieces we think you\'ll enjoy.', p: 'A short list of stories readers consistently come back to.', ctaSecTitle: 'Browse the newsroom', ctaSecP: 'Every press mention, guide, and interview in one place.', ctaText: 'Browse the newsroom' },
    day7: { tipLabel: 'One week in', tip: 'You can always adjust how often we email you from your preferences page.', h1: 'Thanks for sticking with us this week.', p: 'That\'s the introduction — from here it\'s just the stories, as they happen.', ctaSecTitle: 'Follow the newsroom', ctaSecP: 'Bookmark about.baalvion.com for everything as it publishes.', ctaText: 'Visit the newsroom' },
    newsletter: { h1: 'This Week in Baalvion', p: 'Press coverage, milestones, and guidance — delivered every Monday.', fromEmail: 'newsletter@about.baalvion.com', articles: [
      { tag: 'Milestone', h: 'What shipped across the Baalvion ecosystem this week', p: 'A roundup of what launched, what changed, and why it matters for the people building on Baalvion.', read: 'Read the roundup →' },
      { tag: 'Perspective', h: 'A conversation with the team behind the platform', p: 'Short, candid answers on what\'s working, what isn\'t, and what\'s next.', read: 'Read the interview →' },
      { tag: 'Guide', h: 'A reader question, answered properly', p: 'This week we take one recurring question from readers and give it a real answer.', read: 'Read the guide →' },
    ], hlH: 'Want the unfiltered version?', hlP: 'Our press kit has the numbers, the timeline, and the assets — no spin.', hlBtn: 'Open the press kit' },
    reengagement: { h1: "Haven't seen you in the newsroom lately.", p: 'A quick catch-up on what you missed, and why it\'s worth five minutes.', stats: [{ num: '12', lbl: 'New stories' }, { num: '3', lbl: 'Milestones' }, { num: '1', lbl: 'Worth your time' }], offerH: 'The story we\'d point you to first', offerP: 'If you only read one thing since you\'ve been away, make it this.', offerBtn: 'Read it now' },
  },

  admin: {
    steps: [
      { h: 'Set up two-factor authentication', p: 'Admin access is sensitive — secure your account before you do anything else.' },
      { h: 'Review your role & permissions', p: 'Confirm what you can see and manage across the platform.' },
      { h: 'Check the operations dashboard', p: 'Website health, content, and payments — all in one console.' },
    ],
    resources: [
      { icon: '🛡️', h: 'Access Control', p: 'Roles & permissions' },
      { icon: '📊', h: 'Operations', p: 'Platform health' },
      { icon: '🧩', h: 'Integrations', p: 'Connected services' },
      { icon: '🛟', h: 'Support', p: 'Internal help desk' },
    ],
    welcome: { eyebrow: 'Access granted', h1: "You've been added to Baalvion Admin.", p: ['You now have access to the platform administration console — the back office for every site and service Baalvion runs.', 'Your account is provisioned and ready. Please secure it before making any changes.'], ctaText: 'Open the console', ctaHref: '/dashboard' },
    day1: { tipLabel: 'Security first', tip: 'Admin accounts without 2FA are the #1 cause of avoidable incidents — this takes two minutes.', h1: 'Let\'s secure your admin account.', p: 'Before anything else, lock down access — you\'re now able to touch production data.', ctaSecTitle: 'Enable two-factor authentication', ctaSecP: 'Required for all accounts with write access.', ctaText: 'Secure my account' },
    day3: { tipLabel: 'Good to know', tip: 'Every change you make in the console is logged and attributable — that\'s by design, not a warning.', h1: 'Finding your way around the console.', p: 'A quick orientation to where things live, so you\'re not hunting for the right screen mid-incident.', ctaSecTitle: 'Review your permissions', ctaSecP: 'See exactly what your role can and can\'t touch.', ctaText: 'Review permissions' },
    day7: { tipLabel: 'Milestone', tip: 'You\'re now fully onboarded — the fastest way to get help from here is the internal support channel.', h1: 'One week into Baalvion Admin.', p: 'You should be comfortable navigating the console by now. Here\'s what to lean on next.', ctaSecTitle: 'Check the operations dashboard', ctaSecP: 'Website health, content, and payments — all in one place.', ctaText: 'Open operations' },
    newsletter: { h1: 'Platform Operations Digest', p: 'What changed in the admin console this week.', fromEmail: 'ops@admin.baalvion.com', articles: [
      { tag: 'Release', h: 'What shipped in the console this week', p: 'New screens, fixed workflows, and anything that changed how you do your job.', read: 'Read the release notes →' },
      { tag: 'Incident', h: 'A summary of anything that needed attention', p: 'Transparent postmortems on anything that affected uptime or data.', read: 'Read the summary →' },
      { tag: 'Tip', h: 'An admin workflow worth knowing', p: 'One console feature most admins don\'t use yet, and should.', read: 'Read the tip →' },
    ], hlH: 'Not sure who owns what anymore?', hlP: 'The access control screen shows every admin, their role, and what they can touch.', hlBtn: 'Review access control' },
    reengagement: { h1: 'Your admin account has been quiet.', p: 'A quick summary of what changed in the console while you were away.', stats: [{ num: '18', lbl: 'Console updates' }, { num: '4', lbl: 'New screens' }, { num: '0', lbl: 'Open incidents' }], offerH: 'What changed since your last login', offerP: 'A short list of what\'s different in the console — worth five minutes before your next change.', offerBtn: 'See what changed' },
  },

  gti: {
    steps: [
      { h: 'Complete your organisation profile', p: 'Verified buyer/seller orgs move faster through RFQs and escrow.' },
      { h: 'Post or browse your first RFQ', p: 'Global trade infrastructure — sourcing, quoting, and fulfilment in one place.' },
      { h: 'Connect your shipment tracking', p: 'Real-time visibility from purchase order to delivery.' },
    ],
    resources: [
      { icon: '📦', h: 'Marketplace', p: 'Sourcing & RFQs' },
      { icon: '🚢', h: 'Shipment Tracking', p: 'End-to-end visibility' },
      { icon: '🔐', h: 'Escrow & Trust', p: 'Secured settlements' },
      { icon: '📈', h: 'Trade Intelligence', p: 'Country & compliance data' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Baalvion Trade.", p: ['Thank you for joining the global trade infrastructure platform — sourcing, RFQs, escrow, and shipment tracking, built for real cross-border commerce.', 'Your organisation is provisioned. Here\'s how to get your first trade moving.'], ctaText: 'Go to your workspace', ctaHref: '/dashboard' },
    day1: { tipLabel: 'Pro tip', tip: 'Verified organisations get matched to RFQs 3× faster than unverified ones.', h1: 'Let\'s verify your organisation.', p: 'Verification unlocks escrow, RFQ matching, and trusted counterparties — it takes a few minutes.', ctaSecTitle: 'Complete your organisation profile', ctaSecP: 'Business details, trade licenses, and banking — all encrypted.', ctaText: 'Complete verification' },
    day3: { tipLabel: 'Did you know', tip: 'Most trade desks source through 2-3 RFQs before their first confirmed order.', h1: 'Time to post or browse your first RFQ.', p: 'Whether you\'re sourcing or supplying, the marketplace is where deals start.', ctaSecTitle: 'Explore the marketplace', ctaSecP: 'Live RFQs across categories, with verified counterparties only.', ctaText: 'Open the marketplace' },
    day7: { tipLabel: 'Your next milestone', tip: 'Shipment tracking is free for every confirmed order — no separate setup.', h1: 'One week in — let\'s close the loop.', p: 'From RFQ to delivery, keep every shipment visible in one dashboard.', ctaSecTitle: 'Connect your shipment tracking', ctaSecP: 'Live status across every carrier and lane you use.', ctaText: 'Set up tracking' },
    newsletter: { h1: 'Global Trade Intelligence Weekly', p: 'Market movements, compliance updates, and platform news.', fromEmail: 'trade-desk@baalvion.com', articles: [
      { tag: 'Markets', h: 'What moved in global trade this week', p: 'Tariff changes, shipping rates, and sourcing trends worth tracking.', read: 'Read the briefing →' },
      { tag: 'Compliance', h: 'A regulatory update that affects cross-border shipments', p: 'What changed, which lanes are affected, and what to do about it.', read: 'Read the update →' },
      { tag: 'Platform', h: 'New RFQ categories and marketplace features', p: 'What shipped on Baalvion Trade this week.', read: 'Read the release →' },
    ], hlH: 'Sourcing the same category every month?', hlP: 'Set up a saved RFQ template and cut your posting time to under a minute.', hlBtn: 'Create a template' },
    reengagement: { h1: 'Your trade desk has been quiet.', p: 'Here\'s what moved in the market while you were away.', stats: [{ num: '200+', lbl: 'New RFQs' }, { num: '40', lbl: 'Verified suppliers joined' }, { num: '1', lbl: 'Reason to check back' }], offerH: 'Live RFQs in your category right now', offerP: 'A quick look at what\'s open for sourcing today.', offerBtn: 'View open RFQs' },
  },

  ir: {
    steps: [
      { h: 'Verify your investor status', p: 'Access filings, cap table data, and briefings reserved for verified investors.' },
      { h: 'Set your update preferences', p: 'Choose what you\'re notified about — filings, milestones, or everything.' },
      { h: 'Review the latest investor deck', p: 'Our current metrics, roadmap, and strategic priorities.' },
    ],
    resources: [
      { icon: '📑', h: 'Filings', p: 'Financial disclosures' },
      { icon: '📊', h: 'Investor Deck', p: 'Metrics & roadmap' },
      { icon: '🗓️', h: 'Briefings', p: 'Quarterly updates' },
      { icon: '✉️', h: 'IR Contact', p: 'Direct line to the team' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Baalvion IR.", p: ['Thank you for registering with Baalvion Investor Relations. You now have access to filings, briefings, and direct updates from the team.', 'Your investor account is active. Here\'s where to start.'], ctaText: 'Open the IR portal', ctaHref: '/dashboard' },
    day1: { tipLabel: 'Pro tip', tip: 'Verified investors get filings same-day, before any public distribution.', h1: 'Let\'s verify your investor status.', p: 'Verification unlocks the full filings archive and direct briefing invitations.', ctaSecTitle: 'Complete verification', ctaSecP: 'A short process — accreditation details, held securely.', ctaText: 'Verify my status' },
    day3: { tipLabel: 'Did you know', tip: 'The current investor deck is updated quarterly with real metrics, not projections.', h1: 'Review where things stand today.', p: 'Our latest deck covers growth, unit economics, and what\'s next.', ctaSecTitle: 'Read the investor deck', ctaSecP: 'Current metrics, roadmap, and strategic priorities.', ctaText: 'Read the deck' },
    day7: { tipLabel: 'Your next milestone', tip: 'You can set update preferences any time from your IR portal settings.', h1: 'One week in — let\'s tune your updates.', p: 'Choose exactly what you want to hear about, and how often.', ctaSecTitle: 'Set your update preferences', ctaSecP: 'Filings only, milestones only, or everything — your call.', ctaText: 'Set preferences' },
    newsletter: { h1: 'Investor Briefing', p: 'What moved this quarter — metrics, filings, and strategic updates.', fromEmail: 'ir@baalvion.com', articles: [
      { tag: 'Metrics', h: 'This quarter\'s key numbers, explained', p: 'Growth, retention, and unit economics — with context, not just charts.', read: 'Read the briefing →' },
      { tag: 'Filing', h: 'A new disclosure is now available', p: 'What it covers and why it matters for your position.', read: 'Read the filing →' },
      { tag: 'Strategy', h: 'Where the roadmap is heading next', p: 'A candid look at priorities for the coming quarter.', read: 'Read the update →' },
    ], hlH: 'Want a direct line to the IR team?', hlP: 'Book a briefing call — quarterly slots are open now.', hlBtn: 'Book a briefing' },
    reengagement: { h1: 'It\'s been a while since your last visit.', p: 'Here\'s what\'s changed since you last checked the IR portal.', stats: [{ num: '3', lbl: 'New filings' }, { num: '1', lbl: 'Updated deck' }, { num: '1', lbl: 'Upcoming briefing' }], offerH: 'Catch up before the next briefing', offerP: 'A short summary of everything filed since your last visit.', offerBtn: 'View filings' },
  },

  mining: {
    steps: [
      { h: 'Set your resource watchlist', p: 'Track the commodities and sites relevant to your operation.' },
      { h: 'Connect your site data', p: 'Feed production and yield data into the resource dashboard.' },
      { h: 'Review market pricing', p: 'Live commodity pricing across every resource you track.' },
    ],
    resources: [
      { icon: '⛏️', h: 'Site Directory', p: 'Global operations map' },
      { icon: '📉', h: 'Commodity Pricing', p: 'Live market data' },
      { icon: '📋', h: 'Compliance', p: 'Regulatory tracking' },
      { icon: '🛟', h: 'Support', p: "We're here to help" },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Baalvion Mining.", p: ['Thank you for joining the resource infrastructure platform — site data, commodity pricing, and compliance tracking in one place.', 'Your account is active. Here\'s how to get set up.'], ctaText: 'Open your dashboard', ctaHref: '/dashboard' },
    day1: { tipLabel: 'Pro tip', tip: 'A configured watchlist surfaces price moves the moment they happen.', h1: 'Let\'s set your resource watchlist.', p: 'Track exactly the commodities and sites relevant to your operation.', ctaSecTitle: 'Set your watchlist', ctaSecP: 'Choose commodities, regions, and sites to follow.', ctaText: 'Set my watchlist' },
    day3: { tipLabel: 'Did you know', tip: 'Connected site data updates your dashboard automatically — no manual entry.', h1: 'Time to connect your site data.', p: 'Feed production and yield data in for a live view of your operation.', ctaSecTitle: 'Connect your site data', ctaSecP: 'Direct integration with standard mining data formats.', ctaText: 'Connect site data' },
    day7: { tipLabel: 'Your next milestone', tip: 'Pricing data refreshes throughout the trading day, not just once daily.', h1: 'One week in — check your pricing view.', p: 'Live commodity pricing across every resource on your watchlist.', ctaSecTitle: 'Review market pricing', ctaSecP: 'Real-time pricing, historical trends, and alerts.', ctaText: 'View pricing' },
    newsletter: { h1: 'Resource Markets Weekly', p: 'Commodity moves, site updates, and compliance news.', fromEmail: 'markets@mining.baalvion.com', articles: [
      { tag: 'Markets', h: 'What moved in commodity pricing this week', p: 'The biggest price swings and what\'s driving them.', read: 'Read the briefing →' },
      { tag: 'Operations', h: 'A site update worth knowing about', p: 'Production changes across tracked operations.', read: 'Read the update →' },
      { tag: 'Compliance', h: 'A regulatory change affecting your sites', p: 'What changed and what it means for reporting.', read: 'Read the summary →' },
    ], hlH: 'Tracking multiple sites manually?', hlP: 'Connect them all once and get a single unified dashboard.', hlBtn: 'Connect a site' },
    reengagement: { h1: 'Your resource dashboard has been quiet.', p: 'Here\'s what moved in the market while you were away.', stats: [{ num: '12%', lbl: 'Avg. price move' }, { num: '8', lbl: 'Site updates' }, { num: '1', lbl: 'Reason to check back' }], offerH: 'Pricing on your watchlist right now', offerP: 'A quick snapshot of where things stand today.', offerBtn: 'View pricing' },
  },

  jobs: {
    steps: [
      { h: 'Complete your profile', p: 'A complete profile gets 4× more recruiter views.' },
      { h: 'Set your job alerts', p: 'Get notified the moment a matching role is posted.' },
      { h: 'Browse featured roles', p: 'Curated openings from teams actively hiring right now.' },
    ],
    resources: [
      { icon: '💼', h: 'Featured Roles', p: "Actively hiring" },
      { icon: '🔔', h: 'Job Alerts', p: 'Never miss a match' },
      { icon: '📄', h: 'Resume Tips', p: 'Stand out to recruiters' },
      { icon: '🏢', h: 'Companies', p: 'Browse by employer' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Baalvion Jobs.", p: ['Thank you for joining — your home for careers and talent across the Baalvion ecosystem and beyond.', 'Your profile is live. Let\'s get you discovered.'], ctaText: 'Complete your profile', ctaHref: '/profile' },
    day1: { tipLabel: 'Pro tip', tip: 'Profiles with a summary and skills listed get 4× more recruiter views.', h1: 'Let\'s complete your profile.', p: 'A few minutes now makes a real difference in how often you\'re found.', ctaSecTitle: 'Complete your profile', ctaSecP: 'Add your experience, skills, and what you\'re looking for.', ctaText: 'Complete my profile' },
    day3: { tipLabel: 'Did you know', tip: 'Job alerts land in your inbox before roles even hit the public listings page.', h1: 'Set up your job alerts.', p: 'Tell us what you\'re looking for and we\'ll do the searching.', ctaSecTitle: 'Set your job alerts', ctaSecP: 'Role, location, and seniority — matched automatically.', ctaText: 'Set my alerts' },
    day7: { tipLabel: 'Your next milestone', tip: 'Featured roles are refreshed daily by teams actively hiring right now.', h1: 'One week in — go browse featured roles.', p: 'A curated set of openings worth your first application.', ctaSecTitle: 'Browse featured roles', ctaSecP: 'Hand-picked openings from teams hiring now.', ctaText: 'Browse roles' },
    newsletter: { h1: 'This Week\'s Top Roles', p: 'New openings and career tips, every Monday.', fromEmail: 'jobs@baalvion.com', articles: [
      { tag: 'Featured', h: 'The roles getting the most attention this week', p: 'A roundup of the openings candidates are applying to most.', read: 'Browse the roles →' },
      { tag: 'Advice', h: 'A resume tip that actually moves the needle', p: 'Small changes that measurably improve response rates.', read: 'Read the tip →' },
      { tag: 'Companies', h: 'A team you should know is hiring', p: 'A spotlight on one company actively building their team.', read: 'Read the spotlight →' },
    ], hlH: 'Not getting matched to the right roles?', hlP: 'Update your alerts — most people set them once and forget them.', hlBtn: 'Update my alerts' },
    reengagement: { h1: "We've missed you.", p: 'Here\'s what\'s new since your last visit.', stats: [{ num: '120+', lbl: 'New roles' }, { num: '15', lbl: 'New companies' }, { num: '1', lbl: 'Reason to look' }], offerH: 'Roles matching your profile right now', offerP: 'A quick look at what\'s open that fits what you\'re looking for.', offerBtn: 'View matches' },
  },

  'brand-connector': {
    steps: [
      { h: 'Build your brand profile', p: 'The more complete it is, the better your matches.' },
      { h: 'Browse the brand network', p: 'Discover partners, sponsors, and collaborators actively looking to connect.' },
      { h: 'Send your first introduction', p: 'Start a conversation with a brand that matches what you\'re building.' },
    ],
    resources: [
      { icon: '🤝', h: 'Brand Network', p: 'Discover partners' },
      { icon: '📇', h: 'Your Profile', p: 'How others see you' },
      { icon: '💬', h: 'Introductions', p: 'Start conversations' },
      { icon: '🛟', h: 'Support', p: "We're here to help" },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Baalvion Connect.", p: ['Thank you for joining the brand network — where brands, sponsors, and collaborators find each other.', 'Your profile is live. Let\'s help you get discovered.'], ctaText: 'Build your profile', ctaHref: '/profile' },
    day1: { tipLabel: 'Pro tip', tip: 'Complete profiles receive 3× more introduction requests.', h1: 'Let\'s build your brand profile.', p: 'The stronger your profile, the better the matches you\'ll get.', ctaSecTitle: 'Build your brand profile', ctaSecP: 'Add what you do, what you\'re looking for, and past collaborations.', ctaText: 'Build my profile' },
    day3: { tipLabel: 'Did you know', tip: 'The network adds new verified brands every week.', h1: 'Time to browse the network.', p: 'See who\'s actively looking to partner, sponsor, or collaborate.', ctaSecTitle: 'Browse the brand network', ctaSecP: 'Filter by industry, audience, and partnership type.', ctaText: 'Browse the network' },
    day7: { tipLabel: 'Your next milestone', tip: 'The first introduction is always the hardest — after that it gets easy.', h1: 'One week in — send your first introduction.', p: 'Found a brand that fits? Reach out — that\'s what the network is for.', ctaSecTitle: 'Send your first introduction', ctaSecP: 'A short, direct message goes further than a long pitch.', ctaText: 'Send an introduction' },
    newsletter: { h1: 'This Week in the Brand Network', p: 'New brands, partnership opportunities, and platform updates.', fromEmail: 'connect@baalvion.com', articles: [
      { tag: 'New', h: 'Brands that joined the network this week', p: 'A quick look at who\'s new and what they\'re looking for.', read: 'Browse new brands →' },
      { tag: 'Opportunity', h: 'A partnership opportunity worth a look', p: 'One collaboration request that\'s open right now.', read: 'Read the details →' },
      { tag: 'Tip', h: 'How the best profiles get discovered', p: 'What separates profiles that get introductions from ones that don\'t.', read: 'Read the tip →' },
    ], hlH: 'Not getting introductions yet?', hlP: 'A stronger profile is the single biggest lever — it takes ten minutes.', hlBtn: 'Update my profile' },
    reengagement: { h1: 'The network has been quiet on your end.', p: 'Here\'s who joined and what changed while you were away.', stats: [{ num: '40+', lbl: 'New brands' }, { num: '12', lbl: 'Open opportunities' }, { num: '1', lbl: 'Reason to check back' }], offerH: 'Brands that match your profile right now', offerP: 'A short list of potential partners worth an introduction.', offerBtn: 'View matches' },
  },

  dashboard: {
    steps: [
      { h: 'Connect your first website', p: 'Link a site to start seeing real data in your workspace.' },
      { h: 'Invite your team', p: 'Add teammates and set their access level.' },
      { h: 'Review your unified overview', p: 'Content, payments, and performance — across every connected property.' },
    ],
    resources: [
      { icon: '🔗', h: 'Connections', p: 'Linked properties' },
      { icon: '👥', h: 'Team', p: 'Members & roles' },
      { icon: '📊', h: 'Overview', p: 'Unified reporting' },
      { icon: '🛟', h: 'Support', p: "We're here to help" },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Baalvion Dashboard.", p: ['Thank you for joining — your unified workspace across every Baalvion property your company runs.', 'Your workspace is ready. Let\'s connect your first property.'], ctaText: 'Open your workspace', ctaHref: '/' },
    day1: { tipLabel: 'Pro tip', tip: 'Workspaces with a connected property from day one see setup completed 2× faster.', h1: 'Let\'s connect your first website.', p: 'Link a property to start seeing real data in your workspace immediately.', ctaSecTitle: 'Connect your first website', ctaSecP: 'A guided flow — takes about two minutes.', ctaText: 'Connect a website' },
    day3: { tipLabel: 'Did you know', tip: 'Team members only see what their role allows — nothing is exposed by default.', h1: 'Time to invite your team.', p: 'Bring in the people who need visibility, with the access level they need.', ctaSecTitle: 'Invite your team', ctaSecP: 'Set roles per member — owner, editor, or viewer.', ctaText: 'Invite teammates' },
    day7: { tipLabel: 'Your next milestone', tip: 'The unified overview updates in real time across every connected property.', h1: 'One week in — check your unified overview.', p: 'Content, payments, and performance, across everything you\'ve connected.', ctaSecTitle: 'Review your unified overview', ctaSecP: 'One dashboard for every property your company runs.', ctaText: 'View overview' },
    newsletter: { h1: 'Workspace Digest', p: 'What changed across your connected properties this week.', fromEmail: 'workspace@baalvion.com', articles: [
      { tag: 'Summary', h: 'Performance across your properties this week', p: 'A roundup of traffic, content, and payment activity.', read: 'Read the summary →' },
      { tag: 'Release', h: 'New features in your workspace', p: 'What shipped in the dashboard this week.', read: 'Read the release notes →' },
      { tag: 'Tip', h: 'A workspace feature worth using', p: 'One overview tool most teams haven\'t discovered yet.', read: 'Read the tip →' },
    ], hlH: 'Managing properties in separate tabs still?', hlP: 'Connect them all and see everything from one unified overview.', hlBtn: 'Connect a property' },
    reengagement: { h1: 'Your workspace has been quiet.', p: 'Here\'s what changed across your properties while you were away.', stats: [{ num: '24', lbl: 'Content updates' }, { num: '3', lbl: 'New team invites' }, { num: '1', lbl: 'Reason to check back' }], offerH: 'What changed since your last visit', offerP: 'A quick summary across every property in your workspace.', offerBtn: 'View overview' },
  },

  proxy: {
    steps: [
      { h: 'Generate your API key', p: 'Get authenticated and start routing traffic in minutes.' },
      { h: 'Choose your proxy pool', p: 'Residential, mobile, or datacenter — pick what fits your use case.' },
      { h: 'Read the integration docs', p: 'Drop-in SDKs for every major language and framework.' },
    ],
    resources: [
      { icon: '🔑', h: 'API Keys', p: 'Authentication' },
      { icon: '🌐', h: 'Proxy Pools', p: '45M+ residential IPs' },
      { icon: '📘', h: 'Documentation', p: 'Integration guides' },
      { icon: '📈', h: 'Status', p: '99.9% uptime SLA' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Baalvion NetStack.", p: ['Thank you for joining — Tier 1 residential, mobile, and datacenter proxies with an API-first SaaS, built for creators, agencies, and global enterprises.', 'Your account is active. Here\'s how to route your first request.'], ctaText: 'Get your API key', ctaHref: '/app/dashboard' },
    day1: { tipLabel: 'Pro tip', tip: 'Most integrations are live within 10 minutes using our drop-in SDKs.', h1: 'Let\'s get your first request routed.', p: 'Generate a key and you\'re ready to send traffic through the network.', ctaSecTitle: 'Generate your API key', ctaSecP: 'Authenticated and ready to use immediately.', ctaText: 'Generate my API key' },
    day3: { tipLabel: 'Did you know', tip: 'Residential IPs rotate automatically — no extra configuration needed.', h1: 'Time to choose your proxy pool.', p: 'Residential, mobile, or datacenter — each tuned for a different use case.', ctaSecTitle: 'Choose your proxy pool', ctaSecP: '45M+ residential IPs, global mobile carriers, and high-speed datacenter options.', ctaText: 'Choose a pool' },
    day7: { tipLabel: 'Your next milestone', tip: 'The status page shows real-time uptime across every region we serve.', h1: 'One week in — go deeper with the docs.', p: 'SDKs, rotation strategies, and advanced routing — all documented.', ctaSecTitle: 'Read the integration docs', ctaSecP: 'Drop-in SDKs for every major language and framework.', ctaText: 'Read the docs' },
    newsletter: { h1: 'Network & Infrastructure Digest', p: 'Pool updates, uptime, and platform news.', fromEmail: 'updates@baalvionstack.com', articles: [
      { tag: 'Infrastructure', h: 'New proxy pools added this week', p: 'Expanded regions and carrier coverage now available.', read: 'Read the details →' },
      { tag: 'Reliability', h: 'This week\'s uptime report', p: 'A transparent look at network performance across every region.', read: 'Read the report →' },
      { tag: 'Platform', h: 'New SDK and integration updates', p: 'What shipped for developers this week.', read: 'Read the release →' },
    ], hlH: 'Hitting rate limits on your current plan?', hlP: 'Enterprise plans unlock higher concurrency and dedicated support.', hlBtn: 'Talk to enterprise sales' },
    reengagement: { h1: 'Your account has been quiet.', p: 'Here\'s what\'s new on the network since you last connected.', stats: [{ num: '99.9%', lbl: 'Uptime SLA' }, { num: '45M+', lbl: 'Residential IPs' }, { num: '1', lbl: 'Reason to come back' }], offerH: 'What\'s new since your last request', offerP: 'New pools, better rotation, and platform improvements worth a look.', offerBtn: 'See what\'s new' },
  },

  amarise: {
    steps: [
      { h: 'Explore the collection', p: 'Curated pieces across fashion, interiors, and gifting.' },
      { h: 'Create your wishlist', p: 'Save what catches your eye and revisit it anytime.' },
      { h: 'Book a private consultation', p: 'Personal styling and sourcing, by appointment.' },
    ],
    resources: [
      { icon: '✦', h: 'New Arrivals', p: 'This season\'s edit' },
      { icon: '✦', h: 'Interiors', p: 'Curated for the home' },
      { icon: '✦', h: 'Fashion Edit', p: 'Seasonal selections' },
      { icon: '✦', h: 'Gift Curation', p: 'Thoughtfully chosen' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Amarisé Maison Avenue.", p: ['Thank you for joining us. You now have access to a curated world of fashion, interiors, and considered gifting.', 'Your account is ready. We invite you to explore.'], ctaText: 'Explore the collection', ctaHref: '/' },
    day1: { tipLabel: 'A note from us', tip: 'Members who create a wishlist in their first week receive early access to new arrivals.', h1: 'A closer look at the collection.', p: 'Take a moment to explore what\'s new this season.', ctaSecTitle: 'Explore the collection', ctaSecP: 'Curated pieces across fashion, interiors, and gifting.', ctaText: 'Explore now' },
    day3: { tipLabel: 'Worth knowing', tip: 'Wishlist items are held for you when stock runs low.', h1: 'Have you started your wishlist?', p: 'Save the pieces that speak to you — revisit them whenever you like.', ctaSecTitle: 'Create your wishlist', ctaSecP: 'A private collection of everything you love.', ctaText: 'Start my wishlist' },
    day7: { tipLabel: 'By appointment', tip: 'Private consultations include personal styling and considered sourcing.', h1: 'One week in — consider a private consultation.', p: 'Personal styling and sourcing, tailored entirely to you.', ctaSecTitle: 'Book a private consultation', ctaSecP: 'A dedicated session with our styling team, by appointment.', ctaText: 'Book a consultation' },
    newsletter: { h1: 'The Amarisé Edit', p: 'New arrivals and considered selections, delivered weekly.', fromEmail: 'maison@amarisemaisonavenue.com', articles: [
      { tag: 'New', h: 'This week\'s new arrivals', p: 'A closer look at what just landed across fashion and interiors.', read: 'View the edit →' },
      { tag: 'Feature', h: 'The story behind a piece we love', p: 'Craftsmanship and provenance, told properly.', read: 'Read the feature →' },
      { tag: 'Gifting', h: 'Considered gifts for the season', p: 'A curated shortlist for the occasions that matter.', read: 'View the selection →' },
    ], hlH: 'Looking for something specific?', hlP: 'Our styling team can source pieces not yet listed — just ask.', hlBtn: 'Book a consultation' },
    reengagement: { h1: 'We\'ve missed you.', p: 'A few things have arrived since you last visited.', stats: [{ num: '24', lbl: 'New pieces' }, { num: '3', lbl: 'Limited editions' }, { num: '1', lbl: 'Worth a look' }], offerH: 'New arrivals since your last visit', offerP: 'A curated selection chosen with you in mind.', offerBtn: 'View new arrivals' },
  },

  ctm: {
    steps: [
      { h: 'Set your market targets', p: 'Tell us what you\'re watching so intelligence stays relevant.' },
      { h: 'Get your first intelligence report', p: 'A tailored briefing based on your targets, ready in minutes.' },
      { h: 'Build your command centre', p: 'Every market you track, in one live view.' },
    ],
    resources: [
      { icon: '📊', h: 'Market Reports', p: 'Deep intelligence' },
      { icon: '🧮', h: 'Investment Tools', p: 'Analysis & modelling' },
      { icon: '🌍', h: 'Global Trends', p: 'Cross-market signals' },
      { icon: '🔔', h: 'Alerts', p: 'Real-time notifications' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Control The Market.", p: ['Thank you for joining — markets infrastructure built for people who need to act on intelligence, not just read it.', 'Your account is active. Let\'s set up your command centre.'], ctaText: 'Set your targets', ctaHref: '/dashboard' },
    day1: { tipLabel: 'Pro tip', tip: 'Targeted intelligence cuts through noise — most users set 3-5 targets to start.', h1: 'Let\'s set your market targets.', p: 'Tell us what you\'re watching so every report stays relevant to you.', ctaSecTitle: 'Set your market targets', ctaSecP: 'Sectors, tickers, or regions — your call.', ctaText: 'Set my targets' },
    day3: { tipLabel: 'Did you know', tip: 'Reports are generated from live data, not delayed feeds.', h1: 'Your first intelligence report is ready.', p: 'A tailored briefing based on exactly what you\'re tracking.', ctaSecTitle: 'Get your first report', ctaSecP: 'Generated from your targets, updated in real time.', ctaText: 'View my report' },
    day7: { tipLabel: 'Your next milestone', tip: 'The command centre updates live — no refresh needed.', h1: 'One week in — build your command centre.', p: 'Every market you track, visualised in one live view.', ctaSecTitle: 'Build your command centre', ctaSecP: 'Customise your layout around what matters to you.', ctaText: 'Build my command centre' },
    newsletter: { h1: 'Market Intelligence Weekly', p: 'What moved, what mattered, and what\'s next.', fromEmail: 'intel@controlthemarket.com', articles: [
      { tag: 'Markets', h: 'The biggest market move this week', p: 'What happened, why, and what it signals going forward.', read: 'Read the analysis →' },
      { tag: 'Deep dive', h: 'A sector worth watching right now', p: 'The data behind a trend most people haven\'t noticed yet.', read: 'Read the deep dive →' },
      { tag: 'Tools', h: 'A platform feature worth using', p: 'One analysis tool that most members haven\'t tried.', read: 'Read the guide →' },
    ], hlH: 'Missing moves in your sector?', hlP: 'Real-time alerts catch what a weekly report can\'t.', hlBtn: 'Set up alerts' },
    reengagement: { h1: 'The market moved without you.', p: 'Here\'s what changed while you were away.', stats: [{ num: '15%', lbl: 'Biggest sector move' }, { num: '8', lbl: 'New reports' }, { num: '1', lbl: 'Reason to check back' }], offerH: 'What you missed this month', offerP: 'A condensed intelligence report covering everything since your last visit.', offerBtn: 'View the report' },
  },

  imperialpedia: {
    steps: [
      { h: 'Browse featured articles', p: 'Discover curated content across history, science, culture, and more.' },
      { h: 'Create your reading list', p: 'Save articles you want to revisit and track your learning journey.' },
      { h: 'Contribute knowledge', p: 'Edit, improve, or create articles and earn contributor badges.' },
    ],
    resources: [
      { icon: '📚', h: 'Featured Articles', p: "Editor's picks" },
      { icon: '🗂️', h: 'Categories', p: 'Browse by topic' },
      { icon: '✍️', h: 'Contribute', p: 'Add your knowledge' },
      { icon: '🔍', h: 'Search', p: 'Find anything fast' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Imperialpedia.", p: ['Thank you for joining us. You now have access to everything Imperialpedia has to offer — the free encyclopedia where everyone can learn and contribute.', 'Your account is active and ready. Here\'s everything you need to get started.'], ctaText: 'Get started', ctaHref: '/explore' },
    day1: { tipLabel: 'Pro tip', tip: 'Readers who save their first article in week one return 3× more often.', h1: 'Let\'s find your first article.', p: 'A curated set of featured pieces to get you started today.', ctaSecTitle: 'Browse featured articles', ctaSecP: 'Discover curated content across history, science, culture, and more.', ctaText: 'Browse featured articles' },
    day3: { tipLabel: 'Did you know', tip: 'Reading lists sync across devices — start on desktop, finish on mobile.', h1: 'Start building your reading list.', p: 'Save what interests you and pick up right where you left off.', ctaSecTitle: 'Create your reading list', ctaSecP: 'Save articles you want to revisit and track your learning journey.', ctaText: 'Start my reading list' },
    day7: { tipLabel: 'Your next milestone', tip: 'Contributors who make their first edit in week one are far more likely to keep contributing.', h1: 'One week in — try contributing.', p: 'Edit, improve, or create an article and earn your first contributor badge.', ctaSecTitle: 'Contribute knowledge', ctaSecP: 'Every contribution, however small, helps the encyclopedia grow.', ctaText: 'Make my first edit' },
    newsletter: { h1: 'This Week on Imperialpedia', p: 'Featured articles and community highlights, every Monday.', fromEmail: 'newsletter@imperialpedia.com', articles: [
      { tag: 'Featured', h: 'The most-read article this week', p: 'A deep, well-sourced piece that captured readers\' attention.', read: 'Read the article →' },
      { tag: 'Community', h: 'A contributor spotlight worth reading', p: 'Meet one of the editors shaping the encyclopedia this week.', read: 'Read the spotlight →' },
      { tag: 'New', h: 'Newly published articles worth a look', p: 'A short list of fresh entries across several categories.', read: 'Browse new articles →' },
    ], hlH: 'Haven\'t contributed yet?', hlP: 'Even a small edit helps — most first contributions take under five minutes.', hlBtn: 'Start contributing' },
    reengagement: { h1: 'We\'ve missed you.', p: 'Here\'s what\'s new on Imperialpedia since your last visit.', stats: [{ num: '500+', lbl: 'New articles' }, { num: '40', lbl: 'Categories updated' }, { num: '1', lbl: 'Reason to return' }], offerH: 'What\'s new since you last visited', offerP: 'A roundup of new and updated articles worth your time.', offerBtn: 'See what\'s new' },
  },

  law: {
    steps: [
      { h: 'Verify your credentials', p: 'Bar admission and standing — verified once, trusted across the network.' },
      { h: 'Join your practice area group', p: 'Connect with peers in your specific area of law.' },
      { h: 'Access legal resources', p: 'Case database, templates, and CLE courses, all in one place.' },
    ],
    resources: [
      { icon: '⚖️', h: 'Case Database', p: 'Searchable precedent' },
      { icon: '📄', h: 'Templates', p: 'Vetted legal documents' },
      { icon: '🎓', h: 'CLE Courses', p: 'Continuing education' },
      { icon: '🤝', h: 'Network', p: 'Connect with peers' },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Law Elite Network.", p: ['Thank you for joining — the legal network built for verified practitioners who need real resources and real peers, not just directories.', 'Your account is active. Let\'s get you verified.'], ctaText: 'Verify your credentials', ctaHref: '/dashboard' },
    day1: { tipLabel: 'Pro tip', tip: 'Verified members get full access to the case database and templates immediately.', h1: 'Let\'s verify your credentials.', p: 'Bar admission and standing — a quick process, verified once.', ctaSecTitle: 'Verify your credentials', ctaSecP: 'Required for full network access.', ctaText: 'Verify my credentials' },
    day3: { tipLabel: 'Did you know', tip: 'Practice area groups host regular discussions on active matters and precedent.', h1: 'Find your practice area group.', p: 'Connect with peers working in your specific area of law.', ctaSecTitle: 'Join your practice area group', ctaSecP: 'Litigation, corporate, IP, and more.', ctaText: 'Join a group' },
    day7: { tipLabel: 'Your next milestone', tip: 'CLE courses on the network count toward continuing education requirements in most jurisdictions.', h1: 'One week in — explore legal resources.', p: 'Case database, templates, and CLE courses, ready when you need them.', ctaSecTitle: 'Access legal resources', ctaSecP: 'Everything vetted, everything current.', ctaText: 'Access resources' },
    newsletter: { h1: 'This Week in the Network', p: 'Precedent, practice area updates, and continuing education.', fromEmail: 'network@lawelitenetwork.com', articles: [
      { tag: 'Precedent', h: 'A ruling worth knowing about this week', p: 'A summary and what it means for practitioners in the affected area.', read: 'Read the summary →' },
      { tag: 'Practice', h: 'A discussion from your practice area group', p: 'Highlights from this week\'s most active thread.', read: 'Read the discussion →' },
      { tag: 'CLE', h: 'A new continuing education course is live', p: 'Earn credit hours on a topic relevant to your practice.', read: 'View the course →' },
    ], hlH: 'Haven\'t joined a practice group yet?', hlP: 'Find peers working in your exact area of law — it takes a minute.', hlBtn: 'Join a group' },
    reengagement: { h1: 'The network has been quiet on your end.', p: 'Here\'s what you missed since your last visit.', stats: [{ num: '30+', lbl: 'New precedents' }, { num: '5', lbl: 'New CLE courses' }, { num: '1', lbl: 'Reason to check back' }], offerH: 'What\'s new in your practice area', offerP: 'A short summary of relevant updates since you last logged in.', offerBtn: 'See what\'s new' },
  },

  marketunderworld: {
    steps: [
      { h: 'Access the playbooks', p: 'Proven growth and market strategies, ready to run.' },
      { h: 'Join the inner circle', p: 'Private access to the most active members and strategies.' },
      { h: 'Run your first campaign', p: 'Launch your first play with the tools and templates provided.' },
    ],
    resources: [
      { icon: '📕', h: 'Playbooks', p: 'Proven strategies' },
      { icon: '📈', h: 'Analytics', p: 'Track your performance' },
      { icon: '🧪', h: 'A/B Templates', p: 'Test what works' },
      { icon: '🔥', h: 'Trending', p: "What's working now" },
    ],
    welcome: { eyebrow: 'Welcome', h1: "You're now part of Market Underworld.", p: ['Thank you for joining — the decentralized digital marketplace built for members who move fast and value privacy.', 'Your account is active and ready. Here\'s where to start.'], ctaText: 'Get started', ctaHref: '/dashboard' },
    day1: { tipLabel: 'Pro tip', tip: 'Members who run their first play in week one see results 3× faster.', h1: 'Let\'s get your first play running.', p: 'Access the playbooks and pick a proven strategy to start with.', ctaSecTitle: 'Access the playbooks', ctaSecP: 'Proven growth and market strategies, ready to run.', ctaText: 'Access playbooks' },
    day3: { tipLabel: 'Did you know', tip: 'Inner circle access unlocks strategies not published anywhere else.', h1: 'Time to join the inner circle.', p: 'Private access to the most active members and their strategies.', ctaSecTitle: 'Join the inner circle', ctaSecP: 'Reserved for members actively running campaigns.', ctaText: 'Request access' },
    day7: { tipLabel: 'Your next milestone', tip: 'A/B templates cut testing time from days to hours.', h1: 'One week in — run your first campaign.', p: 'Launch with the tools and templates already set up for you.', ctaSecTitle: 'Run your first campaign', ctaSecP: 'Everything you need is already in your dashboard.', ctaText: 'Launch a campaign' },
    newsletter: { h1: 'This Week in the Underworld', p: 'What\'s trending, what\'s working, and what\'s next.', fromEmail: 'signal@marketunderworld.com', articles: [
      { tag: 'Trending', h: 'The play everyone\'s running this week', p: 'What\'s working right now and why it\'s catching on.', read: 'Read the breakdown →' },
      { tag: 'Playbook', h: 'A new playbook just dropped', p: 'A fresh strategy added to the library this week.', read: 'Read the playbook →' },
      { tag: 'Data', h: 'What the analytics are showing this week', p: 'Trends across the network worth knowing about.', read: 'Read the data →' },
    ], hlH: 'Not seeing results yet?', hlP: 'Most members who stall haven\'t tried the inner circle strategies yet.', hlBtn: 'Request inner circle access' },
    reengagement: { h1: 'The signal\'s been quiet on your end.', p: 'Here\'s what\'s new since you were last active.', stats: [{ num: '18', lbl: 'New playbooks' }, { num: '9', lbl: 'Trending plays' }, { num: '1', lbl: 'Reason to come back' }], offerH: 'What\'s trending right now', offerP: 'The plays getting the most traction across the network this week.', offerBtn: 'See what\'s trending' },
  },
};

module.exports = { CONTENT };
