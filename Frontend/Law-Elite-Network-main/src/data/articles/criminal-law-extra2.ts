import type { LawArticle } from '../law-content';

const CRIMINAL_LAW_CATEGORY = {
  id: 'cat_criminal_law',
  name: 'Criminal Law',
  slug: 'criminal-law',
};

export const criminalLawExtra2Articles: LawArticle[] = [
  {
    id: 'cl-201',
    title: 'DUI and DWI: The Basics of Drunk-Driving Law',
    slug: 'dui-dwi-basics',
    alphabet: 'D',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_defense',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_defense', name: 'Criminal Defense', slug: 'criminal-defense' },
    summary:
      'DUI and DWI are offences for driving while impaired by alcohol or drugs, usually measured against a legal blood-alcohol limit and carrying fines, licence loss, and sometimes jail.',
    author: 'Daniel Okafor',
    updatedAt: 'June 21, 2026',
    readingTime: 9,
    views: 7840,
    featured: false,
    imageSeed: 'dui-dwi-drunk-driving-law',
    content: `<p>DUI ("driving under the influence") and DWI ("driving while intoxicated") are criminal offences for operating a vehicle while your ability to drive safely is impaired by alcohol or drugs. The terms are used differently from place to place, but the underlying idea is the same everywhere: driving while impaired endangers others, so the law sets a measurable limit — usually a blood-alcohol concentration — above which driving becomes an offence, regardless of whether you feel drunk. The consequences typically include fines, licence suspension, and in serious cases imprisonment.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>DUI/DWI offences punish driving while impaired by alcohol or drugs, often based on a blood-alcohol limit.</li><li>You can be over the limit and guilty even if you feel capable of driving.</li><li>Penalties commonly include fines, licence suspension, mandatory courses, and possible jail time.</li><li>Refusing a breath or blood test often carries its own penalties under "implied consent" rules.</li><li>The legal limit, terminology, and penalties differ significantly by country and region.</li></ul></div>

<h2>How Impairment Is Measured</h2>
<p>Most systems rely on a blood-alcohol concentration (BAC) limit — a percentage of alcohol in the bloodstream. Drivers at or above that threshold are treated as impaired "per se", meaning the prosecution does not have to prove their driving was actually affected; the reading alone establishes the offence. Police usually measure BAC with a roadside breath test, which may be confirmed by a more precise breath, blood, or urine analysis. Impairment by drugs, including some prescription medicines, can also support a charge even where there is no fixed numeric limit.</p>

<h2>DUI vs DWI: A Note on Terminology</h2>
<p>The labels vary and can be confusing. In some places "DUI" and "DWI" are interchangeable; in others they describe different offences — for example, one for alcohol and one for drugs, or one for a lower and one for a higher level of impairment. Many countries do not use either term, speaking instead of "drink driving" or "driving over the prescribed limit". What matters is the conduct, not the acronym.</p>

<h2>Typical Penalties</h2>
<p>Penalties escalate with the level of impairment, prior offences, and any harm caused. A first offence often brings:</p>
<ul>
<li>A fine and a criminal record.</li>
<li>Suspension or disqualification of the driving licence.</li>
<li>Mandatory alcohol-awareness or rehabilitation courses.</li>
<li>Higher insurance costs and, in some places, an ignition interlock device.</li>
</ul>
<p>Repeat offences, very high readings, or cases involving injury or death can lead to longer disqualification and imprisonment. Causing a fatal crash while impaired is treated extremely seriously almost everywhere.</p>

<h2>Implied Consent and Refusing a Test</h2>
<p>Many jurisdictions operate "implied consent" rules: by driving on public roads, you are deemed to have agreed to provide a breath or blood sample when lawfully required. Refusing without a valid reason is often a separate offence, sometimes carrying penalties as severe as — or harsher than — failing the test itself. This is a common trap, because drivers assume refusing protects them when it frequently does the opposite.</p>

<h2>How the Law Differs Around the World</h2>
<ul>
<li><strong>United States:</strong> Limits and terminology vary by state, with a common general limit of 0.08% BAC and lower thresholds for commercial or young drivers.</li>
<li><strong>United Kingdom:</strong> Drink-driving is an offence above set limits, and refusing to provide a specimen is itself a crime; Scotland uses a lower limit than England and Wales.</li>
<li><strong>European Union:</strong> Most member states set limits at or below 0.05%, with stricter limits for novice and professional drivers.</li>
<li><strong>India:</strong> Driving with blood alcohol above the prescribed limit is an offence under the Motor Vehicles Act, with fines, imprisonment, and licence consequences.</li>
</ul>

<h2>What to Do If You Are Stopped</h2>
<p>If you are pulled over on suspicion of impaired driving, stay calm and polite, and remember you generally still have the right to remain silent beyond basic identification and the right to legal advice. Do not argue at the roadside; comply with lawful instructions while noting what happens. Because refusal of testing often carries penalties, understand the rules where you are before deciding how to respond, and contact a defence lawyer as soon as possible.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Assuming "feeling fine" means you are under the limit — BAC is what counts.</li>
<li>Driving the morning after heavy drinking, when alcohol may still be in your system.</li>
<li>Refusing a lawful test without realising it is often a separate offence.</li>
<li>Not taking a first charge seriously, which can worsen any later offence.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>The safest approach is prevention: if you have been drinking or taking impairing medication, do not drive. If you are charged, learn the precise offence and limit that apply where it happened, gather any documentation, and speak with a criminal defence lawyer early — procedural details around testing and stops can significantly affect the outcome.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'cl-202',
    title: 'Your Rights During a Police Search',
    slug: 'your-rights-during-a-police-search',
    alphabet: 'Y',
    categoryId: 'cat_criminal_law',
    subcategoryId: 'sub_cl_police',
    category: CRIMINAL_LAW_CATEGORY,
    subcategory: { id: 'sub_cl_police', name: 'Police Procedures', slug: 'police-procedures' },
    summary:
      'Police usually need a warrant or a recognised exception to search you, your home, or your car — and knowing when a search is lawful protects you and any later defence.',
    author: 'Aisha Rahman',
    updatedAt: 'June 19, 2026',
    readingTime: 9,
    views: 8350,
    featured: true,
    imageSeed: 'rights-during-police-search',
    content: `<p>A police search is a serious intrusion on privacy, so most legal systems require the police to have a proper legal basis before searching your body, your home, your car, or your devices. In broad terms, that basis is usually either a warrant issued by a court, your genuine consent, or a recognised exception such as immediate danger or evidence about to be destroyed. Understanding when a search is lawful — and how to respond when one happens — protects your privacy and can be decisive if a case ever reaches court.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Police generally need a warrant, your consent, or a legal exception to search you or your property.</li><li>You usually have the right to refuse consent to a search that is not otherwise authorised.</li><li>Evidence obtained through an unlawful search may be excluded from a trial in many systems.</li><li>You should not physically resist a search, even one you believe is unlawful — challenge it later.</li><li>Search powers vary widely by country, so knowing local rules matters.</li></ul></div>

<h2>The General Rule: A Search Needs a Basis</h2>
<p>The starting point in many systems is that searches must be authorised. The most secure authorisation is a warrant — a document issued by a judge or magistrate who has decided there are sufficient grounds. A warrant typically describes what may be searched and what the police are looking for, and searches that stray beyond its terms can be challenged. Without a warrant, the police must usually rely on consent or a specific legal exception.</p>

<h2>Consent Searches</h2>
<p>If you voluntarily agree, the police can search even without a warrant. This is one of the most important things to understand, because consent waives protections you would otherwise have. Consent must generally be genuine and freely given, not the product of threats or trickery. You usually have the right to decline politely. Saying "I do not consent to this search" does not make you guilty of anything; it simply preserves your rights and any later legal argument.</p>

<h2>Common Exceptions to the Warrant Requirement</h2>
<p>Most systems recognise situations where police may search without a warrant. These often include:</p>
<ul>
<li><strong>Search incident to arrest:</strong> a limited search of a person and their immediate surroundings when they are lawfully arrested.</li>
<li><strong>Exigent or emergency circumstances:</strong> where there is an urgent need to prevent harm or stop evidence being destroyed.</li>
<li><strong>Plain view:</strong> seizing items that are obviously illegal and visible without a search.</li>
<li><strong>Stop and search powers:</strong> brief searches on reasonable suspicion, available in many jurisdictions under defined conditions.</li>
</ul>

<h2>Searches of Different Places</h2>
<h3>Your Home</h3>
<p>The home usually receives the strongest protection. Police typically need a warrant or a clear exception to enter and search, and you can ask to see the warrant before allowing entry.</p>
<h3>Your Vehicle</h3>
<p>Cars often attract lower protection because they are mobile, and many systems allow searches on reasonable suspicion. Still, the police generally need some lawful ground, not mere curiosity.</p>
<h3>Your Phone and Devices</h3>
<p>Digital devices hold vast amounts of personal data, and many courts now treat searching a phone as especially intrusive, frequently requiring a warrant. You are often not obliged to volunteer passwords, though rules on compelled disclosure vary.</p>

<h2>How These Rights Appear Around the World</h2>
<ul>
<li><strong>United States:</strong> The Fourth Amendment protects against unreasonable searches; unlawfully obtained evidence may be excluded.</li>
<li><strong>United Kingdom:</strong> Police search powers are set out in statute, including stop-and-search on reasonable grounds, with codes of practice governing their use.</li>
<li><strong>European Union:</strong> Privacy and data-protection rights, alongside national law, constrain searches, particularly of personal data and devices.</li>
<li><strong>India:</strong> Search and seizure are regulated by criminal procedure law, with requirements such as independent witnesses for certain searches.</li>
</ul>

<h2>How to Respond During a Search</h2>
<ul>
<li>Stay calm and keep your hands visible; do not physically resist.</li>
<li>Ask whether you are being detained and on what basis.</li>
<li>State clearly and politely if you do not consent to a search.</li>
<li>Ask to see a warrant where one should exist.</li>
<li>Note officers' details, the time, and exactly what was searched or taken.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Because search powers differ so much, learn the basic rules for where you live or travel, especially around stop-and-search and vehicle searches. If you believe a search was unlawful, do not argue at the scene — comply, record what happened, and raise it afterward with a lawyer. An improper search can sometimes lead to evidence being excluded, so early legal advice is valuable whenever a search has played a part in a case.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
