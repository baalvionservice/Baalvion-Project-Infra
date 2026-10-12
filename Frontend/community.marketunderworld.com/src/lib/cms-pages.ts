// Every public page whose title, description and content staff can write in /admin/content.
// "hint" tells the writer what a good page says. Per-draw pages are added from the live draws.
export interface CmsPage { slug: string; label: string; hint: string }

export const CMS_PAGES: CmsPage[] = [
  { slug: "clubs", label: "Clubs directory", hint: "Say which cities you cover (India and Dubai), how guest lists and VIP tables work here, and why members should use the directory." },
  { slug: "clubs/events", label: "Events and DJ nights", hint: "Explain who lists events, how a member posts one, and how tickets work (organiser's own link)." },
  { slug: "clubs/events/submit", label: "Post your event", hint: "What organisers need to prepare (poster, date, ticket link) and how long review takes." },
  { slug: "clubs/lottery", label: "Ticket draw (all draws)", hint: "How the draw works in plain words: points, one entry per ticket, recorded random draw, how winners are shown, 18+ only." },
  { slug: "clubs/dj-demand", label: "Demand your DJ", hint: "How members pledge points, what happens when a target is reached, and what happens to points if it is not." },
  { slug: "clubs/elite-host", label: "Elite (Millionaire) parties", hint: "Who can host, paid membership versus free invitations for women guests, and that every host approves each request." },
  { slug: "dating", label: "Dating and founders", hint: "Verified adults only, mutual likes, no paid dates, how to report someone." },
  { slug: "forum", label: "Forum", hint: "What the communities are for, who can join, and the rules." },
  { slug: "forum/join", label: "Forum onboarding", hint: "How to join open communities and ask to join private ones." },
  { slug: "access", label: "Membership tiers", hint: "What each tier unlocks, price, how payment and confirmation work (5 to 30 minutes)." },
  { slug: "locals", label: "Local jobs and gigs", hint: "Who posts, who applies, how employers are reviewed." },
  { slug: "nightlife/employer", label: "Hire people (employers)", hint: "How to register a business and post a job." },
  { slug: "education", label: "Education", hint: "Courses, teachers, live sessions and how to enrol." },
  { slug: "live-sessions", label: "Live sessions", hint: "What live sessions are, how to join, who teaches." },
  { slug: "marketplace", label: "Marketplace", hint: "What can be bought and sold, buyer pass, how payments work." },
  { slug: "shop", label: "Shop", hint: "What the shop sells and how orders and wallet points work." },
  { slug: "gift-cards", label: "Gift cards", hint: "How gift cards work, delivery, expiry and refunds." },
  { slug: "leaderboard", label: "Leaderboard", hint: "What the ranking measures and how often it updates." },
  { slug: "premium", label: "Premium", hint: "What premium includes." },
  { slug: "match", label: "Match quiz", hint: "What the quiz does with the answers." },
  { slug: "about", label: "About", hint: "Who runs Hell Road, what it is for, where it operates (India and UAE)." },
  { slug: "contact", label: "Contact", hint: "How to reach support and how quickly you reply." },
  { slug: "terms", label: "Terms", hint: "The rules members agree to." },
  { slug: "privacy", label: "Privacy", hint: "What you collect, why, and how long you keep it." },
]
