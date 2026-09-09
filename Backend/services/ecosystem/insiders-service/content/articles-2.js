'use strict';
module.exports = [
{
  slug: 'related-persons-are-not-founders',
  title: 'A “related person” on a filing is not necessarily a founder',
  topic: 'Reading filings',
  summary: 'Form D names executives, directors and promoters. Three very different roles, one field, and a common misreading.',
  body: `The most valuable field on a Form D is the list of related persons — real names attached to a real entity. It is also the field most often misread.

The form asks for executive officers, directors and promoters. A filer ticks whichever applies. What comes out is a mixed list where a co-founder, an outside board member appointed by an investor, and a fund's own general partner all appear the same way.

## Telling them apart

**Executive Officer** on an early-stage company usually is a founder, or close to it. On a fund, it is a partner.

**Director** frequently means an investor's board seat, not an operator. When you see the same person listed as a Director across four unrelated companies in the same sector, you are almost certainly looking at a fund partner's portfolio, not a serial founder.

**Promoter** is often not a person at all. Funds routinely enter their management entity here — "Acme Capital Fund Management, L.P." — which is why unfiltered directories end up listing limited partnerships as though they were people. Roughly a quarter of the person-rows in a raw extract are entities of this kind.

## The connection this reveals

Once you separate the roles, one pattern becomes visible that no marketing page will show you: a partner at a fund, listed as an Executive Officer there, appearing as a Director on the companies that fund has backed.

That is a portfolio, reconstructed from filings. It tells you what a fund actually does rather than what it says it does, and it tells you which partner is likely to understand your business — which is a far better targeting signal than the firm's stated sector focus.

## What it will not tell you

Roles are as filed, and filings are not updated when someone leaves. A person listed on a 2022 filing may have moved on. Treat the list as "was connected as of this date", never as a current org chart.

## How thin most of these records are

This is the part that gets glossed over. Across the corpus behind this directory there are 181,631 distinct people. Of those, 149,275 — 82 per cent — appear on exactly one filing.

One filing means one fact: this person was named, in one role, on one document, on one date. There is no career, no history and no pattern to read. It is a true record and a shallow one.

The interesting population is the other 18 per cent. 32,356 people appear on two or more filings, and 5,951 appear on five or more. Those are the records where a shape emerges — a partner who keeps showing up, a serial director, an operator who has been through several companies.

If you are searching for people, that ratio is the single most useful thing to know. Four names out of five will tell you nothing beyond an association. The fifth will tell you a story.

## Cleaning the entity rows out

Before any of that analysis works, the entity contamination has to go, and it is worse than it first appears.

An obvious filter catches "Acme Capital Fund Management, L.P." A less obvious one is needed for names beginning with punctuation — "- 65 Commerce West Industrial GP, L.L.C." — which slip past word-boundary matching because the leading dash is not a word character. Trailing abbreviated forms cause the same problem: a pattern anchored on word boundaries will not match "L.L.C." at the end of a string, because the final full stop is not followed by one.

In practice a filter has to reject three shapes: names carrying a legal suffix anywhere, names starting with a non-letter, and names containing structural words like management, holdings, partners or trust. Removing those took roughly a quarter of the raw person rows out of this dataset — and every one that survives a weaker filter is a limited partnership presented to a reader as a human being.

## What to do with a person once you have found them

The practical move is to work backwards from the role pattern rather than forwards from the name.

Someone listed as an executive officer at a fund and a director at four companies is a partner with a portfolio, and the four companies tell you their sector. Someone listed as an executive officer at four unrelated companies over six years is an operator, and a potential hire or advisor rather than a source of capital. Someone appearing once, as a promoter, on a single SPV is almost certainly an administrator's signatory and not worth pursuing at all.

None of those distinctions are labelled in the data. All of them are visible from the role and the count.

## One more caution about names

People are matched by name, because Form D gives a person no identifier. That has two consequences worth stating plainly.

Common names collapse. Two different people called John Smith, one at a fund in Boston and one at a company in Texas, will share a page. The affiliation list makes that visible — the roles and cities will not cohere — but nothing in the data can separate them, and any tool claiming to has guessed.

Case matters too, in a way that is easy to miss. Filers are inconsistent: the same person appears as "ELON MUSK" on one filing and "Elon Musk" on the next, and a naive match treats them as two people. Normalising the shouted form while leaving mixed case alone merged several hundred duplicates in this dataset. Left unmerged, they would have quietly halved the affiliation count on exactly the people most worth finding.

## Why this field is worth the trouble

It is the only place in public data where the two sides of the market are joined by the same key.

A fund's website lists its partners. A company's website lists its board. Neither links to the other, and no public dataset connects them — except this one, because the same individual is named on both filings and matched by name.

Follow it and a portfolio reconstructs itself: a partner listed as an executive officer at a fund, and as a director on the companies that fund has backed. That is a map of what a firm actually does, assembled from primary documents, and it is more reliable than a stated sector focus because it is a record of decisions rather than intentions.

It is also the shortest path to a warm introduction. You are not looking for a firm; you are looking for the one person inside it who has already backed something like you, and their name is on a public document.`,
},
{
  slug: 'why-one-fund-appears-many-times',
  title: 'Why one fund shows up five times in a filing search',
  topic: 'Reading filings',
  summary: 'Amendments, parallel vehicles and share classes all file separately. Counting them as separate funds inflates everything.',
  body: `Search the SEC's records for a well-known fund and you will get more results than the firm has funds. There are three reasons, and each one distorts a different number.

## Amendments

A filer amends its Form D as a raise progresses. Each amendment is a new filing carrying the cumulative amount sold to date. Sum the "sold" column across amendments and you will report a fund several times its actual size. The correct read is the most recent filing, not the total.

## Parallel vehicles

A single fund is frequently raised through several legal entities: a US vehicle, an offshore one for non-US investors, a levered and an unlevered sleeve, sometimes a currency-specific version. One firm's infrastructure fund in a recent cycle filed as SBS, ESC (Lev), (EUR) and (USD) vehicles — four filings, four registration numbers, one fund.

Each has its own CIK, the SEC's registrant identifier. That is why a CIK identifies a *vehicle*, never a firm, and why grouping filings by CIK produces a directory full of near-duplicates.

## Feeders, co-invests and SPVs

A firm will also file for co-investment vehicles created for a single deal. These are real entities raising real money, but they are not new funds and they do not represent new mandate.

## What good grouping looks like

Strip the legal suffix, the roman numeral and the structure marker, and "Spark Capital IX, L.P." and "Spark Capital Growth Fund VI, L.P." both reduce to a name you can group on. Do that and a firm with 50 filings resolves to one firm with a fund history — which is what you actually wanted to see.

Get it wrong in the other direction and you merge two unrelated firms that share a first word. The safeguard is geography: same name stem *and* same city is a firm; same name stem in different cities is a coincidence.

## The series-LLC problem, which is bigger than all of it

There is a fourth cause, and in a modern corpus it dwarfs the others.

A large share of filings now come from series LLCs: a single administrator sets up one legal structure and spins out a numbered series for every deal. The names give it away — "Su-1217 Fund I, A Series Of Thicket Ventures", "PA Fund I, A Series Of Jude Gomila". Each series files its own Form D.

In the corpus behind this directory, more than half of the raw filings were of this shape. Treating each one as a firm produced 45,286 "investment firms". Rolling each series up to the sponsor named after "a series of" produced 22,608 — which is the real number.

That is not a rounding error. It is a dataset that overstated the size of the venture market by a factor of two, and it would have done so confidently.

## How it distorts everything downstream

The count is the least of it.

Geography breaks first. Because every series files from its administrator's address, one Seattle suite accounted for 12,420 filings and a Claymont mail drop for 4,872. Ranked by city, the result claimed 13,688 venture firms in Seattle — more than New York, San Francisco and Boston combined. After the rollup and after de-locating service addresses, the same query returns New York 803, San Francisco 677, Austin 228, Palo Alto 205, Menlo Park 197. That is a recognisable map of American venture capital. The first one was fiction assembled entirely from true documents.

Averages break next. Series vehicles are small and numerous, so any median computed across raw filings describes SPVs rather than funds. And people break too, because the same administrator signatory appears on hundreds of filings.

## The rule underneath all four causes

A filing identifies a *vehicle*. A firm is an interpretation you build on top of vehicles, and the interpretation is where all the difficulty lives.

Any dataset that skips that step — and many do, because the raw filings are easy to load and the rollup is fiddly — will be wrong in the same direction every time: too many firms, too small on average, and concentrated in whichever cities happen to host the largest fund administrators.

## What a good rollup does and does not merge

Merge: numbered vehicles from one family, amendments to the same offering, parallel currency and leverage sleeves, and series named after a sponsor.

Do not merge: two firms sharing a common first word, a spinout that took part of a name with it, or a fund family that genuinely split. The cost of over-merging is silent — two firms become one and the smaller disappears — so the safeguard should be conservative. Requiring the same city as well as the same name stem catches most of it.

Leave visible: which filings were merged into which firm. A profile that shows its underlying documents lets you check the rollup yourself, and lets you notice when it is wrong. A profile that shows only a total asks to be trusted.

## Reading a fund family as a history

Once vehicles are grouped, the sequence becomes readable, and it says more than any single filing.

A firm with funds numbered I through V, each larger than the last, filed at roughly three-year intervals, is a manager that keeps raising — which means its investors keep re-upping, which is the closest thing to a public performance signal you will find.

A firm whose fund sizes plateau or fall has had a harder time. A firm whose flagship is joined by a growth vehicle has moved up-stage and may no longer write early cheques. A firm that files an opportunities fund is concentrating into existing winners, which tells you where its attention is going.

None of that is stated anywhere. All of it is legible from a list of vehicles with dates and amounts — provided somebody did the rollup first.

## A quick way to check any profile

Open a firm you know well and count its funds. If a household name shows one fund, the rollup is too aggressive or the window is too short. If it shows forty, vehicles and amendments are being counted separately.

Then look at the dates. Real fund families are spaced — two to four years between flagships. A list of twelve "funds" filed inside eighteen months is a list of vehicles, whatever it is labelled.`,
},
{
  slug: 'first-time-funds-in-public-data',
  title: 'How to spot a first-time fund from public records alone',
  topic: 'Choosing who to approach',
  summary: 'New managers are the most reachable investors in the market and the hardest to find on any list. The filings give them away.',
  body: `Emerging managers take meetings that established firms decline. They need proprietary deal flow, they have something to prove to their own investors, and they have not yet built the referral wall that keeps strangers out.

They are also missing from most investor lists, because those lists are built from press coverage and a first fund gets none.

Public filings surface them cleanly.

## The signature

A first-time fund looks like this: one filing, no prior filing history under any related name, a modest amount sold, a recent first-sale date, and one or two named individuals rather than a roster.

Contrast that with an established firm: multiple filings stretching back years, a cluster of vehicles filed together, and a longer list of executive officers.

## Reading the amount

Do not dismiss small numbers. A first close of $12m against an eventual $40m target is a normal, healthy pattern — the fund files when it makes its first sale, long before the final close. The figure you see is a starting point, not a verdict.

What should give you pause is a first filing where the amount sold is zero and the date is more than a year old. That is a fund that announced and did not close.

## Why the address helps

First-time managers usually file from a real working address — an office, sometimes a home. Established firms file from a corporate registered agent. When the address on the filing looks like somewhere a person actually sits, you are probably looking at a small, new, reachable firm.

## The trade

New managers are more accessible and move less predictably. Decisions can be slower because the manager is often still fundraising while investing, and reserves are thinner, so follow-on support is less certain. Approach them for what they are: genuine access, with a different risk profile than a name-brand firm.

## How many of them there are

Of 22,608 firms in this corpus, 12,458 have exactly one fund on record. That is 55 per cent — the single largest group by a wide margin, against 7,097 firms with two to four funds, 1,945 with five to nine and 1,108 with ten or more.

Treat that number carefully. "One fund on record" is not the same as "first-time manager". The window here is five years, so a firm that raised its debut in 2018 and its second in 2024 shows one fund and is not new. And a large share of single-fund entries are single-deal vehicles rather than funds at all.

Once those are stripped out, what remains is still the largest and least-covered part of the market. The lists everyone works from are built from press coverage, and a debut fund gets none.

## Separating a debut fund from an SPV

Both look like one filing by an unfamiliar name. Three things tell them apart.

**The name.** A vehicle named after a sponsor — anything containing "a series of" — is a deal, not a fund. So, usually, is a name that is a bare code or a company name followed by "SPV".

**The people.** A debut fund names one or two individuals as executive officers. An SPV frequently names an administrator's signatory, or a management entity rather than a person.

**The amount and the count.** An SPV typically shows a small amount and a handful of investors. A first fund shows a larger amount and more of them; the median investor count on a company filing in this corpus is six, and a fund raising from limited partners will usually exceed that.

## What to expect from the conversation

Emerging managers are reachable and slower. They are often still fundraising while investing, which means a yes can be contingent on their own next close, and reserves are thinner so follow-on support is less certain.

In exchange you get a partner with time, a small portfolio where you matter, and a decision that does not have to survive a partnership meeting of fifteen people. For a company at the earliest stage that trade is frequently the right one — and it is only available to founders who look somewhere other than the standard list.

## Where they cluster

Debut funds are not distributed like established ones. They appear wherever an operator has just exited or a senior investor has just left a bigger firm, which means they turn up in places the standard map does not cover — Austin, Miami, Lisbon, Bangalore — as often as on Sand Hill Road.

That is another reason location filtering beats fund-size filtering for early-stage founders. The nearest new manager is frequently more accessible than the most famous distant one, and public filings are the only place both appear on equal terms.

## The check to run before you approach

Look at the amount sold and the first-sale date together. A fund that filed eighteen months ago showing a small amount and no subsequent filing may never have completed its raise. That is not a reason to avoid it, but it is a reason to ask an early, direct question about how much they have to deploy — which a first-time manager will usually answer straightforwardly, because they are used to being asked.

## What the filing cannot tell you about them

Whether they have invested before at another firm, which is usually the thing that matters most. A first fund is often a fifth career, and the manager's track record sits under someone else's name.

The filing gives you the name; the track record has to come from asking, or from following that person's other appearances in the same data. If they show up as a director on companies backed years earlier, you have found the history the fund's own age conceals.`,
},
{
  slug: 'delaware-address-on-a-filing',
  title: 'The filing says Delaware. The fund is not in Delaware',
  topic: 'Reading filings',
  summary: 'Jurisdiction of incorporation and business address are different fields, and only one of them tells you where anybody works.',
  body: `A Form D carries two location-shaped facts and they rarely agree.

**Jurisdiction of incorporation** is where the entity is legally formed. For US funds and startups this is overwhelmingly Delaware, for reasons of corporate law that have nothing to do with geography. Around a third of the operating companies in a large filing sample are Delaware entities; a negligible share of them have anyone in the state.

**Business address** is where the filer says it can be contacted. That is the one that means something.

## Why directories get this wrong

It is easy to index whichever location field is populated and end up with thousands of funds apparently based in Wilmington. The result looks authoritative and sends founders to a state with almost no venture activity.

The same problem appears internationally. A Cayman Islands or Luxembourg jurisdiction on a fund filing is a structuring choice for its investors, not a statement about where the partners are. Plenty of filings show a Luxembourg entity with a New York business address — that is a New York fund.

## Resolving a location properly

Take the business address. Split it into city, state and country once, when the record is written, not when it is searched. A record whose address reads "Palo Alto, CA" contains the string "United States" nowhere, so a country page built by text search will silently miss it.

That resolution step is also where you catch ambiguity: "CA" is California far more often than it is Canada, and "UK" is the United Kingdom unless you are reading an Indian filing, where it is Uttarakhand.

## What to do with it

Filter on business address when you want to know who is nearby. Read jurisdiction only when you care about the legal structure — which, as a founder raising a round, you almost never do.

## The second trap: the address is real but not theirs

Getting jurisdiction out of the way solves half the problem. The other half is harder, because it involves an address that is genuine, current and still misleading.

Fund administrators and registered agents file on behalf of hundreds of unrelated entities from a single suite. In this corpus one Seattle address appeared on 12,420 filings; a Claymont, Delaware mail drop on 4,872; a Lynnwood, Washington suite on 2,788. Every one of those is a real street address that a real letter would reach. None of them is where the firm works.

Indexed naively, that produced a directory claiming 13,688 venture capital firms in Seattle. The correct figure, after rolling up vehicles and setting service addresses aside, is 181.

## Detecting a service address without a list

You do not need to know which companies provide these services. The pattern gives it away: an address occupied by more than a hundred otherwise unrelated firms is not an office, whatever it is.

A threshold does the work. Group by normalised street and city, count distinct entities, and treat anything above the threshold as a service address. In this dataset that flagged 2,888 investment firms and 1,125 companies — about 4 per cent of records, and the 4 per cent that was distorting every city ranking.

## What to do with them once flagged

Not delete them. The firms are real and the address is what the filing says, so it stays on the profile.

What changes is that they stop being placed. They no longer appear on city or state pages, because those pages make a claim — "these firms are here" — that is not true for them. Country is kept, because that part still holds.

The general principle is worth carrying beyond this dataset: a value can be accurate and still be the wrong answer to the question a page is asking. "Where is this firm's registered address" and "where is this firm" are different questions, and only one of them has an answer in the filing.

## Resolving a place, mechanically

Whatever dataset you are working with, the resolution has to happen once, on write, and be stored — not computed at search time.

Split the business address into city, state and country and store slugs for each. Text matching cannot substitute: a record reading "Palo Alto, CA" contains the string "United States" nowhere, so a country page built by searching text will silently omit it, and you will never see the omission because the page still returns results.

Two ambiguities are worth handling explicitly. Two-letter codes collide — "CA" is California far more often than Canada, "IN" is Indiana more often than India — so spelled-out names and aliases should be matched before bare codes. And a place segment can be a state in one country and a city in another, which matters the moment your URLs carry geography.

Get that right once and every place page, every count and every filter downstream is correct for free. Get it wrong and each of them is wrong in a different, hard-to-notice way.

## What the address is still good for

None of this makes the address useless — it makes it specific.

A real business address tells you which firms you can plausibly meet, which is the only cold-approach filter that reliably improves your odds. It tells you where a market is concentrated, which is worth knowing before you decide to raise locally or travel. And on a company rather than a fund, it is frequently the founder's own working address, which is a small but real signal about stage.

Read it as "where a letter would arrive", check it is not a service address, ignore the jurisdiction, and it is one of the most useful fields on the form.`,
},
];
