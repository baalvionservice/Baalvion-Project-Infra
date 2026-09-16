import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleReadingCasebook: LawArticle[] = [
  {
    id: 'lss-003',
    title: 'How to Read a Law School Casebook (Without Drowning)',
    slug: 'how-to-read-a-law-school-casebook',
    alphabet: 'H',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      "A casebook withholds the rule on purpose, and reading one at a uniform pace, cover to cover, is why the first month feels like drowning. What to look for changes by subject too -- a Contracts case and a Con Law case are not read for the same thing.",
    content: `<h2>The Casebook Is Not a Textbook</h2>
<p>Open a 1L reading assignment for the first time: a page range, three or four case names, forty-some pages, no summary telling you what any of it meant. That absence is by design. A casebook is a collection of edited judicial opinions, arranged so the rule gets reconstructed through class discussion rather than handed to you -- a method tracing back to Christopher Columbus Langdell at Harvard Law School in the 1870s. A hornbook or treatise does the opposite: it states the rule directly, with cases cited as support rather than presented as the main text. Students keep one as a supplement, not a replacement -- working out the rule yourself from edited case law is the skill being taught.</p>

<h2>Why Reading It Front-to-Back Doesn't Work</h2>
<p>The instinct in week one is to read a case like anything else: start at the first word, give every sentence the same weight, stop at the last. That burns hours for little payoff, because casebook editors do not treat every paragraph equally. The case opening a section -- the principal case -- establishes the rule; the shorter cases and note paragraphs after it usually test how far that rule stretches, or where it breaks. A one-paragraph note case makes a narrow point; it isn't competing with a fifteen-page principal opinion, and reading both at the same pace spends what's actually scarce on a Tuesday night: time.</p>

<h2>Read the Frame Before You Read the Facts</h2>
<p>A reported opinion tells you things before the first substantive sentence. The procedural posture -- an appeal from a jury verdict, a motion to dismiss, a certified question -- tells you what the court is actually allowed to decide, and identical facts read differently depending on which one it is. Court level matters too: a state supreme court opinion carries weight a trial-level ruling reprinted for illustration does not. The table of contents does quiet work as well -- the heading a case sits under is the editor telling you what doctrinal point it exists to prove.</p>

<h2>The Subject Changes What You're Reading For</h2>
<p>The habit that costs the most hours is reading every casebook the same way, because what decides the case is not the same thing course to course.</p>
<p>In <strong>Contracts</strong>, the facts mostly establish offer, acceptance, and consideration -- and once liability is settled, watch for a second rule later on: the measure of damages. Stopping at "was there a contract" misses that the court often spends as much text on the remedy.</p>
<p>In <strong>Torts</strong>, you're tracking a checklist -- duty, breach, causation, damages -- and a case is in the book because one link is contested, not all four. Find that element and the rest reads faster.</p>
<p>In <strong>Property</strong>, old rule and policy carry unusual weight: a case can turn on a rule rooted in feudal or colonial-era land law, and the reasoning for keeping or discarding it is usually the point, not the parcel dispute.</p>
<p>In <strong>Constitutional Law</strong>, the underlying facts are often the least important part. What matters is the test applied -- strict scrutiny, rational basis, a newly announced standard -- and which institution the majority says gets to decide. Thin facts can sit under an enormous opinion, close to the opposite of a typical Torts case.</p>
<p>In <strong>Civil Procedure</strong>, the dispute itself may barely matter -- the opinion can turn on the litigation stage and what a procedural rule requires there, independent of who is right on the merits.</p>

<h2>One Passage, Read Two Ways</h2>
<p>Here is the opening of <em>Hawkins v. McGee</em>, the 1929 New Hampshire case known to generations of Contracts students as the "hairy hand" case, exactly as the court wrote it:</p>
<blockquote>"The operation in question consisted in the removal of a considerable quantity of scar tissue from the palm of the plaintiff's right hand and the grafting of skin taken from the plaintiff's chest in place thereof. The scar tissue was the result of a severe burn caused by contact with an electric wire, which the plaintiff received about nine years before the time of the transactions here involved. There was evidence to the effect that before the operation was performed the plaintiff and his father went to the defendant's office, and that the defendant, in answer to the question, 'How long will the boy be in the hospital?' replied, 'Three or four days, not over four; then the boy can go home and it will be just a few days when he will go back to work with a good hand.' Clearly this and other testimony to the same effect would not justify a finding that the doctor contracted to complete the hospital treatment in three or four days. ... The only substantial basis for the plaintiff's claim is the testimony that the defendant also said before the operation was decided upon, 'I will guarantee to make the hand a hundred per cent perfect hand or a hundred per cent good hand.'"</blockquote>
<p style="font-size:0.9em;color:#666;">-- <em>Hawkins v. McGee</em>, 84 N.H. 114, 146 A. 641 (1929)</p>
<p>Read inefficiently, a student absorbs that paragraph at uniform speed: the burn, the exact age, the office visit, the "three or four days" exchange, a pause to puzzle out why it doesn't matter, then the guarantee line -- all at the same rate, with no sense of which sentence the opinion turns on.</p>
<p>Read for what the case is doing, it takes a fraction of the time. The burn and the graft are background. The court's own move is the tell: it walks through the "good hand" exchange and rules it out as prediction, not promise -- showing what a non-binding statement looks like so the next sentence lands harder by contrast. That next sentence is the one to underline: "I will guarantee to make the hand a hundred per cent perfect hand." That line is the entire contract claim -- everything before it shows what almost was a promise but wasn't, and everything after builds toward the damages rule that follows from treating it as one.</p>

<h2>What to Do With a Case Once You've Read It</h2>
<p>Margin notes beat a highlighter for the same reason skimming the frame beats reading cold: a highlighted page still has to be re-read in full, while a margin note -- "I" by the issue, "R" by the rule, a tag like "guarantee = warranty" at the top -- lets you find what you need without re-reading everything around it. A brief written afterward should be short enough to glance at before a cold call, not a transcription of the opinion. A hornbook entry on the same doctrine, read alongside a case that isn't landing, often resolves in five minutes what another read won't.</p>

<h2>Key Takeaways</h2>
<ul>
<li>A casebook withholds the rule on purpose -- you reconstruct it from edited opinions, unlike a hornbook or treatise.</li>
<li>Check the procedural posture, court level, and table-of-contents heading before reading the facts -- they signal what the case is there to prove.</li>
<li>What matters changes by subject: elements and remedy in Contracts, the contested link in Torts, old-rule-versus-policy in Property, the test and deciding institution in Con Law, litigation stage in Civ Pro.</li>
<li>Read to find the operative sentence, not at one uniform speed -- it's faster and gives a clearer answer if called on.</li>
<li>Margin notes you can scan later beat a highlighter you have to re-read in full.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Should I read a commercial case brief instead of the case itself?</h3>
<p>It can help you follow along and cut reading time, but leaning on it instead of the opinion risks missing details a professor might build a cold call or exam hypothetical around.</p>
<h3>How long should one case actually take to read?</h3>
<p>It depends on the subject and the case's length and role in the chapter -- a note case takes minutes, a long principal case much longer. Tracking your own time for a week or two tells you more than any fixed number.</p>
<h3>Is it normal to not fully understand a case the first time through?</h3>
<p>Yes. Comprehension builds across passes, and a second look after class discussion, or a hornbook check, often clarifies what the first read left murky.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: 'how-to-read-a-law-school-casebook',
    primarySources: [
      { label: 'Hawkins v. McGee, 84 N.H. 114, 146 A. 641 (1929), full opinion (H2O Open Casebook, Harvard Law School)', url: 'https://opencasebook.org/casebooks/13944-contracts/resources/1.1-hawkins-v-mcgee/' },
      { label: 'Touro Law School, "Case Reading"', url: 'https://www.tourolaw.edu/studentresources/1617' },
      { label: 'JD Advising, "How Do I Speed-Read Cases in Law School?"', url: 'https://jdadvising.com/how-to-speed-read-cases-in-law-school/' },
      { label: 'Brooklyn Law School Library, "1L Course Casebooks & Study Aids"', url: 'https://guides.brooklaw.edu/1l/casebooks_study_aids' },
    ],
  },
];
