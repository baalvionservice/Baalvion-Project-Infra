import type { LawArticle } from '../law-content';

const CRIMINAL_LAW_CATEGORY = {
  id: 'cat_criminal_law',
  name: 'Criminal Law',
  slug: 'criminal-law',
};

export const criminalLawExtraArticles: LawArticle[] = [
  {
    id: 'cl-101',
    title: 'What Are Your Rights If You Are Arrested?',
    slug: 'your-rights-if-you-are-arrested',
    alphabet: 'Y',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_police',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_police', name: 'Police Procedures', slug: 'police-procedures' },
    summary:
      'If you are arrested, you generally have the right to stay silent, to know why you are being held, and to a lawyer — knowing these rights protects you under pressure.',
    author: 'Aisha Rahman',
    updatedAt: 'June 16, 2026',
    readingTime: 9,
    views: 8910,
    featured: true,
    imageSeed: 'rights-on-arrest-police',
    content: `<p>If you are arrested, you have legal rights that exist precisely to protect you at a moment when you are vulnerable and outnumbered. In broad terms, almost every fair legal system gives an arrested person the right to be told why they are being detained, the right to remain silent rather than incriminate themselves, and the right to consult a lawyer. Knowing these rights in advance — and staying calm enough to use them — is one of the most practical pieces of legal knowledge anyone can carry.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>You generally have the right to be told the reason for your arrest.</li><li>You usually have the right to remain silent and not answer questions that could incriminate you.</li><li>You typically have the right to a lawyer, and in many places to free legal aid if you cannot pay.</li><li>Police powers and the exact warnings differ by country, but the core protections are widely shared.</li><li>Staying calm, polite, and non-resistant protects you even when you disagree with the arrest.</li></ul></div>

<h2>The Right to Know Why</h2>
<p>An arrest is a serious deprivation of liberty, so most legal systems require that you be informed, in plain terms, of the reason for it. This is not a courtesy; it lets you understand the allegation and decide how to respond. If you are not told, ask clearly and calmly. The reason given also matters later, because an arrest made without proper grounds may be challenged.</p>

<h2>The Right to Remain Silent</h2>
<p>Perhaps the most important protection is that you cannot generally be forced to incriminate yourself. You may decline to answer questions beyond basic identifying details, and in many systems your silence cannot be treated as proof of guilt.</p>
<h3>Why Silence Is Often Wise</h3>
<p>People frequently talk their way into trouble, trying to explain or argue under stress. Anything you say can usually be used as evidence. The safer course is to state politely that you wish to remain silent and to speak to a lawyer, and then to stop. This is not an admission of guilt; it is the use of a right designed to be used.</p>

<h2>The Right to a Lawyer</h2>
<p>You are typically entitled to consult a lawyer before and during questioning, and many countries provide a free or duty lawyer if you cannot afford one. A lawyer's role is to make sure the process is fair, to advise you on whether and how to answer, and to spot any irregularity in how you are being treated. Asking for a lawyer should not be held against you.</p>

<h2>How These Rights Appear Around the World</h2>
<p>The same core protections take different forms.</p>
<ul>
<li><strong>United States:</strong> Police must give the "Miranda" warning — the right to remain silent and to an attorney — before custodial questioning.</li>
<li><strong>United Kingdom:</strong> A caution is read on arrest, and detainees have a right to free legal advice; however, silence can in limited circumstances be commented on at trial.</li>
<li><strong>European Union:</strong> Directives guarantee the right to information, to interpretation, and to access a lawyer across member states.</li>
<li><strong>India:</strong> The constitution protects against self-incrimination, and detainees must be informed of the grounds of arrest and produced before a magistrate within a set time.</li>
</ul>

<h2>How to Conduct Yourself During an Arrest</h2>
<p>Knowing your rights is only half the picture; how you behave matters too.</p>
<ul>
<li>Do not physically resist, even if you believe the arrest is wrong — challenge it later, lawfully.</li>
<li>Keep your hands visible and avoid sudden movements.</li>
<li>State clearly that you wish to remain silent and to speak to a lawyer.</li>
<li>Do not consent to searches you are not obliged to allow, but do not obstruct lawful ones.</li>
<li>Try to remember names, badge numbers, times, and what was said.</li>
</ul>

<h2>After the Arrest</h2>
<p>Once in custody you may be questioned, searched, and processed. You generally retain the right to legal advice throughout, the right to be held in humane conditions, and the right to be brought before a court within a legally defined period rather than detained indefinitely. If you believe your rights were breached — for example, if questioning continued after you asked for a lawyer — note the details, as they can affect whether evidence is later admitted.</p>

<h2>Practical Next Steps</h2>
<p>Learn the basic arrest rules for the country and region where you live or travel, since the warnings and time limits differ. If you or someone you know is arrested, prioritise three things: stay calm and non-resistant, clearly invoke the right to silence and a lawyer, and keep a careful record of what happened. Contact a criminal defence lawyer as soon as possible, because early advice often shapes the entire outcome.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'cl-102',
    title: 'Misdemeanor vs Felony: What Is the Difference?',
    slug: 'misdemeanor-vs-felony',
    alphabet: 'M',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_defense',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_defense', name: 'Criminal Defense', slug: 'criminal-defense' },
    summary:
      'A misdemeanor is a less serious crime with lighter penalties, while a felony is a serious offence carrying heavier punishment and longer-lasting consequences.',
    author: 'Daniel Okafor',
    updatedAt: 'June 9, 2026',
    readingTime: 8,
    views: 7150,
    featured: false,
    imageSeed: 'misdemeanor-felony-severity',
    content: `<p>The difference between a misdemeanor and a felony is, at heart, a difference of seriousness. A misdemeanor is a less serious crime, usually punishable by a short jail term, a fine, or community-based penalties. A felony is a serious offence, typically punishable by a year or more of imprisonment and carrying consequences that can follow a person long after the sentence ends. This classification, most familiar from the United States, shapes how a case is charged, tried, and punished.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Misdemeanors are minor crimes with lighter penalties; felonies are serious crimes with heavier ones.</li><li>The dividing line is often the maximum length of imprisonment available for the offence.</li><li>Felony convictions carry lasting collateral consequences, from voting limits to employment barriers.</li><li>The same conduct can be charged differently depending on the facts and the jurisdiction.</li><li>Not every country uses these exact terms; other systems classify offences in their own ways.</li></ul></div>

<h2>Where the Line Is Drawn</h2>
<p>The clearest dividing line is the potential punishment. In systems that use these labels, a felony is generally an offence for which the law allows imprisonment of about a year or more, often served in a prison, while a misdemeanor is punishable by a shorter term, frequently served in a local jail, or by fines and community penalties. The exact threshold is set by statute, so the same act may be a misdemeanor in one place and a felony in another.</p>

<h2>Examples of Each</h2>
<p>While categorisation varies, some patterns are common.</p>
<h3>Typical Misdemeanors</h3>
<ul>
<li>Petty theft of low-value items.</li>
<li>Simple assault without serious injury.</li>
<li>Minor drug possession, in some jurisdictions.</li>
<li>Disorderly conduct or trespass.</li>
</ul>
<h3>Typical Felonies</h3>
<ul>
<li>Serious violent crimes such as robbery or aggravated assault.</li>
<li>Burglary and large-scale theft or fraud.</li>
<li>Trafficking offences.</li>
<li>Homicide and other grave crimes.</li>
</ul>

<h2>How Severity Affects the Process</h2>
<p>The classification does more than set a maximum penalty; it shapes the whole procedure. Felony cases usually involve more formal steps — such as a grand jury or committal process in some systems — stricter bail considerations, and a greater right to a jury trial. Misdemeanors are often handled more quickly in lower courts. Because the stakes are higher, the procedural protections around felonies tend to be stronger.</p>

<h2>Consequences Beyond the Sentence</h2>
<p>A felony conviction frequently brings "collateral consequences" that outlast any prison term. Depending on the jurisdiction, these can include loss of voting rights, restrictions on owning firearms, difficulty obtaining certain jobs or professional licences, immigration consequences for non-citizens, and a lasting mark on background checks. Misdemeanors carry lighter collateral effects, though they can still appear on records and affect employment. Understanding these downstream effects is often as important as understanding the immediate penalty.</p>

<h2>How Other Systems Classify Crimes</h2>
<p>The misdemeanor–felony split is most associated with the United States, but other countries organise seriousness differently.</p>
<ul>
<li><strong>United States:</strong> Crimes are graded as felonies, misdemeanors, and sometimes infractions, with degrees within each.</li>
<li><strong>United Kingdom:</strong> The old felony–misdemeanor distinction was abolished; offences are now classified by how they are tried — summary, either-way, or indictable.</li>
<li><strong>European Union:</strong> Many civil-law countries use tiers such as petty offences, misdemeanors, and serious crimes under their penal codes.</li>
<li><strong>India:</strong> Offences are categorised in ways such as cognisable or non-cognisable and bailable or non-bailable, which shape arrest and bail rather than a felony label.</li>
</ul>

<h2>Why the Same Act Can Be Charged Differently</h2>
<p>Prosecutors often have discretion, and facts matter. The value stolen, whether a weapon was used, whether someone was injured, and a person's prior record can all push an offence from one category to another. This is why two superficially similar incidents can lead to very different charges, and why early legal advice can influence how a case is framed.</p>

<h2>Practical Next Steps</h2>
<p>If you are facing a charge, find out precisely how the offence is classified where you are, because that determines the realistic range of outcomes and the procedure ahead. Take the collateral consequences seriously, not just the headline sentence, and gather any documents relevant to your case. Speak to a criminal defence lawyer early — the classification of a charge is sometimes negotiable, and skilled, timely advice can materially change the result.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
