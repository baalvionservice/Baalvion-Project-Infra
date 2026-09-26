import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleHowToBriefACase: LawArticle[] = [
  {
    id: 'lss-008',
    title: 'How to Brief a Case: Annotated Examples Across 4 Subjects',
    slug: 'how-to-brief-a-case-annotated-examples',
    alphabet: 'H',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      'Every guide to briefing a case hands you the same five headings and no example. Here are four actual briefs -- Palsgraf, Hadley v. Baxendale, Pierson v. Post, and Marbury v. Madison -- showing how the same format shifts its weight depending on the subject.',
    content: `<h2>The Checklist Isn't the Hard Part</h2>
<p>Facts, Issue, Rule, Holding, Reasoning. Every legal-writing handbook and study-aid site lists the same five headings and calls it a case brief. The headings aren't wrong -- they're just not what trips up a first-semester student. The trouble is not knowing, subject by subject, which of the five sections carries the weight. A Torts brief and a Property brief built on the same template read differently to a professor who's graded a thousand of them, because the two subjects reward different things. The only way to see that is actual briefs, not another checklist.</p>
<p>Below are four briefs of cases nearly every 1L reads first semester -- one each from Torts, Contracts, Property, and Constitutional Law. Same five headings each time; what changes is where the work happens.</p>

<h2>Torts: Palsgraf v. Long Island Railroad Co. (N.Y. 1928)</h2>
<p><strong>Facts:</strong> Helen Palsgraf stood on a Long Island Railroad platform when a man carrying a package ran to catch a departing train. Two guards helped him aboard; he dropped the package, which held fireworks. It exploded on the tracks, and the shock allegedly knocked over scales at the far end of the platform, injuring Palsgraf.</p>
<p><strong>Issue:</strong> Whether the guards owed Palsgraf a duty of care, given that their carelessness toward the man with the package created no apparent danger to her.</p>
<p><strong>Rule:</strong> Negligence is a wrong defined relative to the person harmed; a defendant is liable only to plaintiffs within the foreseeable zone of danger.</p>
<p><strong>Holding:</strong> Reversed and dismissed. The railroad was not liable to Palsgraf.</p>
<p><strong>Reasoning:</strong> Cardozo, for the majority, reasoned that "the risk reasonably to be perceived defines the duty to be obeyed." A guard helping a man board with an ordinary-looking package signaled no danger to a woman standing well down the platform, so it wasn't negligence toward Palsgraf. Judge Andrews's dissent argued duty runs to the world at large, and the operative question is proximate cause instead -- whether the harm followed in an unbroken line from the act.</p>
<p>A Torts brief needs its Reasoning doing the work. The Rule is one sentence; Cardozo's application of it, against Andrews's rejection of the whole framing, is where the case lives.</p>

<h2>Contracts: Hadley v. Baxendale (Ct. Exch. 1854)</h2>
<p><strong>Facts:</strong> Hadley ran a mill in Gloucester. When its crankshaft broke, he hired Baxendale, a carrier, to take it to Greenwich so a new one could be cast from it as a pattern. Baxendale's clerk promised next-day delivery; through the carrier's neglect, delivery was delayed several days, and the mill sat idle the whole time. Hadley sued for the lost profits.</p>
<p><strong>Issue:</strong> What losses flowing from a breach of contract a plaintiff can recover.</p>
<p><strong>Rule:</strong> Damages are recoverable if they arise naturally -- in the usual course of things -- from the breach, or if they were reasonably within both parties' contemplation at contracting, because the special circumstances were communicated to the defendant.</p>
<p><strong>Holding:</strong> Hadley could not recover his lost profits.</p>
<p><strong>Reasoning:</strong> Baron Alderson reasoned that a carrier told only that a broken shaft needed delivery had no way to know the mill would stand idle until it returned -- plenty of mills kept a spare. Hadley never said this one had none, so the lost profits weren't foreseeable under either half of the test.</p>
<p>Contracts, more than the others here, needs the Rule quoted near-verbatim -- exam patterns test which Hadley prong applies, and "arising naturally" versus "specially communicated" is the entire fight.</p>

<h2>Property: Pierson v. Post (N.Y. Sup. Ct. 1805)</h2>
<p><strong>Facts:</strong> Post was hunting a fox with hounds on an open beach. Pierson, who knew Post was in pursuit, intercepted the fox, killed it, and carried it off. Post sued in trespass before a justice of the peace and won; Pierson appealed.</p>
<p><strong>Issue:</strong> Whether pursuing a wild animal, without capturing it, gives the pursuer a legal right against someone who kills or captures it first.</p>
<p><strong>Rule:</strong> Title to a wild animal requires occupancy -- actual capture, mortal wounding, or trapping that deprives it of its natural liberty. Pursuit alone does not establish possession.</p>
<p><strong>Holding:</strong> Reversed. Pierson, not Post, held title to the fox.</p>
<p><strong>Reasoning:</strong> Justice Tompkins's majority reached for civilian and natural-law authorities -- Justinian, Puffendorf, Bynkershoek -- to define occupancy, settling on a bright-line capture rule partly because it's administrable: a rule turning on how close a chase came would move every dispute into a fight over distance. Justice Livingston's dissent argued custom among hunters already protected a pursuer against this kind of interloper.</p>
<p>The Property brief leans on context the others don't need as much: the court frames this as "a novel and nice question," decided by picking among historical authorities rather than settled precedent. Drop that the rule comes from Roman and continental sources and you lose why the case is taught as a first-possession problem, not a fox story.</p>

<h2>Constitutional Law: Marbury v. Madison (1803)</h2>
<p><strong>Facts:</strong> In his final days in office, President Adams appointed a slate of judicial officers, including William Marbury as a justice of the peace for D.C., and the Senate confirmed them. Some commissions, including Marbury's, went undelivered before Adams's term ended, and incoming President Jefferson had his Secretary of State, James Madison, withhold them. Marbury sued directly in the Supreme Court for a writ of mandamus, under Section 13 of the Judiciary Act of 1789.</p>
<p><strong>Issue:</strong> Three questions, in sequence -- does Marbury have a right to the commission; does the law give him a remedy; and is mandamus from the Supreme Court that remedy.</p>
<p><strong>Rule:</strong> The Constitution defines the Supreme Court's original jurisdiction, and Congress cannot enlarge it by ordinary legislation; where a statute conflicts with the Constitution, the Constitution governs.</p>
<p><strong>Holding:</strong> Marbury had a right to the commission and the law provided a remedy in principle, but Section 13's grant of original mandamus jurisdiction exceeded what Article III allows, so the Court had no power to issue the writ.</p>
<p><strong>Reasoning:</strong> Marshall answered the first two questions for Marbury -- the commission vested on signing and sealing, and the law furnishes a remedy for a vested right. On the third, rather than grant the writ, he held Section 13 unconstitutional for expanding the Court's jurisdiction beyond Article III's list, since "it is emphatically the province and duty of the judicial department to say what the law is."</p>
<p>A Con Law brief needs this three-part structure intact -- the outcome looks backwards if the first two answers get dropped. Property and Torts can compress the issue to one sentence; here the sequence is the argument.</p>

<h2>What Actually Changes Brief to Brief</h2>
<p>Line the four up and the differences aren't in the format -- they're in which section absorbs the difficulty. Palsgraf's Reasoning carries a doctrinal fight the Rule can't show. Hadley's Rule has to be worded almost verbatim. Pierson's Facts and Reasoning need the historical framing a Property professor will cold-call on. Marbury's Issue has to keep its three sub-questions in order, or the case stops being about judicial review at all. Copying five headings onto every case doesn't capture that; reading each case for what it's arguing about does.</p>

<h2>Key Takeaways</h2>
<ul>
<li>The five-part format (Facts/Issue/Rule/Holding/Reasoning) stays the same across subjects; what changes is which section carries the weight.</li>
<li>Torts (Palsgraf v. Long Island Railroad Co., 248 N.Y. 339 (1928)) leans on Reasoning: the rule is short, and the live dispute is how to apply it, as Cardozo's majority and Andrews's dissent show.</li>
<li>Contracts (Hadley v. Baxendale, 9 Exch. 341 (1854)) needs the Rule quoted precisely, since exam questions turn on which prong of its two-part test applies.</li>
<li>Property (Pierson v. Post, 3 Cai. R. 175 (N.Y. 1805)) needs historical context in the Facts and Reasoning, since the court builds its rule from competing authorities rather than settled precedent.</li>
<li>Constitutional Law (Marbury v. Madison, 5 U.S. 137 (1803)) needs the Issue broken into its sequential sub-questions, since the case's logic depends on their order.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Should every brief use the same five headings?</h3>
<p>Yes. The mistake is treating all five as equally important every time; which one needs the most detail changes with what the case is arguing about, as the four examples above show.</p>
<h3>How long should a case brief be?</h3>
<p>Short enough to review before class without rereading the case. Each brief above runs roughly 165 to 240 words and still covers what a professor would cold-call on -- length isn't what makes a brief useful, coverage of the dispute is.</p>
<h3>Do I need to include dissenting opinions in my brief?</h3>
<p>Only when the dissent explains why the case is taught, the way Andrews's dissent in Palsgraf does -- it's the alternative rule that shows up in later exam hypotheticals. A dissent that just disagrees on the facts usually isn't worth the space.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    modifiedAt: '2026-09-21',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: 'how-to-brief-a-case-annotated-examples',
    primarySources: [
      { label: 'Palsgraf v. Long Island Railroad Co., 248 N.Y. 339 (N.Y. 1928)', url: 'https://www.courtlistener.com/opinion/3604358/palsgraf-v-long-island-railroad-company/' },
      { label: 'Hadley v. Baxendale, 9 Exch. 341, 156 Eng. Rep. 145 (1854)', url: 'https://www.bailii.org/ew/cases/EWHC/Exch/1854/J70.html' },
      { label: 'Pierson v. Post, 3 Cai. R. 175 (N.Y. Sup. Ct. 1805)', url: 'https://www.courtlistener.com/opinion/5618666/pierson-v-post/' },
      { label: 'Marbury v. Madison, 5 U.S. (1 Cranch) 137 (1803)', url: 'https://supreme.justia.com/cases/federal/us/5/137/' },
    ],
  },
];
