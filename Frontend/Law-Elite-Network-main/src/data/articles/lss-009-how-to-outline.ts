import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleHowToOutline: LawArticle[] = [
  {
    id: 'lss-009',
    title: 'How to Outline for Law School Exams: A Working Template',
    slug: 'how-to-outline-for-law-school-exams',
    alphabet: 'H',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      "Most outlining advice stops at 'condense your notes.' This one shows an annotated outline entry for negligence -- rule, elements, case anchors, and exam traps -- so you can see the structure instead of guessing at it.",
    content: `<h2>What an Outline Actually Is</h2>
<p>An outline is not your class notes with the fluff trimmed off. It's a synthesis of an entire course, reorganized by legal rule instead of by the order your professor covered it or the casebook printed it. A semester of Torts gets taught across a dozen-plus cases spread over several weeks, interleaved with unrelated doctrines and procedural asides. On the exam, none of that sequencing matters -- you get a fact pattern and need the rule, cold, with the sub-parts that make it testable. The outline is what gets you from "I remember reading a case about a foreseeable plaintiff" to "duty runs to those within the zone of danger" in the two minutes you have to spot the issue.</p>
<p>That's also why an outline built the week before finals tends to underperform one built across the semester. Half the value is in the work of pulling each rule out of several cases and deciding how the pieces fit.</p>

<h2>Rule, Elements, Application -- Not Rule, Case, Case, Case</h2>
<p>The most common outlining mistake is structuring an entry the way the casebook presented the material: case name, facts, holding, next case, facts, holding. That's a briefing document, not a study document -- it buries the exam-tested part, the rule, under facts you'll never need to reproduce.</p>
<p>A working entry flips that order: rule first, then elements, then support. Lead with the rule stated the way your professor tested it. Break it into elements, because elements are what a grader checks off line by line. Under each element, note the operative standard, the exceptions your professor spent time on, and one or two cases that earn a place -- the case that defines the standard and the case that shows where it breaks down. A case that wouldn't change how you'd apply the rule to new facts doesn't need its own line.</p>

<h2>A Worked Excerpt: Negligence</h2>
<p>Here's what one entry looks like built that way, using the elements of negligence -- one of the first rules most 1L Torts students outline, and a useful example because it's easy to check against a treatise or the Restatement yourself.</p>
<p><strong>NEGLIGENCE (Torts)</strong></p>
<ul>
<li><strong>Rule:</strong> a plaintiff establishes a prima facie case of negligence by proving four elements -- duty, breach, causation, and damages.</li>
<li><strong>1. Duty</strong> -- the defendant owed the plaintiff a legal duty to conform to a reasonable standard of care.
<ul>
<li>Standard: a duty of reasonable care runs to those foreseeably placed at risk by the defendant's conduct.</li>
<li>Exception: no general duty to rescue or to act affirmatively, absent a preexisting relationship, an undertaking, or a statute.</li>
<li>Case anchor: Palsgraf v. Long Island R.R. Co. -- duty is owed only to foreseeable plaintiffs within the zone of danger, not to the world at large.</li>
</ul>
</li>
<li><strong>2. Breach</strong> -- the defendant failed to conform to the required standard.
<ul>
<li>Standard: would a reasonably prudent person have acted differently under the same circumstances?</li>
<li>Factors: foreseeability and severity of the harm, weighed against the burden of avoiding it.</li>
<li>Trap: breach is fact-driven -- state the standard, then apply the specific facts to it. A bare conclusion ("the defendant breached") earns nothing on its own.</li>
</ul>
</li>
<li><strong>3. Causation</strong> -- the breach actually and proximately caused the harm.
<ul>
<li>(a) Cause-in-fact: the but-for test -- would the harm have occurred without the defendant's conduct?</li>
<li>(b) Proximate cause: was the harm within the scope of foreseeable risk created by the breach, or too remote to impose liability?</li>
<li>Trap: a fact pattern with an intervening act is almost always testing whether that act was foreseeable enough to stay within proximate cause.</li>
</ul>
</li>
<li><strong>4. Damages</strong> -- the plaintiff suffered actual, compensable harm.
<ul>
<li>Unlike intentional torts, negligence is not actionable per se -- no proven harm means no claim, no matter how careless the conduct was.</li>
</ul>
</li>
</ul>
<p>Notice the structure. The rule stands alone at the top -- if you wrote nothing else, you could still name the standard and spot the issue. Each element carries the actual test, not just a label: "breach" alone tells you nothing you can apply to new facts, but the reasonable-person standard does. Case citations are short and functional, chosen because they define or complicate the rule, not because they were memorable reading. The trap notes mark the gap between a passing answer and a strong one -- graders see the same missed step repeatedly, which is why it's worth flagging before you're under time pressure.</p>

<h2>Building Your Own Entry From a Stack of Notes</h2>
<p>Start from your class notes, not the casebook -- your professor writes the exam, and the way they framed the rule in class is the version you'll be tested on. Pull the rule statement first, even if it takes rereading a few days of notes to find where your professor actually stated it. List the elements exactly as broken out in class; don't collapse four into three because a commercial outline uses three. Under each element, add the sub-rule, one case anchor, and any exception raised in class. Close with a line for the trap: the step students tend to skip, state backwards, or forget only applies in some jurisdictions.</p>
<p>Keep the whole entry short enough to scan in under a minute; past half a page, it usually still has case summaries that belong in a separate brief bank.</p>

<h2>When to Build It, and When to Stop Touching It</h2>
<p>Start outlining a course in the first two or three weeks, once you've seen enough material to recognize how the professor organizes a rule -- not because the first draft will be good, but because outlining early exposes gaps while there's time to raise them in office hours. Revise after each unit; a rule outlined in week three often needs a line added in week nine when the professor circles back with an exception. Stop adding to it about a week out and switch to using it -- timed practice questions against your own outline are what turn a written document into something you can retrieve under exam conditions.</p>

<h2>Key Takeaways</h2>
<ul>
<li>An outline reorganizes a semester of cases and notes by legal rule, not by the order the material was taught -- that's what makes it usable under exam time pressure.</li>
<li>Structure each entry as rule, then elements, then a short case anchor and exam trap for each element, not a list of case summaries.</li>
<li>Pull rule statements from class notes first, since your professor writes the exam based on how they taught the material.</li>
<li>Start outlining in the first few weeks of a course and revise after each unit, rather than building the whole document the week before finals.</li>
<li>Stop editing the outline about a week out and switch to practice questions -- that's what converts it from a reference document into something you can retrieve from memory.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>How long should a law school outline be?</h3>
<p>Short enough to review before the exam rather than re-read a fraction of it. There's no fixed page count -- a doctrinal course like Contracts tends to run longer than a narrow elective -- but if one rule's entry runs past half a page, it usually still has case-summary material that belongs elsewhere.</p>
<h3>Should I use someone else's outline instead of writing my own?</h3>
<p>A prior student's outline or a commercial one can help you check a rule statement or fill a gap, but the outlining process itself -- pulling a rule out of several cases and deciding how the elements fit -- is how the material gets learned. Treat an outsourced outline as a reference, not a replacement.</p>
<h3>Do open-book exams make outlining less important?</h3>
<p>No -- if anything it raises the bar. A professor grading an open-book exam expects you to move faster and go deeper, not spend exam time searching a disorganized document for the rule. A well-structured outline is what makes the format an advantage instead of a time trap.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: 'how-to-outline-for-law-school-exams',
    primarySources: [
      { label: 'American Bar Association, "An In-Depth Guide to Outlining in Law School"', url: 'https://www.americanbar.org/groups/law_students/resources/student-lawyer/student-essentials/guide-outlining-in-law-school/' },
      { label: 'Restatement (Second) of Torts § 281 (elements of a negligence claim)' },
      { label: 'Palsgraf v. Long Island R.R. Co., 248 N.Y. 339 (1928)' },
    ],
  },
];
