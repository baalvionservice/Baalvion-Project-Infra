import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleColdCalling: LawArticle[] = [
  {
    id: 'lss-005',
    title: "Cold Calling in Law School: What to Say When You're Not Ready",
    slug: 'cold-calling-in-law-school-what-to-say-when-not-ready',
    alphabet: 'C',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      "Most cold-calling advice tells you to relax. This one gives you the actual sentences to say in the four situations that come up over and over: you didn't read, you read but you're lost, you disagree with the professor, and you just need three seconds to find the page.",
    content: `<h2>How Cold Calling Actually Works</h2>
<p>Before the scripts, it helps to know what you're actually dealing with, because it's not the same everywhere. In the classic Socratic format, a professor calls on a student by name and works through a case with them out loud in front of everyone else -- what the court held, why, and what would happen if one fact changed. How that student gets picked varies by professor. Some go down the seating chart or the class roster in order, which means you can track roughly where they are and know your turn is coming a few minutes out. Others call names at random with no pattern to catch. A third group runs an on-call or panel system: a set of students is designated as "on call" for that day or week, expected to have briefed every case cold, while everyone else can breathe. Which version you've got is usually obvious by the second week of class -- if it isn't, ask a 2L or 3L who's had that professor, they'll know immediately.</p>
<p>The point of the exercise isn't to catch you out. It's rehearsal for a version of your job where a judge or a client asks a question and "can I get back to you" isn't always available. Cold calling itself is very rarely a graded event on its own -- most professors don't put a checkmark next to your name and factor it into your transcript. Some seminars grade class participation as a component, which is a different, usually smaller-stakes thing. Specifics vary by school and by professor, so check your syllabus rather than assume either way.</p>

<h2>You Didn't Read the Case</h2>
<p>This happens. You had a legal writing deadline, or the reading was ninety pages and you ran out of night. When your name gets called and you have nothing, the move is not to bluff your way through a summary you're guessing at from the case name. Professors have heard every version of that guess and it's obvious within one sentence.</p>
<p>Say it plainly: "I didn't get to today's reading." That's the whole sentence. You don't need to explain why, apologize twice, or perform embarrassment. Most professors will simply move to the next name on the list. Some will ask if you can speak to the case generally from the casebook's introductory note -- offer that much if you can, and say so plainly if you can't. The two or three seconds of silence after you say it feels enormous from your seat and is unremarkable from everyone else's. Nobody in that room is tallying it against you except you.</p>

<h2>You Read It But You're Lost</h2>
<p>This is the more common problem, and it's the one people handle worst, because it feels like it should count as being prepared and doesn't always land that way under pressure. You read the case. You can't tell what the professor is asking, or you followed the majority opinion but the question jumps to the dissent and you lose the thread.</p>
<p>Don't guess at what you think the professor wants to hear. Say where you actually are: "I followed the majority's holding on the duty question, but I'm not sure how the dissent's standard changes the outcome here." That sentence does two things at once -- it proves you did the reading, and it hands the professor the exact spot to redirect you instead of making them fish for it with three more questions. An opening phrase like "Based on the court's reasoning in the majority opinion..." is worth building as a habit too, because it forces you to anchor your answer in the text in front of you instead of your memory of what you read an hour ago.</p>
<p>You're also allowed to have your casebook and notes open. Nobody expects holdings memorized word for word, and checking a quote or page number mid-answer is standard practice, not a tell that you're unprepared.</p>

<h2>You Disagree With the Professor</h2>
<p>Sometimes the professor is pushing you toward a conclusion the case doesn't actually support, or is deliberately arguing the other side to see if you'll hold your position -- that second one is a common teaching move, not a trap you failed to notice. Either way, "I think you're wrong" isn't an argument, and it stalls the exchange instead of moving it forward.</p>
<p>Tie the disagreement to the page in front of you: "Under the rule the majority states on page 40, though, wouldn't that cut the other way?" or "That reading would seem to conflict with the standard the court just laid out two paragraphs earlier." Pointing at specific language does more work than a stronger tone of voice ever will, and it keeps the exchange about the text instead of about who's right. If the professor keeps pushing after that, that's often the point of the exercise -- staying in the disagreement and refining your answer is usually worth more to your understanding of the case than folding the moment you meet resistance.</p>

<h2>You Need a Second to Think</h2>
<p>You don't have to answer the instant the question stops. A short pause while you find the page is completely normal: "Give me a second to find that" is a full sentence and buys you time to locate the passage instead of talking while you're still searching for it.</p>
<p>A second option that works almost as well: repeat the question back in your own words. "So the question is whether the court's standard from the first case would apply to a defendant who never had notice." Restating it does two jobs -- it confirms you actually understood what's being asked before you commit to an answer, and it gives you another few seconds to organize your thoughts while you're still technically speaking instead of trying to speak and think from a standing start. Professors are generally fine letting you sit with the question for a moment; the silence is much more comfortable for them than it feels for you.</p>

<h2>Key Takeaways</h2>
<ul>
<li>Cold calling works differently by professor -- roster order, random selection, or a scheduled on-call panel -- and figuring out which one you have changes how you prepare for it.</li>
<li>If you didn't read, say so plainly in one sentence rather than guessing your way through an answer; most professors will simply move on.</li>
<li>If you're confused, name the exact point where you lost the thread instead of guessing at the "right" answer -- it shows you did the reading and gives the professor something specific to redirect.</li>
<li>Disagreeing with a professor works better when it's tied to specific language in the case rather than a general objection.</li>
<li>You're allowed to pause, check your notes, or restate the question before answering -- none of that reads as unpreparedness.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Does cold calling affect my grade?</h3>
<p>On its own, usually not -- most doctrinal courses don't score individual cold calls. Some seminars grade overall class participation as a smaller component of the final grade, which is a different thing. Check your specific syllabus, since this varies by professor and by school.</p>
<h3>Is it okay to use my notes or casebook when I'm called on?</h3>
<p>Yes. Referencing your briefs, your casebook, or your outline while answering is standard practice, not a sign you didn't prepare. What professors are generally testing is whether you can reason through the material out loud, not whether you've memorized it.</p>
<h3>What if the professor keeps pushing after I answer?</h3>
<p>That's often intentional. Professors frequently keep pressing, including arguing the opposite side, to see whether you can hold and refine a position under follow-up questions -- which is closer to what happens in an actual courtroom exchange than a single question with a single right answer.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 6,
    views: 0,
    featured: false,
    imageSeed: 'cold-calling-in-law-school-what-to-say-when-not-ready',
    primarySources: [
      { label: 'American Bar Association, "Cold Calls in Law School: How to Respond"', url: 'https://www.americanbar.org/groups/law_students/resources/student-lawyer/student-essentials/how-to-respond-cold-calls-law-school/' },
      { label: 'JD Advising, "Four Vital Tips For Surviving Cold Calling In Law School"', url: 'https://jdadvising.com/tips-surviving-cold-calling-in-law-school/' },
      { label: 'BARBRI, "Law School Cold Call Tips for 1L Success"', url: 'https://www.barbri.com/resources/conquer-the-socratic-method-cold-call-tips' },
    ],
  },
];
