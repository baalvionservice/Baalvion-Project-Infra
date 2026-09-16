import type { LawArticle } from '../law-content';
// Articles 2-10 of the Law School Success vertical, each researched and
// drafted independently -- see the individual lss-0xx files for sourcing.
import { article1LSurvivalGuide } from './lss-002-1l-survival-guide';
import { articleReadingCasebook } from './lss-003-reading-a-casebook';
import { articleLegalResearchBeginners } from './lss-004-legal-research-beginners';
import { articleColdCalling } from './lss-005-cold-calling';
import { articleCommonLawVsCivilLaw } from './lss-006-common-law-vs-civil-law';
import { articleThinkLikeALawyer } from './lss-007-think-like-a-lawyer';
import { articleHowToBriefACase } from './lss-008-how-to-brief-a-case';
import { articleHowToOutline } from './lss-009-how-to-outline';
import { articleLegalWritingBasics } from './lss-010-legal-writing-basics';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const lawSchoolSuccessArticles: LawArticle[] = [
  {
    id: 'lss-001',
    title: 'How Many Hours Should You Actually Study in Law School?',
    slug: 'how-many-hours-should-you-study-in-law-school',
    alphabet: 'H',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      "The ABA's accreditation formula computes to roughly 45 hours a week. A 2023 survey of 13,000+ students found the real average closer to 31. Here's why both numbers are real, and what to actually do with them.",
    content: `<h2>The Official Number Is Not the Real Number</h2>
<p>Every law school catalog quotes the same regulatory line, and almost nobody reads it closely enough to do the math. The American Bar Association's Standard 310(b)(1) defines a credit hour as "not less than one hour of classroom or direct faculty instruction and two hours of out-of-class student work per week" over a fifteen-week semester. Run that formula against a normal first-year course load and it produces a number most incoming 1Ls have never actually seen written down.</p>

<h2>What the ABA's Formula Actually Adds Up To</h2>
<p>First-year credit loads vary by school, but they cluster in a narrow band. Georgetown Law's required 1L curriculum totals 30 credits across the year -- roughly 15 per semester. The University of Georgia runs 16 credits in the fall and about 12.5 in the spring. Wake Forest caps first-years at 16 credits per term. Take a representative 15-credit semester and apply Standard 310 directly:</p>
<ul>
<li>15 hours of class time per week (the classroom half of the formula)</li>
<li>30 hours of "out-of-class student work" per week (the two-hour multiplier)</li>
<li>45 hours per week, minimum, by the ABA's own accreditation math</li>
</ul>
<p>That is not a study tip or a suggestion from an academic support office. It is the floor a law school's curriculum has to clear to keep its accreditation. A 16-credit semester pushes the same formula past 48 hours a week.</p>

<h2>What Students Actually Report</h2>
<p>The regulatory floor and lived experience turn out to be two different numbers. The Law School Survey of Student Engagement -- run by Indiana University's Center for Postsecondary Research and covering more than 13,000 students across 75 law schools in its 2023 administration -- asked first-year students to report their own weekly hours directly. Non-first-generation 1Ls reported studying 31 hours a week; first-generation 1Ls reported 32, alongside seven hours of paid work per week versus five for their non-first-generation classmates.</p>
<p>Put the two figures side by side and there's a real gap: a 45-hour accreditation formula against a 31-to-32-hour self-reported average, even before class time is added back in. Neither number is wrong. They're measuring different things.</p>

<h2>Why the Gap Exists</h2>
<p>The ABA's "two hours out-of-class for every hour in class" formula was written as an accreditation floor, not a productivity target -- it has to hold for the slowest reader in the slowest course, because that's what accreditation math is for. It doesn't know that briefing your tenth contracts case takes a fraction of the time your first one did, or that outlining condenses a semester of reading into something you can actually review before an exam instead of re-reading all of it.</p>
<p>The survey number has its own gap in the other direction: it's self-reported, and self-reported study time is a notoriously soft measurement -- a student counting "reading with my phone next to me" differently from a student who doesn't. It also averages over a full semester, including the slower weeks and the lighter ones, rather than describing any single week.</p>
<p>The honest reading of both numbers together: the ABA's 45 hours is what the curriculum is built to require if you read at a standard pace with no efficiency gains. The 31-to-32-hour average is what students who've developed real reading and outlining efficiency actually spend. The distance between them is, in a real sense, the value of getting better at reading a casebook and outlining early -- not a sign that either figure is fake.</p>

<h2>A Realistic Way to Think About Your Own Hours</h2>
<p>Neither number is a schedule you should copy. A few things are worth taking from both:</p>
<ul>
<li><strong>Budget closer to the ABA's number in your first month.</strong> Reading speed and case-briefing efficiency are skills you don't have yet in week one -- the accreditation formula's pace is a more honest starting estimate than the survey average, which reflects a semester's worth of students who've already built that skill.</li>
<li><strong>Track your own hours for two weeks before assuming either number applies to you.</strong> The gap between first-generation and non-first-generation students in the same survey (32 vs. 31 hours studying, 7 vs. 5 hours working) is a reminder that "average" hides real variation in how much outside-of-class time people actually have available.</li>
<li><strong>Hours are a weak proxy for the thing that actually matters on an exam,</strong> which is whether you can retrieve and apply what you read -- not how long you sat with it open.</li>
</ul>

<h2>Key Takeaways</h2>
<ul>
<li>ABA Standard 310 requires a minimum of two hours of out-of-class work per credit hour per week, which works out to roughly 45 hours a week total for a typical 15-credit 1L semester.</li>
<li>The 2023 Law School Survey of Student Engagement (13,000+ students, 75 schools) found first-year students self-reporting 31-32 hours of actual weekly study time, separate from class hours.</li>
<li>The gap between the two numbers reflects reading and outlining efficiency built up over a semester, not an error in either figure.</li>
<li>Budgeting closer to the higher, ABA-based estimate in your first month is more realistic than assuming the lower survey average from day one.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Is 45 hours a week normal for a 1L?</h3>
<p>It's the ABA's accreditation-formula ceiling for a 15-credit semester, not a report of what most students actually spend. Treat it as an upper-bound planning number for your first few weeks, before your reading speed catches up.</p>
<h3>Does the number of hours matter more than which hours?</h3>
<p>The 2023 survey measures total weekly hours, not when they happen, but case-reading and outlining are both tasks where consistent daily time outperforms the same total hours crammed into two long sessions -- spaced repetition of the material is what actually builds exam recall.</p>
<h3>Do 2L and 3L students study as much as 1Ls?</h3>
<p>The 2023 Law School Survey of Student Engagement data cited here covers first-year students specifically; it doesn't report a 2L/3L breakdown, so there isn't a directly comparable sourced figure for upper-level students in this dataset.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 6,
    views: 0,
    featured: false,
    imageSeed: 'how-many-hours-should-you-study-in-law-school',
    primarySources: [
      { label: 'ABA Standard 310, Determination of Credit Hours', url: 'https://www.americanbar.org/groups/legal_education/resources/standards/' },
      { label: '2023 Law School Survey of Student Engagement (LSSE), Indiana University Center for Postsecondary Research' },
    ],
  },
  ...article1LSurvivalGuide,
  ...articleReadingCasebook,
  ...articleLegalResearchBeginners,
  ...articleColdCalling,
  ...articleCommonLawVsCivilLaw,
  ...articleThinkLikeALawyer,
  ...articleHowToBriefACase,
  ...articleHowToOutline,
  ...articleLegalWritingBasics,
];
