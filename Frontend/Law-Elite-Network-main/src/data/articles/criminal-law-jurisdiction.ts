import type { LawArticle } from '../law-content';

const CRIMINAL_LAW_CATEGORY = {
  id: 'cat_criminal_law',
  name: 'Criminal Law',
  slug: 'criminal-law',
};

/**
 * Jurisdiction-specific companions to the comparative `cl-101` "What Are Your
 * Rights If You Are Arrested?" pillar. cl-101 deliberately stays at the level
 * of shared global principles (the right to know why, to silence, to a
 * lawyer) and only name-checks Miranda/the UK caution in a single bullet each
 * -- these four pieces go into the actual mechanics, case law, and statutory
 * text of how each system implements those principles, which is where they
 * genuinely diverge (e.g. the US bars adverse inferences from silence
 * entirely; England and Wales does not).
 */
export const criminalLawJurisdictionArticles: LawArticle[] = [
  {
    id: 'cl-301',
    title: 'What Are Your Miranda Rights? A Plain-Language Guide',
    slug: 'miranda-rights-explained',
    alphabet: 'W',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_police',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_police', name: 'Police Procedures', slug: 'police-procedures' },
    summary:
      "Miranda warnings are only required before custodial interrogation, not at arrest — and skipping them doesn't automatically get a case thrown out.",
    author: 'Aisha Rahman',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'miranda-rights-custodial-interrogation-us',
    country: 'United States',
    primarySources: [
      { label: 'Miranda v. Arizona, 384 U.S. 436 (1966)', url: 'https://supreme.justia.com/cases/federal/us/384/436/' },
      { label: 'New York v. Quarles, 467 U.S. 649 (1984) — public safety exception', url: 'https://supreme.justia.com/cases/federal/us/467/649/' },
      { label: 'Berghuis v. Thompkins, 560 U.S. 370 (2010) — unambiguous invocation', url: 'https://supreme.justia.com/cases/federal/us/560/370/' },
      { label: 'Vega v. Tekoh, 597 U.S. 134 (2022) — no § 1983 claim for a Miranda violation alone', url: 'https://supreme.justia.com/cases/federal/us/597/21-499/' },
    ],
    content: `<p>"You have the right to remain silent." Most people in the United States can recite some version of the Miranda warning from television before they can recite their own rights accurately. That gap matters, because two of the most common beliefs about Miranda are wrong: police are not required to read it the moment they arrest you, and failing to read it does not automatically make a case go away. Miranda rights are narrower, more procedural, and more interesting than the TV version — and knowing exactly when they apply is what actually protects you.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Miranda warnings are only constitutionally required before "custodial interrogation" — being arrested alone does not trigger them.</li><li>There is no single mandatory script; the Supreme Court requires the substance of four warnings, not exact wording.</li><li>You must unambiguously invoke your right to silence or to a lawyer — simply staying quiet is not enough to stop questioning under current law.</li><li>A Miranda violation generally makes the unwarned statement inadmissible, but it does not automatically dismiss the case, and it does not by itself support a civil lawsuit against police.</li><li>A narrow "public safety" exception lets police ask unwarned questions when there is an immediate danger to resolve first.</li></ul></div>

<h2>Where Miranda Actually Comes From</h2>
<p>Miranda rights take their name from <em>Miranda v. Arizona</em> (1966), in which the U.S. Supreme Court held that the Fifth Amendment privilege against self-incrimination requires police to warn a suspect of specific rights before "custodial interrogation," because that setting is inherently coercive even without physical force. The warning is a procedural safeguard for two constitutional rights at once: the Fifth Amendment right not to incriminate yourself, and the Sixth Amendment right to counsel.</p>

<h2>What the Warning Must Actually Cover</h2>
<p>There is no single legally required script. The Supreme Court held in <em>California v. Prysock</em> (1981) that no "talismanic incantation" is required — officers do not have to recite the exact words from the original 1966 opinion, only convey the substance. In practice, that substance has four elements: you have the right to remain silent; anything you say can and will be used against you in court; you have the right to an attorney; and if you cannot afford one, one will be appointed for you before any questioning, if you wish. Departments vary the exact phrasing (and add local requirements — some require asking whether the suspect understands each right), but all four elements must be conveyed in substance.</p>

<h2>The Real Trigger: Custodial Interrogation, Not Arrest</h2>
<p>This is the most misunderstood part of Miranda. The warning is only constitutionally required before <strong>custodial interrogation</strong> — both halves of that phrase have to be present.</p>
<ul>
<li><strong>Custody</strong> means a reasonable person in the suspect's position would not feel free to end the encounter and leave. An arrest is custody, but so can other situations be, depending on the totality of the circumstances. Conversely, the Supreme Court held in <em>Berkemer v. McCarty</em> (1984) that an ordinary roadside traffic stop is generally <em>not</em> custody for Miranda purposes, even though the driver isn't free to simply drive off.</li>
<li><strong>Interrogation</strong> means express questioning or its "functional equivalent" — words or actions police should know are reasonably likely to elicit an incriminating response (<em>Rhode Island v. Innis</em>, 1980). Routine booking questions (name, address, date of birth) generally don't count, and neither do spontaneous, volunteered statements a suspect makes without being asked anything.</li>
</ul>
<p>Put together: an officer can arrest you, transport you, and book you without ever reading Miranda, and none of that is unlawful — the obligation only bites once they start questioning you while you're in custody.</p>

<h2>The Public Safety Exception</h2>
<p>In <em>New York v. Quarles</em> (1984), the Supreme Court carved out a narrow exception allowing police to ask unwarned questions when there is an objectively reasonable need to protect the police or the public from immediate danger — the classic example is asking "Where's the gun?" immediately after a struggle, before giving any warning. The exception is deliberately limited to resolving the immediate danger, not general investigation, and courts scrutinize how officers use it.</p>

<h2>How to Actually Invoke Your Rights</h2>
<p>Under current law, silence alone does not invoke the right to silence. In <em>Berghuis v. Thompkins</em> (2010), the Supreme Court held that a suspect must invoke the right to remain silent <strong>unambiguously</strong> — staying quiet through nearly three hours of questioning before finally answering one question was not, on its own, treated as an invocation. The same unambiguous standard applies to the right to counsel, first established in <em>Davis v. United States</em> (1994): saying something like "maybe I should talk to a lawyer" has been held too equivocal to require police to stop. The safest approach is a clear, complete sentence: "I am invoking my right to remain silent" or "I want a lawyer," said once and then followed by actual silence. Once counsel is unambiguously invoked, <em>Edwards v. Arizona</em> (1981) requires police to stop questioning until a lawyer is present or the suspect personally reinitiates contact.</p>

<h2>What Happens If Police Get It Wrong</h2>
<p>A Miranda violation is not the case-ending event it appears to be on television.</p>
<ul>
<li><strong>The statement is generally excluded</strong> from the prosecution's main case — but only that statement, not necessarily other evidence or the case as a whole.</li>
<li><strong>It can still be used to impeach you.</strong> If you testify at trial in a way that contradicts an unwarned statement, prosecutors may be able to use that statement to challenge your credibility, even though they couldn't use it as direct evidence of guilt.</li>
<li><strong>It doesn't automatically support a civil lawsuit.</strong> In <em>Vega v. Tekoh</em> (2022), the Supreme Court held that a Miranda violation alone does not give rise to a claim for money damages against police under 42 U.S.C. § 1983 — a significant, relatively recent limit on the practical consequences of a violation.</li>
</ul>

<h2>Two Common Myths</h2>
<p><strong>"Police have to read me my rights when they arrest me."</strong> Not true — the obligation is tied to custodial interrogation, not arrest itself. Many people are lawfully arrested and never questioned, so Miranda never comes into play.</p>
<p><strong>"If they didn't read Miranda, the case gets dismissed."</strong> Also not true — the remedy is suppression of the specific unwarned statement, not automatic dismissal of the charges, which can often proceed on other evidence.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do police have to read me Miranda rights immediately when they handcuff me?</h3>
<p>No. Miranda only applies once custodial interrogation begins. Being handcuffed and arrested is custody, but if police never question you, there is no Miranda violation to raise — and no requirement that the warning be given at the moment of arrest itself.</p>
<h3>Can I be convicted based on something I said before I was warned?</h3>
<p>If the statement was volunteered — not made in response to police questioning or its functional equivalent — it can generally still be used against you, since Miranda only governs statements made during custodial interrogation.</p>
<h3>What's the safest way to actually invoke my rights during questioning?</h3>
<p>Say a clear, unambiguous sentence — "I am invoking my right to remain silent and I want a lawyer" — and then stop talking. Under current Supreme Court precedent, staying silent without saying anything is not treated as a valid invocation on its own.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>U.S. Supreme Court, <em>Miranda v. Arizona</em>, 384 U.S. 436 (1966)</li>
<li>U.S. Supreme Court, <em>New York v. Quarles</em>, 467 U.S. 649 (1984) — public safety exception</li>
<li>U.S. Supreme Court, <em>Berghuis v. Thompkins</em>, 560 U.S. 370 (2010) — unambiguous invocation</li>
<li>U.S. Supreme Court, <em>Vega v. Tekoh</em>, 597 U.S. 134 (2022) — no § 1983 claim for a Miranda violation alone</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you are ever questioned in custody, the two sentences worth memorizing are simple: "I am invoking my right to remain silent" and "I want a lawyer." Say them clearly, once, and then stop talking — repeating yourself or trying to explain your position afterward can undo the protection you just invoked. If you believe police questioned you in custody without a warning, or kept questioning after you clearly invoked your rights, write down everything you remember as soon as possible and raise it with a criminal defense lawyer, since whether a statement gets suppressed often turns on exactly these facts. For the broader, worldwide picture of what happens when you're arrested, see <a href="/criminal-law/your-rights-if-you-are-arrested">What Are Your Rights If You Are Arrested?</a></p>

<p><em>This article is general legal information, not legal advice. Criminal procedure varies by state and changes over time — consult a criminal defense lawyer licensed in your state before acting.</em></p>`,
  },
  {
    id: 'cl-302',
    title: 'The Right to Silence in the UK: The Police Caution Explained',
    slug: 'right-to-silence-uk-police-caution',
    alphabet: 'T',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_police',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_police', name: 'Police Procedures', slug: 'police-procedures' },
    summary:
      'In England and Wales you still have a right to silence, but unlike in the US, staying silent can be held against you in specific circumstances.',
    author: 'Aisha Rahman',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'right-to-silence-police-caution-uk',
    country: 'United Kingdom',
    primarySources: [
      { label: 'Police and Criminal Evidence Act 1984, section 58 (right to legal advice)', url: 'https://www.legislation.gov.uk/ukpga/1984/60/section/58' },
      { label: 'Criminal Justice and Public Order Act 1994, sections 34–37 (adverse inferences)', url: 'https://www.legislation.gov.uk/ukpga/1994/33/section/34' },
      { label: 'R v Cowan [1996] QB 373 — jury direction limits on drawing inferences' },
      { label: 'R v Argent [1997] 2 Cr App R 27 — factors relevant to legal-advice reliance' },
    ],
    content: `<p>Anyone who has watched a US crime drama has heard some version of "you have the right to remain silent." The caution given by police in England and Wales starts the same way — but ends very differently. Under the Police and Criminal Evidence Act 1984 (PACE) and the Criminal Justice and Public Order Act 1994, staying silent during questioning can, in specific and limited circumstances, be held against you at trial. That single difference from the American approach is the most important thing to understand about the right to silence in this jurisdiction.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>The statutory caution wording is fixed by PACE Code C and must convey that silence "may harm your defence" — unlike the US, it does not simply promise silence carries no cost.</li><li>Sections 34–37 of the Criminal Justice and Public Order Act 1994 let a court or jury draw an "adverse inference" from certain kinds of silence during police questioning.</li><li>You cannot be convicted solely because you stayed silent — there must be a case to answer independent of the inference.</li><li>Everyone in police detention has a right to free, private legal advice, and whether you took that advice affects how any inference is assessed.</li><li>The adverse-inference regime applies to police questioning and to trial; it does not remove the general principle that the prosecution must prove its case.</li></ul></div>

<h2>The Caution: Exact, Fixed Wording</h2>
<p>Unlike the US, where the Supreme Court has said no single script is required, the caution in England and Wales has fixed statutory wording set out in PACE Code C, paragraph 10.5: <em>"You do not have to say anything. But it may harm your defence if you do not mention when questioned something which you later rely on in court. Anything you do say may be given in evidence."</em> It must be given before someone is interviewed about their suspected involvement in an offence, and again after any break in questioning, arrest, or if the officer forgets whether it was already given.</p>

<h2>Adverse Inferences Under Sections 34–37</h2>
<p>The core rule sits in section 34 of the Criminal Justice and Public Order Act 1994: if, when questioned under caution before being charged, a person fails to mention a fact they later rely on in their defence at trial — a fact it would have been reasonable to mention at the time — the court or jury may draw "such inferences as appear proper" from that silence. Related provisions extend the principle: section 36 covers failing to account for an object, substance, or mark found on you; section 37 covers failing to account for your presence at a particular place. In each case, the inference is that the explanation later given may have been invented after the fact, precisely because it wasn't offered when it mattered.</p>
<p>Crucially, an adverse inference is only ever part of the picture. Following <em>R v Cowan</em> [1996], juries are directed that they cannot convict <strong>solely</strong> on the strength of an inference from silence — the prosecution must first establish a case to answer on other evidence, and only then may the inference be used to strengthen that case.</p>

<h2>When the Adverse-Inference Regime Doesn't Bite</h2>
<p>Several protections limit when section 34 can actually be used against someone. Following <em>R v Argent</em> [1997], courts weigh factors including the suspect's age, experience, mental capacity, and — significantly — whether they had access to legal advice and whether it was reasonable for them to rely on it. A suspect who stayed silent specifically on their solicitor's advice, given at the police station, is in a materially different position than one who simply refused to engage; genuine reliance on legal advice is a recognised, and often successful, answer to a proposed adverse inference, though it is not an automatic shield in every case. Special protections also apply to juveniles and vulnerable suspects, who must have an "appropriate adult" present during questioning.</p>

<h2>The Right to Free Legal Advice</h2>
<p>This is the safeguard that makes the whole system workable: under PACE section 58 and Code C, anyone held in police detention has the right to consult a solicitor privately and free of charge, at any time, through the duty solicitor scheme if they don't have their own. Given how much the section 34 analysis turns on whether legal advice was taken and reasonably relied upon, asking for a solicitor before answering any substantive question is the single most protective step available — it should never be treated as an admission of guilt or held against you for asking.</p>

<h2>How This Differs From "Miranda"</h2>
<p>The core contrast with the US Miranda warning is direct: an American suspect who is warned is told, in effect, that silence carries no cost at all. A suspect cautioned in England and Wales is told the opposite — that silence <em>can</em> harm their defence, in the specific circumstances the 1994 Act sets out. Both systems protect a right not to be forced to speak; they differ sharply on what happens to a defence built on staying silent at the police station and then explaining everything for the first time at trial.</p>

<h2>Frequently Asked Questions</h2>
<h3>Can I be convicted just because I said "no comment" in a police interview?</h3>
<p>No. An adverse inference from silence can only support a case that already has other evidence establishing a case to answer — it cannot, on its own, be the entire basis for a conviction.</p>
<h3>Does staying silent on legal advice protect me from an adverse inference?</h3>
<p>It significantly strengthens your position. Courts specifically consider whether a suspect had legal advice and whether relying on it was reasonable in the circumstances, though it is assessed case by case rather than an automatic guarantee.</p>
<h3>Do I have to answer questions before I've spoken to a solicitor?</h3>
<p>No — you have a right to free, private legal advice before and during questioning, and asking for it first is standard practice, not something that can itself be held against you.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Police and Criminal Evidence Act 1984 (PACE), section 58, and PACE Code C (2023 revision)</li>
<li>Criminal Justice and Public Order Act 1994, sections 34–37</li>
<li><em>R v Argent</em> [1997] 2 Cr App R 27 — factors relevant to legal-advice reliance</li>
<li><em>R v Cowan</em> [1996] QB 373 — jury direction limits on drawing inferences</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you are arrested or asked to attend a voluntary interview under caution, ask for a solicitor before answering substantive questions — it is free, it is your right, and it materially affects how any later silence is assessed. If you're unsure whether to answer a specific question, that uncertainty is itself a reason to get advice first rather than guess. For the general, worldwide picture of what happens when you're arrested, see <a href="/criminal-law/your-rights-if-you-are-arrested">What Are Your Rights If You Are Arrested?</a></p>

<p><em>This article is general legal information, not legal advice, and covers England and Wales specifically — Scotland and Northern Ireland have their own separate criminal procedure. Consult a solicitor before acting on anything here.</em></p>`,
  },
  {
    id: 'cl-303',
    title: 'Your Charter Rights When Arrested in Canada',
    slug: 'charter-rights-on-arrest-canada',
    alphabet: 'Y',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_police',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_police', name: 'Police Procedures', slug: 'police-procedures' },
    summary:
      "Canada's arrest rights come from the Charter, not a fixed script, and trigger on 'detention' broadly — different from US Miranda and UK caution rules.",
    author: 'Aisha Rahman',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'charter-rights-arrest-detention-canada',
    country: 'Canada',
    primarySources: [
      { label: 'Canadian Charter of Rights and Freedoms, sections 10 and 24(2)', url: 'https://laws-lois.justice.gc.ca/eng/const/page-12.html' },
      { label: 'R v Suberu, 2009 SCC 33 — "without delay" and detention triggering section 10', url: 'https://www.canlii.org/en/ca/scc/doc/2009/2009scc33/2009scc33.html' },
      { label: 'R v Sinclair, 2010 SCC 35 — scope of the right to counsel during questioning', url: 'https://www.canlii.org/en/ca/scc/doc/2010/2010scc35/2010scc35.html' },
      { label: 'R v Grant, 2009 SCC 32 — detention test and section 24(2) exclusion framework', url: 'https://www.canlii.org/en/ca/scc/doc/2009/2009scc32/2009scc32.html' },
    ],
    content: `<p>Canada has no single police script equivalent to the American Miranda warning or the fixed wording of the England and Wales caution. Instead, arrest and detention rights flow directly from the Canadian Charter of Rights and Freedoms — specifically section 10, which guarantees the right to be told why you're being held and the right to a lawyer. The Supreme Court of Canada has spent decades interpreting exactly what those guarantees require in practice, and the resulting framework is meaningfully different from both its American and British counterparts.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Section 10(a) guarantees the right to be promptly told the reason for your arrest or detention; section 10(b) guarantees the right to retain and instruct counsel "without delay."</li><li>Charter rights are triggered by "detention," a broader concept than formal arrest that can include being stopped and questioned without being told you're free to leave.</li><li>Section 10(b) creates three distinct police duties: inform you of the right, give you a reasonable opportunity to exercise it, and hold off eliciting evidence until you've had that opportunity.</li><li>The right to counsel generally does not include having a lawyer physically present during questioning, per <em>R v Sinclair</em> — a real difference from how some other systems operate.</li><li>Evidence obtained in breach of section 10 is not automatically excluded; courts apply a structured balancing test under section 24(2).</li></ul></div>

<h2>Section 10(a): The Right to Know Why</h2>
<p>Section 10(a) of the Charter guarantees that everyone has the right, on arrest or detention, to be informed promptly of the reasons for it. "Promptly" doesn't require a legal recitation of the charge on the spot, but it does require enough information, given without unreasonable delay, for the person to understand in general terms why their liberty is being restricted and to make an informed decision about how to respond, including whether to exercise the right to counsel.</p>

<h2>Section 10(b): The Right to Counsel</h2>
<p>Section 10(b) guarantees the right, on arrest or detention, to retain and instruct counsel without delay, and to be informed of that right. The Supreme Court held in <em>R v Suberu</em> (2009 SCC 33) that "without delay" means essentially immediately, subject only to genuine officer- or public-safety concerns and limits that are prescribed by law and justifiable. The Court has broken the guarantee down into three distinct police duties:</p>
<ol>
<li><strong>The informational duty</strong> — tell the detained person of their right to retain and instruct counsel, including that free preliminary legal advice is available regardless of financial means through a duty counsel service (often called a "Brydges line" in some provinces, after the case that established this obligation).</li>
<li><strong>The implementational duty</strong> — if the person indicates they want to exercise the right, give them a reasonable opportunity to do so (access to a phone, privacy, reasonable time).</li>
<li><strong>The duty to hold off</strong> — refrain from attempting to elicit evidence from the detainee until they have had that reasonable opportunity, except in urgent or dangerous circumstances.</li>
</ol>

<h2>Detention Is Broader Than Arrest</h2>
<p>One of the most important differences from a simple "arrest triggers rights" model is that section 10 rights attach at <strong>detention</strong>, which the Supreme Court has held can be psychological, not just physical. Following <em>R v Grant</em> (2009 SCC 32), a person is detained when a reasonable person in their shoes would conclude they had no choice but to comply with a police direction and were not free to leave, considering the circumstances of the encounter, what the police said or did, and the individual's own characteristics. This means a formal arrest is not the only moment that matters — an investigative stop can trigger the same section 10 obligations, as confirmed in <em>R v Suberu</em>.</p>

<h2>Counsel's Role: Advice, Not Necessarily Presence</h2>
<p>A significant and sometimes surprising limit comes from <em>R v Sinclair</em> (2010 SCC 35): section 10(b) generally guarantees the right to consult a lawyer before and, in most circumstances, once during police questioning — it does not, on its own, guarantee the right to have a lawyer physically present throughout the interrogation, and it does not generally require unlimited further consultations. The Court recognised an exception where circumstances genuinely change during questioning — new procedures, new and unanticipated jeopardy, or objective reason to doubt the detainee's understanding of their original advice — which can trigger a right to consult counsel again.</p>

<h2>What Happens If Section 10 Is Breached</h2>
<p>A Charter breach does not automatically throw out the resulting evidence. Section 24(2) of the Charter allows a court to exclude evidence obtained in a manner that infringed Charter rights only if admitting it would bring the administration of justice into disrepute. <em>R v Grant</em> set out the current three-part balancing test: the seriousness of the Charter-infringing state conduct, the impact of the breach on the detainee's Charter-protected interests, and society's interest in having the case decided on its merits. Exclusion is a considered remedy, not an automatic consequence.</p>

<h2>The Right to Silence Sits Separately, in Section 7</h2>
<p>Unlike section 10, the right to silence isn't spelled out by name in the Charter text — it flows from section 7's guarantee of fundamental justice and the common-law privilege against self-incrimination, as recognised in <em>R v Hebert</em> (1990). In practice this produces a genuinely different result from England and Wales: Canadian law does not have an equivalent to the adverse-inference regime under sections 34–37 of the UK's Criminal Justice and Public Order Act 1994. Silence during police questioning in Canada generally cannot be used by the Crown as evidence of guilt at trial.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do Canadian police have to inform me of my rights only if they formally arrest me?</h3>
<p>No. Section 10 rights are triggered by "detention," which the Supreme Court has interpreted to include situations where a reasonable person would feel they had no choice but to comply, even without a formal arrest.</p>
<h3>Can I insist my lawyer be physically present while police question me?</h3>
<p>Generally no. <em>R v Sinclair</em> held that section 10(b) protects your right to consult counsel, typically before questioning begins, but does not generally extend to having a lawyer present throughout the interview, absent a genuine change in circumstances during questioning.</p>
<h3>If police breach my Charter rights, does my case automatically get dismissed?</h3>
<p>No. The remedy is usually a request to exclude specific evidence under section 24(2), assessed through the <em>R v Grant</em> balancing test — not an automatic dismissal of the charges.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Canadian Charter of Rights and Freedoms, sections 7, 10, and 24(2)</li>
<li><em>R v Suberu</em>, 2009 SCC 33 — "without delay" and detention triggering section 10</li>
<li><em>R v Sinclair</em>, 2010 SCC 35 — scope of the right to counsel during questioning</li>
<li><em>R v Grant</em>, 2009 SCC 32 — detention test and section 24(2) exclusion framework</li>
<li>Department of Justice Canada, Charterpedia (sections 10(a), 10(b), and 24(2))</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you are detained or arrested in Canada, ask clearly and immediately to speak with a lawyer — free preliminary legal advice is available through duty counsel regardless of your ability to pay, and police are required to hold off trying to get evidence from you until you've had a reasonable opportunity to call. If you believe your section 10 rights were breached during an investigation, note the timeline in detail as soon as you can and raise it with a criminal defence lawyer, since whether evidence gets excluded turns heavily on the specific facts. For the general, worldwide picture of what happens when you're arrested, see <a href="/criminal-law/your-rights-if-you-are-arrested">What Are Your Rights If You Are Arrested?</a></p>

<p><em>This article is general legal information, not legal advice. Criminal procedure can vary by province in practice and changes over time — consult a criminal defence lawyer licensed in the relevant jurisdiction before acting.</em></p>`,
  },
  {
    id: 'cl-304',
    title: 'The Right to Silence in Australia Explained',
    slug: 'right-to-silence-australia',
    alphabet: 'T',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_police',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_police', name: 'Police Procedures', slug: 'police-procedures' },
    summary:
      'Australia has no bill of rights, so the right to silence rests on common law and the Evidence Act — and NSW carves out an exception for serious offences.',
    author: 'Aisha Rahman',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'right-to-silence-police-caution-australia',
    country: 'Australia',
    primarySources: [
      { label: 'Evidence Act 1995 (Cth), section 89 (evidence of silence)', url: 'https://www8.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ea199580/s89.html' },
      { label: 'Evidence Act 1995 (NSW), section 89A (special caution, serious indictable offences)', url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/ea199580/s89a.html' },
    ],
    content: `<p>Australia's starting point is different from the other three countries in this series. There is no national constitutional bill of rights equivalent to the US Bill of Rights or the Canadian Charter, so the right to silence rests on common law, reinforced by the uniform Evidence Act framework most states and territories have adopted. Criminal procedure is also predominantly a state and territory matter, which means the position is not perfectly uniform nationwide — most visibly in New South Wales, which carved out a real exception in 2013 that doesn't exist in the same form elsewhere.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>The right to silence in Australia is a common-law right, codified for evidentiary purposes at section 89 of the Evidence Act 1995 (Cth) and mirrored in most states and territories that adopted the uniform Evidence Act model.</li><li>Section 89 generally prevents an unfavourable inference from being drawn from a person's silence when questioned by police.</li><li>New South Wales is a significant exception: since 2013, section 89A allows an adverse inference in serious indictable offence cases, but only after a formal "special caution" given in the presence of a lawyer.</li><li>Criminal procedure varies by state and territory — always confirm the specific position where the questioning takes place rather than assuming a single national rule.</li><li>Access to legal aid, duty lawyers, and support-person requirements for young or vulnerable people also varies by jurisdiction.</li></ul></div>

<h2>The Common-Law Right to Silence</h2>
<p>The general position across Australia is that a person is not obliged to answer police questions beyond specific, narrow statutory exceptions (such as providing your name and address in some circumstances, or complying with vehicle-related identification laws while driving). The standard police caution reflects this: a formulation widely used is "You do not have to say or do anything, but anything you do say or do may be used in evidence." The underlying principle — that silence should not itself be treated as evidence of guilt — is a long-standing feature of the common law inherited from England, though, as explained below, England's own position has since diverged from it.</p>

<h2>Section 89 of the Evidence Act 1995</h2>
<p>At the Commonwealth level, section 89 of the Evidence Act 1995 gives the common-law right to silence statutory force: in a criminal proceeding, the court is not to draw an unfavourable inference from evidence that a person failed or refused to answer a question, or to respond to a representation, put or made to them by an investigating official. Most states and territories that adopted the uniform Evidence Act model — including New South Wales, Victoria, Tasmania, and the ACT — have an equivalent provision. States that retained their own, non-uniform evidence legislation (Queensland, South Australia, and Western Australia) still recognise a similar right at common law, but the exact statutory framework differs, which is one more reason to check the specific state's law rather than assume the Commonwealth text applies directly.</p>

<h2>New South Wales' Exception: The "Special Caution"</h2>
<p>The clearest example of state-level divergence is in New South Wales. The Evidence Amendment (Evidence of Silence) Act 2013 inserted section 89A into the NSW Evidence Act 1995, allowing an unfavourable inference to be drawn from a defendant's silence in defined circumstances — but only where all of the following apply: the offence is a <strong>serious indictable offence</strong> (broadly, one carrying a maximum penalty of five years' imprisonment or more), the suspect is 18 or older, and the police gave a formal "special caution" — in substance, that failing to mention a fact now which is later relied on in court may harm the defence — <strong>in the presence of an Australian legal practitioner acting for the suspect</strong>, after the suspect had a reasonable opportunity to consult that practitioner privately about what the special caution means. Without every one of those conditions being met, including the presence of a lawyer at the time of the caution, the ordinary section 89 protection continues to apply even in New South Wales. This is a state-specific carve-out, not the national rule — other states and territories do not have an equivalent provision as of this writing.</p>

<h2>Legal Advice and Support for Vulnerable People</h2>
<p>Access to duty lawyers and legal aid at the point of police questioning varies by state and territory, as do specific protections for young people and Aboriginal and Torres Strait Islander people — many jurisdictions require a support person, an "interview friend," or a parent/guardian to be present for a young suspect, and have specific notification obligations connected to Aboriginal legal services. Because these protections are set at the state and territory level and change over time, the specific requirements applicable to a given interview should be confirmed against that state or territory's current legislation rather than assumed to be uniform nationally.</p>

<h2>How Australia Compares to the US, UK, and Canada</h2>
<p>Placed alongside its common-law relatives, Australia sits closer to Canada than to England and Wales on the core question: outside New South Wales' narrow serious-offence carve-out, silence generally cannot be used as evidence of guilt, similar to the Canadian position under section 7 of the Charter, and unlike the broader adverse-inference regime that applies under sections 34–37 of England and Wales' Criminal Justice and Public Order Act 1994. Unlike the United States, there is no single constitutional warning requirement and no national "Miranda" case — the obligations instead come from a mix of common law, state and territory legislation, and (in most jurisdictions) the uniform Evidence Act.</p>

<h2>Frequently Asked Questions</h2>
<h3>Can my silence during police questioning be used against me anywhere in Australia?</h3>
<p>In most states and territories, no — section 89 of the Evidence Act (or the state equivalent) generally prevents an unfavourable inference from silence. New South Wales is the significant exception, and only where the strict section 89A conditions, including a lawyer's presence at the special caution, are all met.</p>
<h3>Is the NSW "special caution" the same as the ordinary police caution?</h3>
<p>No. The ordinary caution is given to everyone. The special caution under section 89A is a distinct, additional warning that only applies to serious indictable offences, only for adults, and only when a lawyer is present to explain its effect — without all of those conditions, it has no legal effect.</p>
<h3>Does Australia have a single national rule like the US Miranda warning?</h3>
<p>No. Criminal procedure is largely a state and territory responsibility, so while the underlying common-law right to silence is broadly shared, the precise statutory framework and any exceptions can differ by jurisdiction.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Evidence Act 1995 (Cth), section 89</li>
<li>Evidence Act 1995 (NSW), section 89A, inserted by the Evidence Amendment (Evidence of Silence) Act 2013</li>
<li>Judicial Commission of NSW, Criminal Trial Courts Bench Book — commentary on silence and section 89A</li>
<li>State and territory legal aid commissions, for current duty-lawyer and support-person requirements</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you're questioned by police anywhere in Australia, ask for a lawyer before answering substantive questions, and don't assume the rules you've read about one state apply automatically in another — criminal procedure genuinely differs across jurisdictions here. If you're in New South Wales and are given a formal special caution, treat that moment as significant: the law specifically requires you to have had a chance to consult a lawyer about what it means before it can have any legal effect. For the general, worldwide picture of what happens when you're arrested, see <a href="/criminal-law/your-rights-if-you-are-arrested">What Are Your Rights If You Are Arrested?</a></p>

<p><em>This article is general legal information, not legal advice. Criminal procedure varies by Australian state and territory and changes over time — consult a criminal lawyer licensed in the relevant jurisdiction before acting.</em></p>`,
  },
];
