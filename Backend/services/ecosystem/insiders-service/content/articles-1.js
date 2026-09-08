'use strict';
// Articles exist to answer what the directory's data cannot. Each is grounded in the mechanics of
// the filings behind the site, so it says something the reader cannot get from a generic guide.
module.exports = [
{
  slug: 'what-a-form-d-filing-tells-you',
  title: 'What a Form D filing tells you — and what it does not',
  topic: 'Reading filings',
  summary: 'Every US private fund and most companies raising privately file one. It is the backbone of this directory, and knowing its four blind spots will save you a wasted approach.',
  body: `Form D is a notice, not an application. A fund or company files it within 15 days of first selling securities in a private round, and the SEC does not approve it — it simply records it. That distinction matters more than anything else on the form.

## What it does tell you

The filer's legal name, business address and telephone. The type of vehicle: venture capital fund, private equity fund, hedge fund, or an operating company. The total amount being offered, the amount sold so far, and the minimum any one investor put in. The date of first sale. And the executives, directors and promoters connected to it, by name.

That last field is the one most people overlook. It is how you learn that a partner at one fund also sits on four company boards — a connection no marketing page publishes.

## The four blind spots

**No email, no website.** Form D asks for a business address and a phone number, nothing more. Any directory showing you an investor's email has obtained it elsewhere.

**No thesis, no sector, no stage.** The form has no field for what a fund likes to back. If a profile tells you a fund is "seed-stage fintech-focused", that came from somewhere else — check where.

**No cheque size.** The minimum investment field is about the fund's own investors, not what the fund writes into companies. They are unrelated numbers, and conflating them is the most common error in this whole category.

**"Sold" is a snapshot, not a running total.** A fund files, then files again as it closes more. Add the numbers up and you will double count.

## How to use it anyway

Treat a Form D as proof of activity and a route to a name. A fund that filed three months ago is deploying. A fund whose last filing is from 2021 may have gone quiet. The people named on the filing are real and current as of that date, and the address is where the firm actually sits.

What it will never give you is permission to be contacted. A filing is a regulatory obligation, not an invitation.

## What the numbers look like across a real corpus

Abstractions are easy to argue with, so here is the shape of 83,076 fund filings covering five years.

Two vehicle types dominate: 45,339 venture capital funds and 37,737 private equity funds. Hedge funds and the catch-all "other investment fund" category were left out of that count deliberately, because they are mostly liquidity vehicles, insurance separate accounts and portfolio sleeves — real filings, but not entities a founder can raise from.

The amounts are smaller than the headlines suggest. Among venture funds reporting a non-zero figure, the lower quartile had sold $124,401, the median $374,020 and the upper quartile $2,000,000. Those are amounts *at the moment of filing*, not final fund sizes, which is exactly the point: a fund files when it makes its first sale, often a year or more before it finishes raising. Read a Form D as an opening balance.

## The de-duplication problem nobody mentions

Those 83,076 filings do not describe 83,076 funds. They describe roughly 22,608 firms.

The gap comes from three things. About 20,054 filings — a quarter of the corpus — are amendments, restating a raise as it progresses. Large firms file parallel vehicles for onshore, offshore, levered and currency-specific investors, so one product can generate four filings. And more than half the raw filings are series-LLC vehicles named after their sponsor: "Su-1217 Fund I, A Series Of Thicket Ventures" is a single deal, and Thicket Ventures is the firm.

Treat each filing as a fund and you will report a market several times its real size. That error is common enough in commercial datasets to be worth checking whenever you see a suspiciously round "number of active investors".

## A short checklist before you act on a filing

- **Is this the latest filing for this entity?** If not, its numbers are superseded.
- **Is it an amendment?** Then the amount shown includes everything sold before it.
- **Does the name contain "a series of"?** Then you are looking at one deal, not a firm.
- **Is the address a real office?** Hundreds of unrelated entities file from a handful of fund-administrator suites; one Seattle address alone accounted for 12,420 filings.
- **How old is it?** Anything past about eighteen months tells you a firm existed, not that it is investing.

## Why the form exists at all

Regulation D lets a company raise privately without registering the offering, which is what makes venture capital practical. The trade is disclosure: file a short notice so the regulator knows the exemption was used. That is the whole bargain, and it explains every gap in the form. Nothing on it is designed to help you fundraise, which is why it is honest, and why it is incomplete.

## Three questions the form answers better than anything else

**Does this firm exist and is it real?** A Form D is filed with a federal regulator under penalty of perjury by a named signatory. It is a far stronger existence proof than a website, and it is the reason a directory built on filings has a different error profile from one built on self-reported profiles. The failure mode here is staleness, not invention.

**Who is connected to it?** The related-persons block names executives, directors and promoters. Across the corpus behind this directory that produced 56,467 named individuals attached to investment firms and 219,803 attached to companies. Those names are the raw material for every warm introduction you will ever get, and they are free.

**Where does it actually sit?** The business address is the firm's own answer to "where can we reach you", which is more reliable than an about page. It needs one sanity check — a handful of fund-administrator suites account for thousands of filings apiece — but for the overwhelming majority it is a real office.

Nothing else in public data answers all three at once, which is why the form is worth learning to read despite everything it leaves out.`,
},
{
  slug: 'last-filing-date-matters-more-than-aum',
  title: 'Why a fund’s last filing date beats its AUM',
  topic: 'Choosing who to approach',
  summary: 'Assets under management tells you how big a firm got. The date of its most recent filing tells you whether it is still buying.',
  body: `Founders filter investor lists by fund size because it is the number everyone quotes. It is close to useless for deciding who to approach.

A $2bn fund raised in 2019 has probably deployed most of its capital and is either raising its successor or winding down new activity. A $40m fund that closed six months ago is actively looking for companies right now. The second one will take your meeting.

## What the filing date actually signals

A Form D filing means capital was raised on or around that date. A fund raising a new vehicle is, by definition, about to deploy it. That is the moment its partners are most receptive to new deal flow, and it is visible in public records months before it appears in any newsletter.

Sorting by most recent filing surfaces firms in that window. Sorting by assets under management surfaces firms that were successful five years ago.

## The pattern to look for

Established firms file in clusters — a flagship fund, a growth vehicle and an opportunities fund within weeks of each other. That cluster is a firm mid-raise, and it means a fresh mandate.

A single filing from a firm with no prior history is a first-time fund. Those are harder to close and slower to decide, but they are also hungry, and they are usually invisible on the lists everyone else is working from.

## What the date cannot tell you

It cannot tell you the fund still has money left. A fund that filed 18 months ago may have deployed everything in a hot quarter. It cannot tell you the fund invests in your sector. And it cannot tell you the fund is open to cold approaches — most are not.

Use it to rank, not to decide. It is the best single ordering signal in public data, and it is the one almost nobody uses.

## What the distribution looks like

Across 22,608 firms compiled from five years of filings, the spread of fund counts is steep: 12,458 firms have exactly one fund on record, 7,097 have two to four, 1,945 have five to nine, and 1,108 have ten or more.

That shape matters for how you read a date. For the 12,458 single-fund firms, the filing date is the whole story — it is both first and last, and it tells you when that firm came into existence as an investor. For the 1,108 firms with ten or more vehicles, a recent date is routine and less informative; those firms are always raising something. The signal is strongest in the middle band, where a new filing genuinely marks a new mandate.

## Reading a cluster

Established firms rarely file once. They file a flagship fund, a growth vehicle and sometimes an opportunities fund within weeks of each other, because the whole family closes together.

When you see three or four filings from related entities inside a single quarter, you are looking at a firm that has just refreshed its capital across strategies. That is the widest its aperture will be for the next couple of years, and it is visible months before any announcement.

The reverse pattern is also readable. A firm whose filings stop is either between funds — normal, and it will resume — or has quietly wound down. You cannot tell which from the record alone, which is worth remembering before you write off a name.

## What "recent" actually means

Be careful with the word. A filing from three months ago means capital was raised three months ago. It does not mean capital remains: a fund that closed in a hot market can be substantially committed inside a year.

A reasonable rule is that the twelve months after a first-sale date are the highest-probability window for a new relationship, the second year is workable, and beyond that you are relying on reserves, which are allocated to existing portfolio companies first.

## Combining it with the other fields

Recency on its own is a blunt instrument. It becomes sharp when you stack it with two other things the filings give you for free: the sponsor's location, so you can find firms you can actually meet, and the people named on the filing, so you know which partner to be introduced to.

Recent, nearby, and with a named partner who already sits on boards in your sector — that is a shortlist of maybe fifteen firms, and it will outperform a list of five hundred sorted by fund size every time.

## A worked example

Take a firm with thirteen funds on record, first filing in early 2022, most recent at the end of April 2026, headquartered on Sand Hill Road. Two individuals are named across those filings, both as executive officers, appearing on seven filings each.

Read the AUM and you learn it is large. Read the dates and you learn something more useful: it filed within the last few months, so it is deploying now; it has filed consistently for four years, so it is not between funds; and the same two people appear throughout, so you know exactly who signs off and who to be introduced to.

That is four actionable facts from a set of dates and names, and none of them required a subscription.

## The counter-case

There is one situation where recency misleads. A firm that files frequently because it runs many small single-deal vehicles will always look recent, and its "activity" is really its administrator's throughput rather than a new mandate.

You can spot these: the entity names carry a sponsor suffix, the amounts are small, and the filings cluster tightly. Roll them up to the sponsor and the picture corrects itself — which is exactly what a directory should do for you before you ever see the list.`,
},
{
  slug: 'why-a-filing-shows-no-cheque-size',
  title: 'Why almost no directory can show you a fund’s cheque size',
  topic: 'Reading filings',
  summary: 'The number founders most want to filter on is the one public filings never contain. Here is what the "minimum investment" field really means.',
  body: `Search any investor directory for "seed investors writing $250k cheques" and you will get results. Ask where that number came from and the answer is almost always: someone typed it in.

Form D contains a field called minimum investment accepted. It looks like a cheque size. It is not.

That field records the smallest amount the *fund* will accept from one of *its own* investors — a limited partner buying into the fund. A venture fund might set a $250,000 minimum for LPs while writing $2m first cheques into companies. The two numbers have no relationship at all.

## So where do published cheque sizes come from?

Three places. The firm's own website, which is marketing and often out of date. A survey the firm filled in. Or an estimate derived from reported round sizes, which attributes the whole round to one investor and is wrong whenever a round had more than one participant — which is most rounds.

None of those are wrong to use. But a directory that presents them with the same confidence as a filed figure is telling you something it does not know.

## What you can infer honestly

Fund size constrains cheque size. A $50m fund making 25 investments averages $2m per position including follow-on reserves, so first cheques are typically well under half that. A $2bn fund cannot write $200k cheques — the position would be too small to matter.

That reasoning gets you an order of magnitude, which is usually enough to know whether you are in the right conversation. It does not get you a number, and anyone quoting you a precise one from public data is guessing.

On this site, cheque size shows as "not disclosed" wherever the filings do not state it. That is less satisfying than a number. It is also the truth.

## Working the arithmetic properly

Since no filing states a cheque size, the honest approach is to derive a range and be explicit that it is derived.

Start with fund size. A venture fund typically makes 20 to 35 core investments and holds back 40 to 60 per cent of the fund for follow-ons. So a $60m fund deploys roughly $27m in first cheques across about 25 companies — call it $1m average, with the range running from perhaps $400k to $2.5m depending on stage and conviction.

Run the same arithmetic on a $600m fund and the first cheque lands near $10m. Run it on a $12m fund and it lands near $200k. The method is crude and it is still more useful than a number somebody typed into a form three years ago.

## Where fund size itself comes from

The amount sold on the most recent filing is the best public proxy. It understates the final close, sometimes badly — a fund filing on its first close might report a third of what it eventually raises. Treat it as a floor.

Across venture funds reporting a non-zero amount, the median at filing was $374,020 and the upper quartile $2,000,000, which tells you most filings in the corpus are small vehicles and single-deal SPVs rather than institutional funds. Filter to firms with several funds on record and the picture changes completely. Whichever population you are looking at, know which one it is.

## The stage cross-check

A fund's stated stage, where it publishes one, constrains the cheque more tightly than fund size does. Pre-seed cheques cluster between $100k and $500k almost regardless of fund size, because ownership targets at that stage are met with small amounts. Series A cheques cluster between $2m and $8m. A large fund writing pre-seed is usually doing so through a dedicated small vehicle, which will have filed separately — and that filing is findable.

## What to do when you genuinely cannot tell

Ask. "What size cheque do you typically write at seed?" is a normal opening question and no investor is offended by it. The information is free in a first conversation and unavailable anywhere in public data, which is a reasonable trade.

What you should not do is build a shortlist by filtering on a cheque-size column and never notice that the column was a guess.

## Why this matters more than it sounds

Cheque size is the field founders filter on first, so an unreliable value there does more damage than an unreliable value anywhere else. It does not produce a slightly wrong list; it produces a confidently wrong one, and confidence is what stops you double-checking.

The failure is asymmetric too. Filtering out a fund that would have written your cheque costs you a relationship you will never know you missed. Filtering in a fund that never writes at your size costs you an email. Bias your filters wide.

## What a directory owes you here

Three things, and they are all about labelling rather than data.

Say where a number came from. A figure from a filing, a figure from a firm's own website and a figure someone estimated are three different kinds of claim and should not be rendered identically.

Show absence as absence. "Not disclosed" is a real answer and a useful one; a blank cell or a zero is not.

Never derive a precise number from an imprecise method. "$1m–$2.5m, estimated from fund size" is honest. "$1.4m" is not, no matter how it was calculated.

## The one number that is real

There is a cheque size in the filings, and it is worth naming precisely so you can ignore it correctly.

The minimum investment accepted field is a real, filed figure. It is the smallest subscription the fund will take from a limited partner. On a large institutional fund it is often $1m or more; on a retail-adjacent vehicle it can be $25,000. It tells you something genuine about who the fund raises from, and nothing whatsoever about what it invests.

If you are a founder, it is noise. If you are an allocator, it is the most useful number on the form. Same field, opposite value, depending on which side of the table you sit — which is a decent summary of why generic investor databases satisfy nobody.`,
},
{
  slug: 'indefinite-offering-explained',
  title: 'The filing says the offering is $0. That is not a mistake',
  topic: 'Reading filings',
  summary: 'Roughly half of all Form D filings report a total offering of zero. It means the opposite of what it looks like.',
  body: `Pull a large sample of Form D filings and you will find that a striking share report a total offering amount of $0 — around 15,000 of the 35,000 fund filings in a recent five-year window.

Zero does not mean the fund raised nothing. It means the fund declined to state a ceiling.

## Indefinite offerings

Regulation D lets a filer describe an offering as indefinite: they are not committing to a target and will keep accepting subscriptions. In the structured data the SEC publishes, that choice is encoded as a zero in the offering-amount column. The amount *sold* is reported normally.

So a filing reading "$0 offered, $340m sold" is a fund that raised $340m against no stated cap. Read literally, the numbers look absurd. Read correctly, they describe an open-ended vehicle doing well.

## Why it matters when you are comparing funds

Any tool that sorts on offering amount will rank these funds last, because zero sorts below everything. Half the market disappears from the top of your list, and it is not a random half — evergreen vehicles, continuation funds and larger managers are over-represented among indefinite filers.

If you are building a shortlist, sort on amount *sold* instead. That field is populated consistently and means what it appears to mean.

## The same trap, smaller

The minimum-investment field behaves the same way: zero means "none specified", not "free". Rendering it as "$0" implies a fund with no minimum, which is a different and much rarer thing.

Both are examples of a general rule for public filing data: a zero in a numeric column is usually an unanswered question, not a measured value.

## How common it actually is

In a corpus of 83,076 fund filings, 33,981 report a total offering amount of zero. That is 41 per cent — not an edge case, and not evenly distributed.

Evergreen vehicles, continuation funds and larger managers are heavily over-represented among indefinite filers, because an open-ended structure is a choice that requires scale to be worth making. So any tool that sorts on offering amount is not just losing 41 per cent of the market at random; it is losing a systematically more established slice of it.

## Why filers choose it

Stating a target is a commitment of sorts. A fund that announces $200m and closes at $90m has published its own shortfall. Filing an indefinite offering avoids that, and for a vehicle that genuinely has no cap — an evergreen fund taking subscriptions continuously — it is simply the accurate answer.

There is also a practical reason: amending a Form D to raise a stated cap is administrative work. Filing indefinitely once removes the need.

## The fields that still work

Amount sold is reported consistently whether or not a cap was stated, and it is populated on essentially every filing that has closed money. Sort and filter on that.

Date of first sale is equally reliable, and combined with amount sold it gives you the two things you actually want: how much, and when.

## The same encoding, three other places

Zero-as-null is a habit in this dataset, not a one-off.

The minimum-investment field uses it: zero means no minimum was specified, not that the fund accepts a dollar. Rendering it as "$0" invents a fund with no floor, which is a rare and different thing.

Investor count behaves similarly on filings made before any sale has occurred. And in the company data, a revenue range of "Decline to Disclose" is the most common answer by a wide margin, which is a refusal rather than a measurement.

The general rule holds across public filing data: a zero in a numeric column is usually an unanswered question. Treat it as null and your averages, your sorts and your conclusions all stop quietly lying to you.

## How to sanity-check any filing dataset in two minutes

Whether you are using this directory or another one, three quick tests will tell you whether whoever built it read the documentation.

**Count the zeros.** If a meaningful share of offering amounts are exactly zero and they are being displayed as "$0", the indefinite-offering convention has not been handled.

**Look at the biggest city.** If one city holds an implausible number of firms, service addresses are being treated as offices. A single fund-administrator suite can account for thousands of filings.

**Search for a fund you know.** If a well-known firm appears five or six times with near-identical names, amendments and parallel vehicles are not being rolled up, and every aggregate figure in that dataset is inflated.

None of these require access to the underlying files. They are all visible from the front page of whatever tool you are evaluating, and each one has taken a real dataset down in the past.

## Why the SEC encodes it this way

The structured datasets the SEC publishes are a flattened view of an XML submission, and the submission itself has a checkbox for "indefinite" alongside a numeric field for the amount. Flattening a checkbox and a number into one column forces a sentinel value, and zero is the one that was chosen.

Knowing that explains the behaviour rather than just documenting it, and it tells you where else to expect the same pattern: anywhere a form offers a choice between "a value" and "none of the above", the flattened data will carry a sentinel rather than a null. Once you look for it you will find it in the minimum-investment field, in revenue ranges, and in the sale-date field on offerings that have not yet occurred.

## The practical upshot

Do not filter on offering amount. Do not average it. Do not rank by it.

Filter on amount sold, rank by filing date, and treat every zero in the corpus as a question the filer declined to answer. Those three habits will keep you closer to the truth than any amount of additional data.`,
},
];
