import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleLegalWritingBasics: LawArticle[] = [
  {
    id: 'lss-010',
    title: 'Legal Writing Basics: Before-and-After CREAC Examples',
    slug: 'legal-writing-basics-before-and-after-creac-examples',
    alphabet: 'L',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      'Every guide defines CREAC. This one rewrites the same short legal analysis twice -- once the way most 1Ls draft it, once in proper CREAC -- using a verified contract-law rule, so the difference is visible instead of just described.',
    content: `<h2>The Format Every Guide Describes, Rarely Shown</h2>
<p>Type "legal writing basics for law students" into any search engine and the results converge on the same move: a definition of CREAC (or its shorter cousin, CRAC), a bullet list of what each letter stands for, and maybe a one-paragraph "example" that is really just a labeled outline. What almost nobody hands you is the same piece of analysis written twice -- once the way a 1L instinctively drafts it, and once restructured into the format their legal writing professor actually grades for. Seeing that shift teaches more in five minutes than another definition of "Application" ever will. This piece does it with one deliberately small legal question, built for illustration and not drawn from any real case or client file.</p>

<h2>What CREAC Actually Stands For, and Where CRAC Differs</h2>
<p>CREAC breaks down as Conclusion, Rule, Explanation, Application, Conclusion: state your answer, state the governing rule, explain what that rule means, apply it to your facts, then restate the conclusion without introducing anything new. CRAC drops the middle step -- Conclusion, Rule, Application, Conclusion -- moving straight from the bare rule to applying it, which works when the rule is narrow enough that it does not need unpacking. Some schools teach IRAC instead, opening with the Issue rather than the Conclusion and placing the Rule ahead of the Application. The sequencing differs by professor and casebook, but the underlying move -- state the rule, explain it if needed, then match it to your facts -- is the same skill under different labels.</p>

<h2>The Question: A Mailbox Rule Hypothetical</h2>
<p>Here is the constructed fact pattern used for both versions below. It is invented for this article, not a real dispute or client matter:</p>
<p>On Monday, Owner mails Buyer a signed letter offering to sell a kiln for $4,000, stating the offer stays open for ten days. On Wednesday, Buyer mails back a signed letter accepting. On Thursday, before Buyer's acceptance has arrived, Owner sells the kiln to someone else and mails Buyer a letter revoking the offer. Buyer's acceptance reaches Owner on Friday; Owner's revocation reaches Buyer on Saturday. Did Buyer and Owner form a contract, and if so, when?</p>

<h2>BEFORE: How This Usually Gets Written</h2>
<p>Contract formation requires offer, acceptance, and consideration, and there are rules about when an acceptance counts, which can depend on the method used and whether the offer says otherwise, since the whole point of contract law is to protect the reasonable expectations of the parties. Here, Owner sent an offer by mail, and Buyer accepted by mail too, which seems reasonable since that is how the offer came. Owner then tried to revoke after selling the kiln to someone else, but by then Buyer had already mailed the acceptance, so it is possible the contract was already done before the revocation showed up, depending on when exactly the acceptance became effective. So there is a decent argument a contract was formed on Wednesday when Buyer mailed the letter, though Owner might argue the revocation came first since Buyer did not have the letter yet, and further analysis would help settle the question.</p>
<p>Nothing above is wrong on the law. But a reader has to excavate the answer from the middle of the paragraph, the rule is scattered across three separate sentences instead of stated once, and the final sentence promises "further analysis" instead of delivering a conclusion.</p>

<h2>AFTER: The Same Analysis in CREAC</h2>
<p><strong>Conclusion:</strong> A contract was formed on Wednesday, the moment Buyer mailed the acceptance -- before Owner's revocation ever reached Buyer.</p>
<p><strong>Rule:</strong> Under the mailbox rule, reflected in Restatement (Second) of Contracts Section 63, an acceptance sent by a manner invited by the offer becomes effective -- and the contract is formed -- the moment it is mailed, not when the offeror receives it, so long as the offer is still open and the method of acceptance is reasonable. A later-arriving revocation has no effect on an acceptance already effective when mailed.</p>
<p><strong>Explanation:</strong> The rule protects an offeree who has already acted on an offer from being undercut by a revocation the offeree had no way to know about. That is why dispatch, not receipt, controls: an offeree who mails an acceptance reasonably believes a deal is done and should not bear the risk of letters crossing in transit. The rule is a default, not an absolute -- an offeror can require actual receipt instead, and it generally does not extend to option contracts, where acceptance must still be received to be effective.</p>
<p><strong>Application:</strong> Owner's offer was silent on how acceptance had to be communicated, and Owner had used the mail to send it, so Buyer's decision to accept by return mail was a reasonable method under the offer's own terms -- nothing required receipt instead of dispatch, and this is not an option contract. Buyer's acceptance therefore became effective on Wednesday, regardless of when it physically reached Owner. Owner's attempted revocation was not mailed until Thursday, a full day after the contract already existed, and did not arrive until Saturday. Because a contract had already formed, Owner's revocation came too late to have any legal effect -- there was no longer an open offer left to revoke.</p>
<p><strong>Conclusion:</strong> Because Buyer's acceptance was effective on dispatch under the mailbox rule, a contract was formed Wednesday, and Owner's Thursday revocation, arriving after that, could not undo it.</p>

<h2>What Actually Changed Between the Two Versions</h2>
<p>Same rule, same facts, same correct outcome, but the before version makes a reader work for all of it. Three differences do the work.</p>
<p><strong>The answer moves to the front.</strong> After states a contract formed on Wednesday in its first sentence. Before makes you read to the final clause to find a hedged version of the same answer.</p>
<p><strong>The rule gets isolated and explained before it gets used.</strong> Before mixes the rule, an exception, and a vague nod to "reasonable expectations" into one run-on sentence, and never explains why dispatch rather than receipt controls. After states the rule once, cleanly, then spends a full paragraph on that "why" before a single fact appears -- the Explanation step most beginner drafts skip, and the one that makes the Application persuasive rather than conclusory.</p>
<p><strong>The application tracks the rule's own language.</strong> After reuses the rule's phrasing -- "effective the moment it is mailed," "reasonable method," "no longer an open offer" -- so a reader can check the application against the rule sentence by sentence. Before restates the facts in new language that never closes the loop back to the rule it opened with.</p>

<h2>Key Takeaways</h2>
<ul>
<li>CREAC stands for Conclusion, Rule, Explanation, Application, Conclusion; CRAC drops the Explanation step, used when the rule is narrow enough not to need unpacking.</li>
<li>Lead with your conclusion -- a legal reader should get your answer in the first sentence, not the last one.</li>
<li>State the rule once, cleanly, before any facts appear -- do not let it leak into the application in pieces.</li>
<li>Explanation is where most first drafts go missing entirely; it is what turns a conclusory application into a persuasive one.</li>
<li>Reuse the rule's own key phrases in your application so a reader can trace each fact back to the exact part of the rule it satisfies.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Do I need to label each part -- Conclusion, Rule, Explanation, Application, Conclusion -- in an actual assignment?</h3>
<p>Usually not with headers the way this article does. Most professors want the structure to show through paragraph breaks and topic sentences, not literal labels. Ask if you are unsure; some legal writing courses do want the labels spelled out in early drafts.</p>
<h3>What is the difference between CREAC and IRAC, and does it matter which one I use?</h3>
<p>IRAC opens with the Issue and places the Rule before the Application; CREAC and CRAC open with the Conclusion instead. Which one your professor wants depends on the course -- ask, or match whatever model memos the course provides, rather than assuming one version is universally correct.</p>
<h3>When is it fine to skip the Explanation step and use CRAC instead?</h3>
<p>When the rule is narrow enough that its meaning is not in dispute and does not need unpacking from case law -- a clear statutory deadline, for instance. If the rule has room for interpretation, keep the Explanation step; that is where you show the reader where the rule's meaning actually comes from.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: 'legal-writing-basics-before-and-after-creac-examples',
    primarySources: [
      { label: 'Cornell Law School Legal Information Institute, Wex, "mailbox rule"', url: 'https://www.law.cornell.edu/wex/mailbox_rule' },
      { label: 'CREAC Legal Writing Paradigm, Legal Writing Manual (Mangan), LibreTexts', url: 'https://human.libretexts.org/Bookshelves/Composition/Specialized_Composition/Legal_Writing_Manual_(Mangan)/01:_Chapters/1.10:_CREAC_Legal_Writing_Paradigm' },
    ],
  },
];
