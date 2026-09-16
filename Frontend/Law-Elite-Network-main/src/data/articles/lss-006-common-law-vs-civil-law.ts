import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleCommonLawVsCivilLaw: LawArticle[] = [
  {
    id: 'lss-006',
    title: 'Common Law vs. Civil Law: What Actually Separates the Two Systems',
    slug: 'common-law-vs-civil-law',
    alphabet: 'C',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      "Common law systems build binding doctrine case by case; civil law systems apply comprehensive written codes. Here's what that split actually changes -- with country examples, the mixed systems that don't fit the textbook version, and why it matters once you're reading a foreign case or code provision instead of just a US casebook.",
    content: `<h2>Two Different Starting Points</h2>
<p>Ask a law student in London and a law student in Paris where the law they're about to cite actually comes from, and you'll get two different answers. The London student points to a case: a decision from a court, maybe decades old, that a judge is bound to follow today under the doctrine of stare decisis. The Paris student points to a code: a numbered article in the Code civil, drafted by the legislature, that a judge applies to the facts in front of them. That's the split between common law and civil law, and it isn't a technicality -- it changes how you read a legal problem, what counts as authority, and what your first year of law school is actually training you to do.</p>

<h2>Where the Authority Actually Sits</h2>
<p>In a common law system -- the US, England and Wales, Canada outside Quebec, Australia, India, and most former British colonies -- judicial decisions are themselves a source of law. When a higher court rules on a set of facts, that ruling binds lower courts facing similar facts later. Stack enough of those rulings on top of each other over a couple of centuries and you get the body of doctrine a 1L spends the first year learning to read: negligence, consideration, the rule against perpetuities. None of it is written down in one place as a complete statement. It's assembled case by case, and a court can distinguish, narrow, or -- rarely -- overturn its own precedent when the facts or reasoning demand it.</p>
<p>In a civil law system -- France, Germany, Japan, and most of continental Europe and Latin America -- the starting point is a comprehensive code: a text the legislature wrote, organized by subject, meant to answer the question before a dispute ever reaches a court. A judge's job is to apply the relevant article to the facts, not build the rule from prior rulings. Earlier decisions can be persuasive -- French and German courts do look at how a provision has been applied before -- but they aren't binding the way an appellate precedent is in a common law court. Change the rule, and in a civil law system that mostly happens through the legislature amending the code, not a court reinterpreting it.</p>

<h2>It Shows Up in How a Trial Actually Runs</h2>
<p>The precedent-versus-code split has a courtroom-level cousin: adversarial versus inquisitorial procedure. Common law trials are adversarial -- two sides build their own cases, gather their own evidence, and the judge acts largely as a referee deciding what's admissible. Civil law systems lean inquisitorial -- the judge takes a more active role in directing the investigation, questioning witnesses, and shaping what evidence gets developed, instead of waiting for the parties to present a finished case. The two divides grew up together: case-by-case adjudication needs the parties to frame the dispute for the court to rule on, while applying a code to established facts puts more of that fact-finding work in the judge's hands from the start.</p>

<h2>The Map Isn't as Clean as the Textbook Version</h2>
<p>Most comparative-law overviews stop at "common law countries" and "civil law countries" and leave it there, which is close enough for a first pass but wrong often enough to trip you up in an exam or a client memo. Canada is common law -- except Quebec, which kept a civil code from its French colonial period and runs a civil law system for private law even though Canadian federal and criminal law, and the rest of the country, is common law. The United Kingdom is common law -- except Scotland, which blends common law with a civil law structure rooted in Roman and continental influence, distinct from England and Wales. Louisiana kept the civil code it inherited from French and Spanish rule, even though it sits inside a common law country and still applies common law principles in criminal and procedural matters. South Africa runs a mixed system too, combining Roman-Dutch civil law with English common law and customary law. Check whether a jurisdiction is a clean example or one of these mixed systems before you build an argument on the assumption that it's one or the other. Japan is worth a mention too: it's classified as civil law and its Civil Code follows the German model closely, but its criminal procedure was rewritten after World War II under American occupation and picked up adversarial, common law-influenced features. A country's classification describes its dominant tradition, not a guarantee that every area of its law follows it uniformly.</p>

<h2>Why a Law Student Should Care Beyond the Exam</h2>
<p>This matters past passing Civil Procedure or a comparative law elective. If you're reading a foreign case or statute for an international law paper, knowing whether the jurisdiction is common law or civil law tells you what to look for first -- a line of cases, or a code provision -- and misreading that means citing the wrong kind of authority entirely. If you ever work on a cross-border matter, or for a client operating in a civil law jurisdiction, a common law instinct to search for the controlling precedent won't get you far; the answer is more likely sitting in a code article, and what matters is how that article has been interpreted, not what binds it. Understanding the split before an LLM abroad or a comparative law course starts means you spend your time learning the substance instead of reorienting to an unfamiliar way legal authority works.</p>
<p>It also explains something that trips up first-year students without them realizing why. Common law reasoning is trained around analogy -- does this case look enough like that one to be governed by the same rule -- while civil law reasoning is trained around deduction -- what does this code provision say, and how does it apply to these facts. Neither is more rigorous. They're different tools, and a student who has only learned the analogical version can struggle the first time they read a code-based argument, not because the material is harder but because the method is unfamiliar.</p>

<h2>Key Takeaways</h2>
<ul>
<li>Common law systems build binding legal doctrine from judicial precedent (stare decisis); civil law systems apply comprehensive written codes, where past decisions are persuasive but not binding.</li>
<li>Common law countries include the US, England and Wales, Canada outside Quebec, Australia, and India; civil law countries include France, Germany, Japan, and most of continental Europe and Latin America.</li>
<li>Procedure tracks the same divide: common law trials are adversarial and party-driven; civil law trials are more inquisitorial, with the judge directing fact-finding.</li>
<li>Several jurisdictions -- Quebec, Scotland, Louisiana, South Africa -- run mixed systems and don't fit cleanly into either category; verify before assuming.</li>
<li>The split changes how legal reasoning itself works: common law trains analogy between cases, civil law trains deduction from code provisions.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Is the United States a pure common law country?</h3>
<p>Federal law and every state except Louisiana operate under common law. Louisiana kept a civil code from its French and Spanish colonial history and still applies common law principles in criminal and procedural matters, making it a mixed system within an otherwise common law country.</p>
<h3>Can a civil law court ever rely on precedent?</h3>
<p>Yes, but not as binding authority. Courts in France and Germany look at how a code provision has been applied in prior cases, and a well-established line of interpretation carries persuasive weight. The difference is that a civil law judge isn't required to follow it the way a common law judge is bound by stare decisis -- the code stays the primary source, not the case.</p>
<h3>Does every common law country use an adversarial trial process?</h3>
<p>Adversarial procedure is the norm in common law jurisdictions like the US, UK, and India, and it developed alongside the precedent-based tradition. But procedure and legal source aren't strictly locked together -- some common law jurisdictions incorporate inquisitorial elements in specific proceedings, so it's worth checking the actual procedural rules for the country and case type you're researching rather than assuming from the legal family alone.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: 'common-law-vs-civil-law',
    primarySources: [
      { label: 'UNODC Education for Justice: Adversarial versus Inquisitorial Legal Systems', url: 'https://www.unodc.org/e4j/en/organized-crime/module-9/key-issues/adversarial-vs-inquisitorial-legal-systems.html' },
      { label: 'Wikipedia: Common law', url: 'https://en.wikipedia.org/wiki/Common_law' },
      { label: 'Encyclopaedia Britannica: Civil law (Romano-Germanic legal system)', url: 'https://www.britannica.com/topic/civil-law-Romano-Germanic' },
    ],
  },
];
