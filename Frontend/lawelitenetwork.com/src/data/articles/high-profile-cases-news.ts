import type { LawArticle } from '../law-content';

export const highProfileNewsArticles: LawArticle[] = [
  {
    id: 'art-hp-001',
    title: 'U.S. Supreme Court Constitutional Analysis: Presidential Immunity, Executive Authority, and Separation of Powers in Federal Litigation',
    slug: 'donald-trump-constitutional-immunity-ruling-analysis',
    alphabet: 'U',
    categoryId: 'constitutional-law',
    subcategoryId: 'executive-power',
    category: { id: 'constitutional-law', name: 'Constitutional Law', slug: 'constitutional-law' },
    subcategory: { id: 'executive-power', name: 'Executive Power', slug: 'executive-power' },
    summary: 'An in-depth legal analysis of presidential immunity jurisprudence, constitutional separation of powers, and the Supreme Court docket involving Donald Trump, Chief Justice John Roberts, Justice Sonia Sotomayor, Justice Clarence Thomas, and Special Counsel Jack Smith.',
    content: `
      <h2>Executive Immunity and the Architecture of Article II</h2>
      <p>The boundary between official presidential conduct and personal candidate actions represents one of the most significant constitutional inquiries in modern jurisprudence. In <em>Trump v. United States</em> (2024), the Supreme Court established a tripartite framework for evaluating presidential immunity under Article II of the U.S. Constitution.</p>

      <div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Absolute immunity applies to core constitutional duties exclusively assigned to the Executive Branch under Article II.</li>
          <li>Presumptive immunity applies to official actions within the outer perimeter of presidential responsibility.</li>
          <li>No immunity attaches to unofficial, purely private acts executed by a president.</li>
          <li>Courts cannot inquire into executive motives when classifying official acts.</li>
        </ul>
      </div>

      <h2>Divergent Judicial Opinions: Chief Justice Roberts, Justice Sotomayor, and Justice Thomas</h2>
      <p>Writing for the majority, Chief Justice <strong>John Roberts</strong> reasoned that presidential independence requires structural protection against post-tenure criminal prosecution for core executive functions. Concurring separately, Justice <strong>Clarence Thomas</strong> raised fundamental constitutional questions regarding the statutory creation and appointment of Special Counsel officers under Article II.</p>
      <p>In dissent, Justice <strong>Sonia Sotomayor</strong> articulated a contrasting doctrine, arguing that absolute immunity for official acts alters the historical principle that no individual stands above the law. The ruling arose from the federal election-subversion prosecution brought by Special Counsel <strong>Jack Smith</strong>. After the 2024 election that case was dismissed (November 2024), and Smith submitted his final report and left the Department of Justice in January 2025. The Court’s opinion remains the governing precedent on presidential criminal immunity.</p>

      <h2>Impact on Future Federal Prosecutions and Civil Proceedings</h2>
      <p>For litigators and constitutional scholars, the ruling changes how federal prosecutors must draft indictments involving conduct by a President or former President. Courts applying it must sort alleged conduct into official and unofficial acts, and the Court’s opinion bars inquiry into the President’s motives when doing so.</p>
    `,
    author: 'Law Elite Network Editorial Board',
    updatedAt: 'September 20, 2026',
    modifiedAt: '2026-09-21',
    readingTime: 8,
    views: 0,
    featured: true,
    imageSeed: 'trump-immunity-analysis',
    country: 'United States',
    primarySources: [
      { label: 'U.S. Supreme Court Opinion — Trump v. United States, 603 U.S. ___ (2024)', url: 'https://www.supremecourt.gov/opinions/23pdf/23-939_e2pg.pdf' },
      { label: 'CNN: Special counsel Jack Smith has resigned (11 January 2025)', url: 'https://www.cnn.com/2025/01/11/politics/jack-smith-resigns-special-counsel-doj/index.html' },
      { label: 'U.S. Constitution — Article II Executive Power Provisions', url: 'https://www.archives.gov/founding-docs/constitution-transcript#toc-article-ii-' },
    ],
  },
  {
    id: 'art-hp-002',
    title: 'Corporate Governance & Executive Compensation: Delaware Court of Chancery Legal Framework for Board Fiduciary Duties',
    slug: 'elon-musk-delaware-corporate-governance-chancery-court',
    alphabet: 'C',
    categoryId: 'corporate-law',
    subcategoryId: 'fiduciary-duties',
    category: { id: 'corporate-law', name: 'Corporate Law', slug: 'corporate-governance' },
    subcategory: { id: 'fiduciary-duties', name: 'Fiduciary Duties', slug: 'fiduciary-duties' },
    summary:
      'An overview of Delaware’s approach to controlling-stockholder transactions and executive pay, using the Tornetta v. Musk litigation over Tesla’s 2018 pay package, and the 2025 changes to Section 144 of the Delaware General Corporation Law.',
    content: `
      <h2>Tornetta v. Musk: what the courts decided</h2>
      <p>In <em>Tornetta v. Musk</em>, a Tesla stockholder challenged the 2018 equity award to CEO <strong>Elon Musk</strong>. On 30 January 2024 the Delaware Court of Chancery (Chancellor McCormick) found that Musk controlled Tesla, applied the “entire fairness” standard, held that the defendants had not proved fairness, and ordered the award rescinded. On 19 December 2025 the Delaware Supreme Court reversed the rescission remedy, holding it improper, and awarded $1 in nominal damages; according to law-firm summaries, its opinion did not decide the trial court’s liability rulings.</p>

      <div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Historical rule: conflicted controlling-stockholder transactions were reviewed for “entire fairness” unless the process satisfied the <em>MFW</em> framework (approval by an independent special committee and by an uncoerced majority-of-the-minority vote), which restored business judgment review.</li>
          <li>Court decision: the Court of Chancery applied entire fairness to Tesla’s 2018 award in 2024; the Delaware Supreme Court in December 2025 set aside the remedy of rescission.</li>
          <li>Later statutory change: Senate Bill 21, signed on 25 March 2025, amended Section 144 of the Delaware General Corporation Law to create statutory safe-harbor procedures for certain controlling-stockholder transactions and to define “controlling stockholder” and director independence. The Delaware Supreme Court upheld the amendments’ constitutionality in <em>Rutledge v. Clearway Energy Group</em> (27 February 2026).</li>
          <li>Current rule: for transactions covered by amended Section 144, the statutory safe harbors now apply; the exact conditions depend on the statute’s text and the type of transaction, so the statute itself should be consulted.</li>
        </ul>
      </div>

      <h2>Disclosure and independence</h2>
      <p>Directors who seek a stockholder vote must not mislead stockholders. For public companies, SEC Rule 14a-9 separately prohibits false or misleading statements in proxy solicitations. Tornetta was decided under the law as it stood before the 2025 amendments, and this article does not address how the amendments would apply to a comparable award today.</p>
    
    `,
    author: 'Law Elite Network Editorial Board',
    updatedAt: 'September 18, 2026',
    modifiedAt: '2026-09-21',
    readingTime: 7,
    views: 0,
    featured: true,
    imageSeed: 'musk-delaware-chancery',
    country: 'United States',
    primarySources: [
      { label: 'Tornetta v. Musk, C.A. No. 2018-0408-KSJM (Del. Ch. Jan. 30, 2024)', url: 'https://courts.delaware.gov/Opinions/Download.aspx?id=372420' },
      { label: 'In re Tesla, Inc., No. 534, 2024 (Del. Dec. 19, 2025)', url: 'https://courts.delaware.gov/Opinions/Download.aspx?id=389200' },
      { label: 'Gibson Dunn: Delaware reinstates Musk’s pay package, slashes $345 million fee award', url: 'https://www.gibsondunn.com/delaware-reinstates-musk-pay-package-slashes-345-million-fee-award/' },
      { label: 'Jones Day: Delaware Supreme Court upholds constitutionality of DGCL amendments adopted as SB 21', url: 'https://www.jonesday.com/en/insights/2026/03/delaware-supreme-court-upholds-constitutionality-of-dgcl-amendments-adopted-as-sb-21' },
      { label: 'Delaware General Corporation Law § 144', url: 'https://delcode.delaware.gov/title8/c001/sc04/' },
    ],
  },
  {
    id: 'art-hp-003',
    title: 'State RICO Statutes and Public Integrity Litigation: Legal Standards in High-Profile Multi-Defendant Indictments',
    slug: 'fani-willis-racketeering-statute-jurisprudence-analysis',
    alphabet: 'S',
    categoryId: 'criminal-law',
    subcategoryId: 'racketeering',
    category: { id: 'criminal-law', name: 'Criminal Law', slug: 'criminal-defense' },
    subcategory: { id: 'racketeering', name: 'Racketeering & Prosecution', slug: 'criminal-defense' },
    summary:
      'A legal overview of the Georgia RICO Act and how it was used in the Fulton County prosecution of Donald Trump and others, including the disqualification of the district attorney and the 2025 dismissal.',
    content: `
      <h2>Georgia’s RICO statute</h2>
      <p>Georgia’s Racketeer Influenced and Corrupt Organizations (RICO) Act, O.C.G.A. § 16-14-1 and following, allows prosecutors to charge a pattern of racketeering activity, defined as at least two related acts of racketeering. The statute treats a wide range of state offenses as racketeering activity. In August 2023 Fulton County District Attorney <strong>Fani Willis</strong> used it to indict Donald Trump and others over efforts to change the result of the 2020 presidential election in Georgia.</p>

      <div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Georgia RICO requires proof of an “enterprise” and a pattern of racketeering activity of at least two acts (O.C.G.A. § 16-14-3).</li>
          <li>On 19 December 2024 the Georgia Court of Appeals disqualified Willis and her office from the case (2–1) because of a “significant appearance of impropriety,” while declining to dismiss the indictment (<em>Trump v. State</em>, A24A1599).</li>
          <li>On 16 September 2025 the Supreme Court of Georgia declined to review that ruling.</li>
          <li>On 26 November 2025, after the case was taken over by the executive director of the Prosecuting Attorneys’ Council of Georgia, Peter Skandalakis, the trial judge dismissed the case in its entirety on the prosecution’s motion. The case is therefore concluded.</li>
        </ul>
      </div>

      <h2>Why the procedure matters</h2>
      <p>The case shows how a conflict-of-interest challenge can end a prosecution even where the indictment itself survives: the disqualification removed the elected prosecutor and her office, and the successor prosecutor moved to dismiss.</p>
    
    `,
    author: 'Law Elite Network Editorial Board',
    updatedAt: 'September 15, 2026',
    modifiedAt: '2026-09-21',
    readingTime: 6,
    views: 0,
    featured: false,
    imageSeed: 'rico-prosecution-analysis',
    country: 'United States',
    primarySources: [
      { label: 'Official Code of Georgia Annotated (O.C.G.A.) § 16-14-1 et seq. (Georgia RICO Act)', url: 'https://law.justia.com/codes/georgia/' },
      { label: 'Trump v. State, No. A24A1599 (Ga. Ct. App. Dec. 19, 2024)', url: 'https://law.justia.com/cases/georgia/court-of-appeals/2024/a24a1599.html' },
      { label: 'Supreme Court of Georgia, Case Nos. S25C0587 et seq. (Sept. 2025)', url: 'https://efile.gasupreme.us/viewFiling?filingId=1c35b6ca-b748-4c14-93c6-efcf70f34473' },
      { label: 'NPR: The Georgia election interference case against Trump and others has been dropped (26 November 2025)', url: 'https://www.npr.org/2025/11/26/nx-s1-5611431/georgia-trump-election-case-dismissed' },
    ],
  },
  {
    id: 'art-hp-004',
    title: 'Music Master Recordings, Re-Recording Rights, and Copyright Ownership under U.S. Intellectual Property Law',
    slug: 'taylor-swift-master-recording-ip-rights-analysis',
    alphabet: 'M',
    categoryId: 'intellectual-property',
    subcategoryId: 'copyright-law',
    category: { id: 'intellectual-property', name: 'Intellectual Property', slug: 'intellectual-property' },
    subcategory: { id: 'copyright-law', name: 'Copyright Law', slug: 'intellectual-property' },
    summary: 'Master recordings and the songs they contain are separate copyrights with separate owners. This short guide explains the difference and how re-recording works.',
    content: `
      <h2>Two Copyrights in Every Recording</h2>
      <p>Under U.S. copyright law a commercial song involves two distinct works: the musical composition (melody and lyrics) and the sound recording, known as the master. They can be owned by different parties. A label often owns the master while the songwriter owns the composition.</p>

      <div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>The composition and the master are separate copyrights and can have different owners.</li>
          <li>Recording contracts commonly limit re-recording for a set period; the length is set by each contract, not by statute.</li>
          <li>A songwriter who owns the composition can make and release a new recording of it once any contractual restriction ends.</li>
        </ul>
      </div>

      <h2>A Public Example</h2>
      <p>Taylor Swift&rsquo;s re-recordings of her first six albums are the best-known case of an artist doing this. For the full timeline, see our article <a href="/article/taylor-swift-masters-who-owns-a-recording-explained">Who Owns a Song? Taylor Swift, Her Masters, and the Two Copyrights Behind Every Recording</a>.</p>
    `,
    author: 'Law Elite Network Editorial Board',
    updatedAt: 'September 12, 2026',
    readingTime: 6,
    views: 0,
    featured: false,
    imageSeed: 'taylor-swift-ip-rights',
    country: 'United States',
    primarySources: [
      { label: 'U.S. Copyright Act — 17 U.S.C. § 102(a)(2) & (7)', url: 'https://www.copyright.gov/title17/' },
    ],
  },
  {
    id: 'art-hp-005',
    title: 'Prosecutorial Discretion and Criminal Justice Reform: The Jurisprudential Legacy of State Attorneys General',
    slug: 'kamala-harris-prosecutorial-discretion-and-criminal-justice',
    alphabet: 'P',
    categoryId: 'criminal-law',
    subcategoryId: 'prosecutorial-ethics',
    category: { id: 'criminal-law', name: 'Criminal Law', slug: 'criminal-defense' },
    subcategory: { id: 'prosecutorial-ethics', name: 'Prosecutorial Ethics', slug: 'criminal-defense' },
    summary: 'Analysis of prosecutorial discretion, criminal justice administration, and legal policy under former California Attorney General and Vice President Kamala Harris.',
    content: `
      <h2>The Framework of Prosecutorial Discretion in State Justice Systems</h2>
      <p>District attorneys and state attorneys general possess significant constitutional authority in determining charge selection, diversion programs, and appellate litigation. As District Attorney of San Francisco and later Attorney General of California, <strong>Kamala Harris</strong> instituted policies emphasizing data-driven recidivism reduction alongside traditional enforcement.</p>

      <div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>
          <li>Prosecutorial discretion is bounded by constitutional equal protection and statutory criminal procedure mandates.</li>
          <li>State Attorneys General manage statewide law enforcement oversight, consumer protection litigation, and criminal appeals.</li>
        </ul>
      </div>
    `,
    author: 'Law Elite Network Editorial Board',
    updatedAt: 'September 10, 2026',
    readingTime: 5,
    views: 0,
    featured: false,
    imageSeed: 'kamala-harris-prosecution-law',
    country: 'United States',
    primarySources: [
      { label: 'California Department of Justice — Office of the Attorney General Historical Records', url: 'https://oag.ca.gov/' },
    ],
  },
  {
    id: 'art-hp-006',
    title: 'Who Owns a Song? Taylor Swift, Her Masters, and the Two Copyrights Behind Every Recording',
    slug: 'taylor-swift-masters-who-owns-a-recording-explained',
    alphabet: 'W',
    categoryId: 'intellectual-property',
    subcategoryId: 'copyright-law',
    category: { id: 'intellectual-property', name: 'Intellectual Property', slug: 'intellectual-property' },
    subcategory: { id: 'copyright-law', name: 'Copyright Law', slug: 'intellectual-property' },
    summary: 'A plain-English look at why an artist can write a song and still not own the recording of it, using the public dispute over Taylor Swift’s first six albums.',
    content: `
      <p>Most fans assume the person who wrote a song owns it. The music business splits that idea in two, and the split is the whole story behind one of the most public rights disputes in recent pop history.</p>

      <h2>Two copyrights, two owners</h2>
      <p>A recorded song carries two separate copyrights. One covers the composition, meaning the melody and lyrics. The other covers the sound recording, the specific performance that was captured in a studio. The industry calls that recording the <em>master</em>. Different people can own each one.</p>
      <p>In Swift’s case, she wrote her songs and, as widely reported, kept her publishing. Big Machine Records, the label she signed with as a teenager in the mid-2000s, owned the masters of her first six albums.</p>

      <h2>The sale that started the fight</h2>
      <p>In June 2019, Scooter Braun’s company Ithaca Holdings bought Big Machine Label Group, and with it those masters. Swift objected publicly, saying she had wanted a chance to buy her own recordings and had not been given one on terms she could accept. Braun’s side disputed her account. Both accounts were made in public statements, not in a courtroom, and this article does not decide between them.</p>
      <p>In November 2020 the masters were reported to have been sold again, this time to an investment firm, Shamrock Capital. Swift said she had not been offered a chance to buy them in that deal either.</p>

      <h2>Re-recording as a workaround</h2>
      <p>Swift could not take back the old masters, but she could record new ones. Recording contracts commonly limit how soon an artist may re-record songs they made for a label, and those limits eventually run out. Once hers did, she began remaking her albums and releasing them as “Taylor’s Version.”</p>
      <ul>
        <li><strong>Fearless (Taylor’s Version)</strong>, April 2021</li>
        <li><strong>Red (Taylor’s Version)</strong>, November 2021</li>
        <li><strong>Speak Now (Taylor’s Version)</strong>, July 2023</li>
        <li><strong>1989 (Taylor’s Version)</strong>, October 2023</li>
      </ul>
      <p>Because she owned the compositions, she could license the songs for the new recordings herself. That is why the strategy worked: the new master belongs to whoever pays for and makes it, and the songs underneath were already hers to use.</p>

      <h2>How it ended</h2>
      <p>In May 2025 Swift announced she had bought back the original masters from Shamrock Capital. The price was not made public in her announcement.</p>

      <h2>What this means for other artists</h2>
      <ul>
        <li>Check who owns the master, not just who wrote the song.</li>
        <li>Read the re-recording restriction: how long it lasts and what counts as a “new” recording.</li>
        <li>Ask whether a label can sell your masters without your consent, and whether you get a right of first refusal.</li>
      </ul>
      <p>None of this was decided by a court ruling. It was a contract and negotiation story, which is exactly why the drafting of those contracts matters.</p>
    `,
    author: 'DRAFT — pending editor review',
    updatedAt: 'September 21, 2026',
    readingTime: 4,
    views: 0,
    featured: false,
    imageSeed: 'taylor-swift-masters-explained',
    country: 'United States',
    primarySources: [
      { label: 'U.S. Copyright Office — Circular 56: Copyright Registration for Sound Recordings', url: 'https://www.copyright.gov/circs/circ56.pdf' },
    ],
  },
];
