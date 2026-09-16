import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const article1LSurvivalGuide: LawArticle[] = [
  {
    id: 'lss-002',
    title: '1L Survival Guide: A Month-by-Month First Year Timeline',
    slug: '1l-survival-guide-month-by-month-timeline',
    alphabet: '1',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      "Most 1L advice is scattered across a dozen different law school library pages, each written for that one school's calendar. This is the same year, laid out month by month, so you know what's actually coming before it lands on you.",
    content: `<h2>The Year Has a Shape, Even Though It Doesn't Feel Like It in Week One</h2>
<p>Nobody hands incoming 1Ls a real calendar. You get a reading assignment, a room number, and a vague sense that everything is graded on one exam at the end of the semester. It isn't chaos, though -- it's a two-semester structure that repeats at almost every ABA-accredited law school: fall runs late August through December finals, then a few weeks off, then spring runs January through finals in April or May. Nearly every school also runs the same seven first-year courses through that structure: Civil Procedure, Contracts, Torts, Criminal Law, Property, and Legal Research and Writing everywhere, and Constitutional Law at most schools (a handful push it into 2L). What follows is that calendar, filled in with what's actually due each month, not what one school's orientation packet says.</p>

<h2>August: Orientation, Then Straight Into Reading</h2>
<p>Orientation runs for roughly a week to ten days before classes start, and it's mostly logistics -- ID cards, section assignments, a welcome from the dean. The part that matters is smaller and easier to miss: an "Introduction to the Study of Law" reading packet or a first case assigned before day one. Read it. Your first cold call can land on day one or two, and the students who look prepared are usually just the ones who did that packet instead of skimming the syllabus. Most schools also give a short add/drop window in the first week -- use it to fix a scheduling conflict, not to chase a rumor about which professor is "easier."</p>

<h2>September: The Casebook Volume Turns Up</h2>
<p>This is when the actual workload lands -- briefing cases most nights across four or five courses. The outlining habits you build now are the ones you'll still be using in April. Career services programming starts here too, resume and cover letter workshops mostly, worth attending even though summer feels irrelevant in week three. Legal Research and Writing starts assigning smaller exercises before the first graded memo comes due, so don't let it slide because it isn't doctrinal.</p>

<h2>October: Midterms (Sometimes) and the First Deadline That Isn't an Exam</h2>
<p>Some 1L courses give a practice or low-stakes midterm around this point -- not all of them, and not every school, but treat one as free information about your exam-writing weaknesses rather than a grade to stress over. Your first graded legal writing memo is usually due sometime in October, and mid-October is a common point for career offices to start pushing 1Ls to book a first meeting about summer plans. You don't need a plan yet, you need to be on their radar.</p>

<h2>November: Second Memo, Exam Info, and Spring Registration</h2>
<p>A second, harder writing memo typically lands in November, often an appellate brief built on the first assignment. The registrar sends out exam schedules and room assignments around now -- your cue that finals are close enough to start real outlining. Spring registration opens too; 1L spring is usually fixed for you, so this is mostly informational, though some schools let you pick a section or an elective.</p>

<h2>December: Fall Finals, Then the Clock Starts on Summer Jobs</h2>
<p>Finals are almost entirely closed-book, issue-spotting exams worth most or all of your grade in each course, compressed into a two-to-three week stretch. It's the first time the semester's workload actually gets measured, and it's normal for that to feel disorienting either way it goes. On the other side of it: December 1st is the date many career offices open 1L summer applications, public-interest and government positions included, so the job search technically starts during your reading period.</p>

<h2>January: Spring Semester Begins, Same Rhythm, Higher Floor</h2>
<p>Spring starts within the first couple weeks of January, and the biggest difference from fall is that you're not starting from zero -- you already know how to brief a case and how your professors run a cold call. Many schools also open public-interest and government fair sign-ups around mid-January, with the fair itself in February, so don't wait until February to register.</p>

<h2>February: Public Interest and Government Fair Season</h2>
<p>This is when public-interest and government-focused 1Ls typically interview for summer positions, often at a regional or national fair rather than individual firm interviews. If you're aiming at a firm instead, on-campus interviewing for 1Ls is much thinner than the 2L OCI cycle -- most 1L firm hiring happens through direct applications and referrals, not a formal interview season.</p>

<h2>March: Spring Break, Then Clinic and Journal Prep</h2>
<p>Spring break sits in here, usually a week. Clinic applications for the following year often open around this point, so if you want a specific 2L clinic, check the deadline now rather than after break. It's also a reasonable time to look up the journal write-on format, even though the competition itself is still two months out -- knowing the format in advance saves time you won't have in May.</p>

<h2>April: Registering for 2L Fall, Finishing the Curriculum</h2>
<p>You'll get a registration guidance session and pre-registration for 2L fall classes sometime in April -- the first time you're picking your own courses instead of following a fixed 1L schedule. The coursework doesn't let up in the meantime; this is usually the heaviest reading month of the spring, right before finals swallow everything.</p>

<h2>May: Spring Finals, Then Straight Into Journal Write-On</h2>
<p>Spring finals run like December's, with the added weight of a full year's expectations behind them. The distinctive thing about May is what comes immediately after: journal write-on competitions at most schools open the week finals end and run one to three weeks, often over a working packet you have to turn around fast. If you're trying for a journal, block that window out before you know your exam schedule -- it will not feel like a good time, and you do it anyway.</p>

<h2>The Summer After 1L</h2>
<p>Whatever job you landed starts now -- the first stretch of the year that looks like practicing law instead of studying it. Firms that interview 1Ls directly, rather than through the 2L OCI process, often do it on a rolling basis through the summer and into early fall. It's also when 2L fall pre-registration gets finalized and, for journal members, when note-topic brainstorming typically begins.</p>

<h2>Key Takeaways</h2>
<ul>
<li>The 1L year is two semesters with a consistent shape at almost every US law school: fall from late August to December finals, spring from January to April or May finals.</li>
<li>The seven standard 1L courses -- Civil Procedure, Contracts, Torts, Criminal Law, Property, Legal Research and Writing, and (at most schools) Constitutional Law -- are close to universal, though section structure and electives vary.</li>
<li>1L summer job applications typically open December 1st, with public-interest and government fairs concentrated in February -- both land while you're recovering from fall finals or deep in spring coursework.</li>
<li>Journal write-on competitions run immediately after spring finals in May, not after a break, so plan around that before your exam schedule is even final.</li>
<li>April's 2L fall registration is the first time you choose your own courses -- treat it as the real end of the fixed 1L curriculum, not just paperwork.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Is the month-by-month timeline the same at every law school?</h3>
<p>The overall shape -- two semesters, finals in December and April/May, journal write-on right after spring finals -- holds at nearly every ABA-accredited school. Specific dates, whether a course gives a midterm, and how 1L summer recruiting is structured vary, so check your own registrar and career office calendar.</p>
<h3>Do all 1Ls take Constitutional Law in the first year?</h3>
<p>Most schools include it alongside Civil Procedure, Contracts, Torts, Criminal Law, Property, and Legal Research and Writing, but some teach it partly or entirely in the second year instead. Check your own school's 1L course list rather than assuming.</p>
<h3>When should I actually start thinking about 1L summer jobs?</h3>
<p>Career offices typically start programming -- resume workshops, initial advising meetings -- in September, and formal applications for many 1L summer positions open December 1st. Public-interest and government fair sign-ups often close in mid-January for a February fair, so "early spring" is already late for those tracks.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: '1l-survival-guide-month-by-month-timeline',
    primarySources: [
      { label: 'Brooklyn Law School, First-Year (1L) Timeline', url: 'https://www.brooklaw.edu/academics/student-timelines/1l-timeline/' },
      { label: 'Columbia Law School, 1L Roadmap', url: 'https://www.law.columbia.edu/community-life/student-life/roadmaps/1l-roadmap' },
      { label: 'University of Virginia School of Law, Course Descriptions for Required 1L Classes', url: 'https://www.law.virginia.edu/academics/course-descriptions-required-1l-classes' },
      { label: 'Harvard Law Review, Writing Competition', url: 'https://harvardlawreview.org/writing-competition/' },
    ],
  },
];
