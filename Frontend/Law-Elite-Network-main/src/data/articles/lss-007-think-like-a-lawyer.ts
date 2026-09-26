import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleThinkLikeALawyer: LawArticle[] = [
  {
    id: 'lss-007',
    title: 'How to Think Like a Lawyer: A Worked Example of Legal Reasoning',
    slug: 'how-to-think-like-a-lawyer-worked-example',
    alphabet: 'H',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      'Most explanations of "thinking like a lawyer" stop at describing analogical reasoning in the abstract. This one starts from an actual case, Hadley v. Baxendale, and walks it forward into a new fact pattern, step by step, the way you would in a cold call or on an exam.',
    content: `<h2>The Problem With Most Explanations of This</h2>
<p>Every 1L hears some version of the same pitch during orientation: law school will teach you to "think like a lawyer." Then the explanations that follow tend to stay up in the clouds -- issue-spotting, analogical reasoning, applying rules to facts -- described as concepts rather than shown as a process. You can read ten articles defining analogical reasoning and still freeze the first time a professor asks you to apply a nineteenth-century shipping case to a hypothetical about a broken laptop.</p>
<p>So here is the process itself, run start to finish, on one case you will almost certainly read in your first month of law school: Hadley v. Baxendale.</p>

<h2>The Case</h2>
<p>Hadley v. Baxendale was decided by the English Court of Exchequer in 1854 and is reported at 9 Exch. 341, 156 Eng. Rep. 145. Joseph and Jonah Hadley ran a flour mill in Gloucester. The mill's crankshaft broke, stopping every wheel in the building. The Hadleys needed the broken shaft sent to an engineering firm in Greenwich, which would use it as a pattern to cast a replacement. They hired Baxendale, a carrier, to transport it, and told Baxendale's clerk that the mill was stopped and the shaft had to go immediately. Baxendale promised next-day delivery for a set fee. Through the carrier's neglect, delivery was delayed several days, which kept the mill shut down longer than it should have been. The Hadleys sued for the profits they lost during that extra downtime.</p>
<p>The Court of Exchequer held that the jury had been misdirected on damages and ordered a new trial, so the Hadleys' lost-profits claim failed on the terms of the rule the court laid down. Baron Alderson's opinion set out a two-part test that still gets quoted in nearly every American contracts casebook: a breaching party owes damages that either (1) arise naturally, in the ordinary course of things, from the breach itself, or (2) were within the reasonable contemplation of both parties, at the time they made the contract, as a probable consequence of a breach -- which usually means the specific risk was actually communicated. Lost mill profits failed both prongs. A shaft going missing does not, by itself, imply a mill will sit idle; plenty of mills keep a spare part or another way to keep running. And telling the clerk only that the mill was "stopped" did not put Baxendale on notice that the delay would translate directly into lost profits rather than some smaller, ordinary inconvenience. The carrier had no way to price that risk into the fee, or to decline the job, or to handle the shaft with extra care, because nobody told him what was actually riding on next-day delivery.</p>

<h2>Pulling the Rule Out of the Facts</h2>
<p>The move a lawyer makes here is not "damages must be foreseeable" as a slogan. It is narrower and more useful: general knowledge of urgency is not the same as knowledge of the specific consequence of delay. Hadley told Baxendale the mill was stopped. That was true, and it was still not enough, because it did not tell Baxendale that a slow shaft meant idle machinery rather than, say, a mill running on a backup part while it waited. The information gap is the whole case.</p>

<h2>A Hypothetical, Not a Case: Running the Same Test on New Facts</h2>
<p>Here is a fact pattern I am constructing to illustrate the reasoning -- it is not a reported case, and nothing below happened. Say a freelance video editor, Priya, drops her laptop off at a repair shop because the motherboard has failed. She tells the clerk, "I have a deadline, can you turn this around fast?" The clerk quotes a two-day rush turnaround for an extra fee. The shop takes ten days because a technician misfiles the ticket. In those ten days, Priya misses her delivery date on a $50,000 contract, and the client cancels and pays a competing editor instead. Priya sues the repair shop for the $50,000.</p>
<p>Walk it the way a lawyer would, one question at a time:</p>
<ul>
<li><strong>What did the parties actually say to each other?</strong> Priya said "I have a deadline." That is structurally the same move Hadley made when he said the mill was "stopped" -- a true statement that gestures at urgency without pricing the stakes.</li>
<li><strong>Does the loss arise naturally, in the ordinary course, from a late repair?</strong> No, for the same reason it did not in Hadley. A shop has no default reason to assume a two-day slip on one laptop repair costs a specific client a five-figure contract. People miss deadlines and absorb it, use a backup device, or renegotiate, all the time.</li>
<li><strong>Was the specific loss within both parties' contemplation at contracting?</strong> This is where the shop's lawyer would lean hardest on Hadley. "I have a deadline" is the Gloucester mill's "we are stopped" -- true, urgent-sounding, and still short of the number that matters. The shop never learned there was a $50,000 contract riding on two extra days, so it never had the chance to charge more, decline the rush job, or triage the ticket differently.</li>
<li><strong>Is there a way to distinguish the hypothetical instead of following Hadley?</strong> A good advocate for Priya would try. Unlike Hadley's mill, which plausibly had a spare part or workaround, a laptop is usually the one tool a solo video editor has -- there is no obvious backup to assume. That narrows the gap between what was said and what a shop should have understood, but it likely does not close it, because Hadley's rule turns on communication of the consequence, not on how plausible the loss looks after the fact. The shop still was not told about the $50,000 contract specifically.</li>
</ul>
<p>Run the test through and the likely outcome mirrors Hadley: Priya recovers ordinary, foreseeable costs of the delay -- a rental laptop, an expedited-shipping refund, maybe the rush fee she paid and did not get -- but not the $50,000 contract loss, because she never communicated the number that made that loss knowable to the shop when they agreed to the repair.</p>

<h2>What Just Happened</h2>
<p>That is the entire mechanism people mean when they say "think like a lawyer." You take a rule that came out of one set of facts, you find the feature of those facts that actually did the work in the court's reasoning, and you check whether a new set of facts has that same feature -- not whether the two situations merely feel similar. Hadley did not lose because a mill is different from a laptop. He lost because he never told the carrier what a delay would specifically cost him. That is the fact that travels. Everything else -- the mill, the crankshaft, the year 1854 -- does not.</p>

<h2>Key Takeaways</h2>
<ul>
<li>Hadley v. Baxendale (1854) held that a breaching party owes only damages that arise naturally from the breach or were communicated as a probable consequence at contract formation.</li>
<li>Hadley lost his lost-profits claim because telling the carrier the mill was "stopped" did not communicate that the delay would specifically cause lost profits rather than ordinary inconvenience.</li>
<li>Applying a case to new facts means isolating the specific fact that drove the court's holding, then checking whether that same fact is present in the new scenario.</li>
<li>In the Priya hypothetical, "I have a deadline" tracks Hadley's "the mill is stopped" closely enough that the same rule likely produces the same outcome: recovery for ordinary costs, not the undisclosed $50,000 loss.</li>
<li>A strong legal argument also tests where the analogy might break, not just where it holds -- that is what separates restating a rule from actually applying it.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Why do law professors use Hadley v. Baxendale so often to teach this skill?</h3>
<p>Because the holding turns on one narrow, identifiable fact -- what was or was not communicated to the carrier -- rather than a sweeping principle. That makes it easy to isolate the operative fact and then test it against a new scenario, which is exactly the skill being taught.</p>
<h3>Is analogical reasoning just finding cases that look similar?</h3>
<p>No, and that is the most common mistake. Two situations can look alike on the surface (a mill and a laptop are both "someone's livelihood") while differing on the fact that actually decided the case. The skill is identifying which fact was outcome-determinative, then checking for that fact specifically.</p>
<h3>Does the Hadley rule still apply the same way in modern contract law?</h3>
<p>The foreseeability principle from Hadley remains foundational and shows up in the Restatement (Second) of Contracts and the UCC's treatment of consequential damages, though modern courts and statutes have refined how explicit the communication of special circumstances needs to be. The core structure -- ordinary damages versus damages that required advance notice -- traces directly back to this case.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    modifiedAt: '2026-09-21',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: 'how-to-think-like-a-lawyer-worked-example',
    primarySources: [
      { label: 'Hadley v. Baxendale, 9 Exch. 341, 156 Eng. Rep. 145 (Court of Exchequer 1854)', url: 'https://law.justia.com/cases/foreign/united-kingdom/9-ex-ch-341-1854.html' },
    ],
  },
];
