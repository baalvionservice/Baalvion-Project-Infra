import type { LawArticle } from '../law-content';

const LAW_SCHOOL_SUCCESS_CATEGORY = {
  id: 'cms-cat-law-school-success',
  name: 'Law School Success',
  slug: 'law-school-success',
};

export const articleLegalResearchBeginners: LawArticle[] = [
  {
    id: 'lss-004',
    title: 'Legal Research for Beginners: Free Tools That Actually Work',
    slug: 'legal-research-for-beginners-free-tools',
    alphabet: 'L',
    categoryId: 'cms-cat-law-school-success',
    subcategoryId: '',
    category: LAW_SCHOOL_SUCCESS_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary:
      "Most legal research guides assume you have a Westlaw or Lexis login. This one doesn't -- six tools, all free, that cover case law, statutes, regulations, and bill tracking, with the exact steps to search each one.",
    content: `<h2>You Don't Need a Login to Start</h2>
<p>Search "how to do legal research" and the first page is mostly vendor blogs walking you through Westlaw's interface, or a library guide written for people who already have institutional access. If you're a 1L without a class login yet, a paralegal student, a journalist, or someone trying to read the actual statute behind a news story, none of that helps you today. Every tool below is free, works in a browser with no account required to search, and covers the same ground a paid platform does for the kind of research a beginner actually needs: finding a case, finding a statute, finding a regulation, and checking whether a source is still good law.</p>

<h2>Google Scholar's Case Law Search</h2>
<p>Go to scholar.google.com and look under the search box -- there's a "Case law" radio button next to "Articles." Select it, and you're searching a database of federal and state court opinions instead of academic papers. Type a party name ("Brown v. Board"), a citation, or a plain-language issue, and results come back as full opinion text, not just a summary.</p>
<p>Two features matter here. After you open an opinion, click "How cited" near the top -- it lists every later case that cited the one you're reading, with the specific quoted language pulled out. That's not a full citator like Shepard's or KeyCite, and it won't flag a case as overruled the way those do, but it's the closest free equivalent for seeing how a case has been treated since. Second, use "Select courts" before you search to limit results to your jurisdiction; searching all courts by default buries relevant state cases under federal ones.</p>

<h2>CourtListener for Depth and Alerts</h2>
<p>CourtListener (courtlistener.com) is run by the nonprofit Free Law Project and indexes more than eight million opinions across roughly 470 courts, plus RECAP, a crowdsourced archive of federal court dockets normally locked behind PACER's per-page fees. Its search supports Boolean operators and a semantic "search using natural language" mode, which helps when you don't know the right legal term yet.</p>
<p>Create a free account and you can save a search as an alert -- useful if you're tracking a pending case rather than researching a closed one. It also hosts oral argument audio for the Supreme Court and federal appellate courts, which is worth listening to before a moot court argument: you hear which questions actually moved a real bench, not which ones a study guide guessed at.</p>

<h2>Justia for State Codes and Fast Lookups</h2>
<p>Justia's law portal (law.justia.com) organizes every state's statutes by state, then by title and chapter, which makes it faster than a state legislature's own site if you don't already know the code section you're after. It also carries U.S. Supreme Court decisions back to 1791, federal circuit and district opinions, and the Annotated U.S. Constitution with case citations attached to each clause. It's a good second stop after Google Scholar when you need the statute a case is interpreting, not just the case itself.</p>

<h2>Cornell's Legal Information Institute for Definitions and Full Text</h2>
<p>Cornell Law School's Legal Information Institute (law.cornell.edu) publishes the complete U.S. Code and the electronic Code of Federal Regulations, both searchable by title and section or by keyword, along with the U.S. Constitution and Federal Rules of Civil and Criminal Procedure. LII was built specifically on the idea that primary law should be free to read, and it's been online since the early 1990s -- longer than most commercial platforms.</p>
<p>Start with Wex, LII's plain-language legal dictionary, before you touch the statute itself. Look up an unfamiliar term -- "preponderance of the evidence," "in rem jurisdiction" -- and Wex gives a short definition with links to the actual code sections and leading cases that define it, so you're not guessing at a term's meaning from context.</p>

<h2>govinfo.gov and congress.gov for the Text Itself</h2>
<p>These two sites answer different questions and beginners often reach for the wrong one. govinfo.gov is the U.S. Government Publishing Office's official archive -- it holds the authenticated PDF of a bill exactly as introduced, amended, or enacted, plus the Statutes at Large and the Federal Register. If you need to cite the actual, government-authenticated document, this is where it lives.</p>
<p>congress.gov, maintained by the Library of Congress, is where you track a bill's status: which committee has it, what amendments were offered, how a chamber voted, and a summary of what it does. Use congress.gov to understand where a bill stands and govinfo.gov to pull the exact text you'd cite in a paper or brief.</p>

<h2>Your State Almost Certainly Has a Free Site Too</h2>
<p>Every state publishes its current code through its legislature and its appellate opinions through its court system, usually at no cost, though the URL and search quality vary a lot by state. California is a clean example: the legislature publishes the full penal, civil, and other codes at leginfo.legislature.ca.gov, and the state's Supreme Court and Courts of Appeal post opinions directly at courts.ca.gov/opinions.htm. If you're not in California, search "[your state] legislature statutes" and "[your state] courts opinions" -- nearly every state runs an equivalent pair of official sites, and they're the source Justia and Google Scholar are themselves pulling state material from.</p>

<h2>A Workable Order to Use These In</h2>
<p>For an unfamiliar research question, working through these tools in sequence beats jumping straight to a case search. Look up the term in Wex first so you know what you're actually searching for. Pull the statute's exact text from Cornell's U.S. Code or your state's legislature site. Search Google Scholar or CourtListener for cases applying that statute, filtered to your jurisdiction. Check "How cited" on the strongest case you find to see later treatment. If a federal bill or regulation is involved, confirm the current text on govinfo.gov and its status on congress.gov. That sequence takes longer than typing a question into Google, but it's the difference between reading a source and reading someone's summary of it.</p>

<h2>Key Takeaways</h2>
<ul>
<li>Google Scholar's "Case law" search (scholar.google.com) is free, covers federal and state opinions, and its "How cited" link shows later citing cases -- a partial, free substitute for a paid citator.</li>
<li>CourtListener (courtlistener.com) indexes over eight million opinions across roughly 470 courts and includes RECAP, a free archive of federal dockets otherwise locked behind PACER fees.</li>
<li>Justia (law.justia.com) is the fastest free path to a specific state statute, organized by state, title, and chapter.</li>
<li>Cornell's Legal Information Institute (law.cornell.edu) hosts the full U.S. Code and e-CFR free, plus Wex, a plain-language legal dictionary worth checking before you read the statute itself.</li>
<li>govinfo.gov holds the authenticated official text of bills, statutes, and regulations; congress.gov tracks a bill's real-time status and legislative history -- use them together, not interchangeably.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Are these tools a real substitute for Westlaw or Lexis in practice?</h3>
<p>For a student or beginner doing case and statute lookups, yes, for most day-to-day research. What they don't fully replace is a comprehensive citator -- Westlaw's KeyCite and Lexis's Shepard's flag negative treatment (overruled, criticized, questioned) more completely than Google Scholar's "How cited" does. If a professor or employer requires Shepardizing specifically, check whether your school library still gives you free access to one of the paid platforms.</p>
<h3>Which tool should I check first for a class assignment?</h3>
<p>If the assignment names a case, start with Google Scholar or CourtListener and pull the opinion directly. If it names a statute or regulation, go to Cornell's Legal Information Institute or govinfo.gov for the authoritative text, then use Google Scholar to find cases interpreting it.</p>
<h3>Do I need to create an account on any of these?</h3>
<p>No account is required to search or read on any of them. CourtListener is the one exception worth setting up, since a free account lets you save search alerts so you don't have to re-run the same search manually every week.</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'September 16, 2026',
    readingTime: 7,
    views: 0,
    featured: false,
    imageSeed: 'legal-research-for-beginners-free-tools',
    primarySources: [
      { label: 'Google Scholar, Case Law Search', url: 'https://scholar.google.com/' },
      { label: 'CourtListener (Free Law Project)', url: 'https://www.courtlistener.com/' },
      { label: 'Justia, U.S. Law, Case Law, Codes, Statutes & Regulations', url: 'https://law.justia.com/' },
      { label: 'Cornell Law School Legal Information Institute', url: 'https://www.law.cornell.edu/' },
      { label: 'GovInfo (U.S. Government Publishing Office)', url: 'https://www.govinfo.gov/' },
      { label: 'Congress.gov (Library of Congress)', url: 'https://www.congress.gov/' },
      { label: 'California Legislative Information', url: 'https://leginfo.legislature.ca.gov/' },
      { label: 'California Courts, Supreme Court and Appellate Opinions', url: 'https://www.courts.ca.gov/opinions.htm' },
    ],
  },
];
