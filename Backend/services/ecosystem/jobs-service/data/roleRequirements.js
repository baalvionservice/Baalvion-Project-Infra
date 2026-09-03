'use strict';
/**
 * What a candidate needs to bring, and what would help.
 *
 * The catalogue's own `requirements` field carries two or three headline bullets — the
 * things that decide whether somebody should apply at all. This carries the full picture:
 * the skills a person doing this job actually uses, and the experience that is genuinely
 * a bonus rather than a hidden requirement.
 *
 * Two rules. `required` must be things we would really turn somebody down for; padding
 * it with nice-to-haves is how postings end up excluding good candidates, women and
 * career-changers most of all. `preferred` must be genuinely optional, and short enough
 * to be believable.
 *
 * Statutory tickets — a blaster's permit, a manager's certificate of competency, a
 * boiler attendant's certificate — belong in `required` and are stated plainly. Somebody
 * without one should know before they spend an evening on the application.
 */

module.exports = {
  // ══ Engineering ══════════════════════════════════════════════════════════════
  'Frontend Engineer': {
    required: [
      'Three or more years building production React applications',
      'TypeScript used as a design tool — types that describe the domain rather than satisfy the compiler',
      'Strong CSS: layout, the cascade, and why a component breaks at 320px',
      'Practical accessibility — semantic HTML, focus management, and having used a screen reader on your own work',
      'Understanding of browser rendering and where the time actually goes on a slow device',
      'Experience with a modern framework\'s data-fetching and rendering model, server components included',
      'Testing at the component and integration level, and judgement about what is worth testing',
      'Able to work from a design file and raise the case where the design will not hold up in build',
    ],
    preferred: [
      'Next.js App Router in production',
      'Experience with internationalisation and right-to-left layouts',
      'Having owned Core Web Vitals on a page that mattered commercially',
      'Design systems work, in Figma as well as in code',
    ],
  },
  'Software Engineer': {
    required: [
      'Two or more years writing production software in any mainstream language',
      'Comfortable with a relational database and able to write the query yourself',
      'Git, code review and working in a shared codebase',
      'Testing as a normal part of writing code rather than a separate phase',
      'Able to take an ambiguous ticket and ask the questions that resolve it',
      'Debugging from evidence — logs, a trace, a reproduction — rather than by changing things',
    ],
    preferred: [
      'Node.js and TypeScript',
      'Exposure to cloud infrastructure and CI',
      'Experience in a multi-tenant or B2B product',
    ],
  },
  'Senior Software Engineer': {
    required: [
      'Five or more years building and running production systems',
      'Schema design you still stand behind, and the migrations that changed it under live traffic',
      'API design and versioning, including deprecating something people depend on',
      'Practical experience with queues, retries and idempotency, and the failure modes of all three',
      'Able to read a query plan and act on it',
      'Observability as something you build rather than something ops adds afterwards',
      'A record of mentoring engineers through review and design conversation',
      'Judgement about what to build now, what to defer, and what not to build',
    ],
    preferred: [
      'Multi-tenant SaaS at scale',
      'Experience owning an on-call rotation',
      'Having led a migration with a live cutover',
    ],
  },
  'Backend Engineer': {
    required: [
      'Three or more years on backend services in production',
      'Strong SQL and relational modelling — normalisation, indexing and the cost of a join',
      'REST or gRPC API design, including error semantics and versioning',
      'Asynchronous processing: queues, workers, retries, dead letters and idempotency keys',
      'Understanding of transactions and isolation levels, and what actually happens under concurrency',
      'Comfortable with containers and how your service runs in production',
      'Testing at the unit and integration level, including against a real database',
    ],
    preferred: [
      'Node.js and PostgreSQL specifically',
      'Event-driven architecture in production',
      'Experience with multi-tenant data isolation',
      'Redis or a comparable cache, used deliberately rather than sprinkled on',
    ],
  },
  'Senior Backend Engineer': {
    required: [
      'Five or more years on backend systems, including design you own the consequences of',
      'Deep relational database experience — schema design, query planning, and migrations on live tables',
      'Distributed systems fundamentals: consistency models, partial failure and what a retry actually means',
      'Queue and event infrastructure in production, with the exactly-once conversation you have already had',
      'API contract ownership across teams, including versioning and deprecation',
      'Production debugging from traces, metrics and plans rather than from a hunch',
      'Ability to write a design document that resolves disagreement before code is written',
      'Mentoring — a material part of the job is other people\'s code being better',
    ],
    preferred: [
      'Node.js, PostgreSQL and Redis',
      'Multi-tenant SaaS with hard isolation requirements',
      'Financial or other domains where correctness is not negotiable',
      'Experience with data residency constraints across regions',
    ],
  },
  'Staff Engineer, Platform': {
    required: [
      'Eight or more years in engineering, with several spent on platform or infrastructure',
      'A record of building foundations other teams built on successfully',
      'Deep understanding of service boundaries, data ownership and authorisation models',
      'Experience with multi-tenancy as an architectural problem rather than a filter in a query',
      'Ability to lead technical design across teams that do not report to you',
      'Written communication strong enough to settle an argument in a document',
      'Judgement about which architectural debt is actually costing throughput',
    ],
    preferred: [
      'Experience building an internal developer platform',
      'Open-source or standards work',
      'Having run a migration that spanned several teams and quarters',
    ],
  },
  'Staff Software Engineer': {
    required: [
      'Eight or more years building production software, with a record of technical leadership',
      'Experience owning a significant product area end to end',
      'Ability to decompose multi-team work into independently shippable pieces',
      'Migrations with live cutovers and no acceptable downtime',
      'Setting engineering standards and getting them adopted without authority',
      'Growing senior engineers into the next level',
    ],
    preferred: ['Domain experience in HR technology or marketplaces', 'Experience across both backend and frontend'],
  },
  'Senior Staff Software Engineer': {
    required: [
      'Ten or more years in engineering with sustained technical leadership across teams',
      'A record of holding architectural coherence across an organisation',
      'Comfort taking on the problems with no obvious owner',
      'Ability to say no to a design with a reason people accept',
      'Partnership with product and engineering leadership on sequencing and feasibility',
    ],
    preferred: ['Experience at significant scale', 'Having built a technical strategy that survived contact with reality'],
  },
  'Principal Engineer': {
    required: [
      'Twelve or more years in engineering with a record of architecture at company scale',
      'Ownership of service boundaries, data models and tenancy across a platform',
      'Experience leading multi-quarter technical bets, including build-versus-buy',
      'Ability to resolve technical disagreement between teams',
      'Fluency in the compliance, residency and security constraints that shape architecture',
    ],
    preferred: ['Experience in a regulated domain', 'Public technical writing or speaking'],
  },
  'Distinguished Engineer': {
    required: [
      'Fifteen or more years with a record of technical impact beyond a single organisation',
      'Deep expertise in a domain relevant to the platform',
      'A record of developing principal and staff engineers',
      'Ability to set technical strategy on a horizon longer than the roadmap',
    ],
    preferred: ['Publications, patents or standards contributions', 'Recognised presence in the engineering community'],
  },
  'Chief Architect': {
    required: [
      'Fifteen or more years in engineering with substantial architecture ownership',
      'Experience defining a target architecture and delivering the migration towards it',
      'Deep knowledge of distributed systems, data architecture and security design',
      'Ability to govern technology choices without becoming a bottleneck',
      'Written communication that makes an architectural decision legible to a new engineer',
    ],
    preferred: ['Multi-region and data residency experience', 'Experience in both startup and scaled environments'],
  },
  'Full-Stack Engineer': {
    required: [
      'Three or more years shipping across both frontend and backend',
      'React and TypeScript on the front, and a server language with a relational database behind it',
      'Comfortable writing a migration, a service change and a component in one change',
      'API design from both sides of the contract',
      'Testing across the stack at the level that would catch a real break',
    ],
    preferred: ['Node.js and PostgreSQL', 'Next.js', 'Experience in a small team where you owned a whole feature'],
  },
  'Software Engineer (Graduate)': {
    required: [
      'A degree in computer science, engineering or a related field, or equivalent practical experience',
      'Solid programming fundamentals in at least one language',
      'Understanding of data structures, algorithms and complexity at the level you would actually use',
      'Some experience with version control and working on code with other people',
      'Willingness to ask the question you think is obvious',
    ],
    preferred: [
      'Internship, open-source or a substantial personal project',
      'Exposure to web development or databases',
      'Any experience of code review, from either side',
    ],
  },
  'Software Engineering Intern': {
    required: [
      'Currently studying computer science, engineering or a related field',
      'Programming ability in at least one language',
      'Curiosity, and the honesty to say when you are stuck',
    ],
    preferred: ['Personal projects or open-source contributions', 'Some familiarity with web technologies or Git'],
  },
  'Mobile Engineer (React Native)': {
    required: [
      'Three or more years building and shipping React Native applications',
      'Understanding of the native layer on both platforms, and when to drop into it',
      'Experience with offline behaviour, background work and unreliable networks',
      'App Store and Play Store release management, including staged rollout',
      'Performance work on low-end devices — startup time, memory and list rendering',
      'Push notifications, deep linking and permissions on both platforms',
      'Debugging crashes from stack traces on devices you do not have',
    ],
    preferred: ['Native iOS or Android development', 'Document capture and upload flows', 'Experience with app accessibility'],
  },
  'Android Engineer': {
    required: [
      'Three or more years building Android applications in Kotlin',
      'Modern Android — Jetpack, coroutines and the architecture components',
      'Handling fragmentation across API levels and OEM behaviour',
      'Background work under Doze and the battery restrictions OEMs add on top',
      'Play Console release management, staged rollout and vitals monitoring',
      'Performance and memory work on low-end devices',
    ],
    preferred: ['Jetpack Compose', 'CameraX and document capture', 'Accessibility with TalkBack'],
  },
  'iOS Engineer': {
    required: [
      'Three or more years building iOS applications in Swift',
      'SwiftUI and UIKit, and the judgement about which to use where',
      'App Store submission and the review process, including privacy declarations',
      'Background tasks, push notifications and the permission model',
      'Instruments and performance profiling',
    ],
    preferred: ['VoiceOver and Dynamic Type accessibility work', 'Document capture with AVFoundation', 'Swift concurrency'],
  },
  'Engineering Manager': {
    required: [
      'Two or more years managing engineers, with the difficult conversations that come with it',
      'A background as a working engineer, recent enough to read a design document properly',
      'Experience owning delivery for a team, including saying a date will not hold',
      'Hiring: running a loop, holding a bar, and deciding to keep looking',
      'Performance management, including underperformance handled properly',
      'Ability to write feedback down and deliver it directly',
    ],
    preferred: ['Experience growing engineers into senior roles', 'Having managed through a reorganisation or a project being stopped'],
  },
  'Director of Engineering': {
    required: [
      'Five or more years in engineering management, including managing managers',
      'Ownership of outcomes across several teams',
      'Headcount planning, budget and hiring at group scale',
      'A record of growing engineering managers',
      'Partnership with product and design leadership on what is genuinely deliverable',
    ],
    preferred: ['Experience scaling an organisation through significant growth', 'Ownership of operational health metrics'],
  },
  'VP Engineering': {
    required: [
      'Eight or more years in engineering leadership including directors reporting to you',
      'Ownership of an engineering organisation\'s structure, standards and output',
      'Budget ownership and build-versus-buy decisions at company scale',
      'A record of building a leadership layer',
      'Ability to answer for engineering at the executive table, including for failures',
    ],
    preferred: ['Experience in a B2B SaaS company', 'Having led an organisation through significant scaling'],
  },
  'Integration Engineer': {
    required: [
      'Three or more years building third-party integrations in production',
      'REST, webhooks, OAuth and the authentication schemes partners actually use',
      'Resilience patterns: timeouts, retries with backoff, circuit breaking and queueing',
      'Data mapping between models that disagree about the same concept',
      'Debugging across a boundary you do not control, from limited evidence',
      'Clear communication with a customer while an integration issue is open',
    ],
    preferred: ['HRIS, payroll or assessment platform integrations', 'SCIM or HR-XML', 'Experience building a public webhook system'],
  },
  'Database Engineer': {
    required: [
      'Five or more years working closely with relational databases in production',
      'Deep PostgreSQL: query planning, indexing strategy, vacuum behaviour and locking',
      'Schema design and migrations on large live tables without locking out writes',
      'Partitioning and archival strategy for tables that grow without limit',
      'Replication, connection pooling and failover, tested rather than assumed',
      'Ability to advise engineers on modelling before the schema is written',
    ],
    preferred: ['Multi-tenant database design', 'Logical replication and change data capture', 'Experience with a major version upgrade in production'],
  },
  'Search Engineer': {
    required: [
      'Three or more years working on search or information retrieval in production',
      'Elasticsearch, OpenSearch or a comparable engine, including analysis chain configuration',
      'Relevance engineering: judged sets, offline metrics and online evaluation',
      'Understanding of tokenisation, stemming, synonyms and why they matter more in some languages',
      'Geospatial and faceted search, including keeping facet counts correct under interaction',
      'Query latency work as the corpus grows',
    ],
    preferred: ['Learning-to-rank', 'Multilingual or transliterated search, particularly for Indian languages', 'Vector or hybrid retrieval'],
  },
  'Accessibility Engineer': {
    required: [
      'Three or more years focused on web accessibility',
      'WCAG 2.1 and 2.2 at AA, applied rather than recited',
      'Assistive technology in daily use — NVDA, JAWS or VoiceOver — for testing your own work',
      'ARIA used correctly, including knowing when not to use it',
      'Accessible component patterns: modals, comboboxes, live regions and multi-step forms',
      'Automated accessibility testing in CI, and honesty about its limits',
      'Ability to teach engineers and designers rather than only filing defects',
    ],
    preferred: ['CPACC or WAS certification', 'Experience with an accessibility conformance report or VPAT', 'Mobile accessibility'],
  },
  'Performance Engineer': {
    required: [
      'Four or more years on performance in production systems',
      'Profiling for real — CPU, allocation, memory and I/O — and acting on what it shows',
      'Load and soak testing with realistic traffic shapes',
      'Core Web Vitals and browser performance on the frontend',
      'Database performance: plans, indexing and N+1 detection',
      'Building performance regression detection into a pipeline',
    ],
    preferred: ['Experience with a large seasonal traffic spike', 'Distributed tracing at scale', 'Capacity modelling'],
  },
  'Distributed Systems Engineer': {
    required: [
      'Five or more years building distributed systems in production',
      'Genuine understanding of consistency models and what a product can tolerate',
      'Experience with consensus, replication and partition behaviour',
      'Event-driven architecture including ordering, duplication and replay',
      'Designing for partial failure as the normal case',
      'Deliberate failure testing rather than assumption',
    ],
    preferred: ['Multi-region systems with data residency constraints', 'Kafka or a comparable log', 'Formal methods or model checking'],
  },
  'Systems Engineer — Kernel & Runtime': {
    required: [
      'Five or more years working close to the operating system',
      'Deep Linux: scheduling, memory management, page cache and the I/O path',
      'Systems programming in C, C++, Rust or Go',
      'Performance analysis with perf, eBPF and the kernel tracing facilities',
      'Container runtime internals — namespaces, cgroups and their limits',
    ],
    preferred: ['Kernel contributions', 'JVM or V8 runtime internals', 'NUMA and hardware-aware optimisation'],
  },
  'Compiler & Language Tooling Engineer': {
    required: [
      'Four or more years on developer tooling, compilers or build systems',
      'AST manipulation and program transformation',
      'Build system internals and incremental compilation',
      'Understanding of type systems in practice',
      'Care about error messages as a product surface',
    ],
    preferred: ['TypeScript compiler API', 'Language server protocol implementation', 'Large-scale automated refactoring'],
  },
  'Developer Infrastructure Engineer': {
    required: [
      'Four or more years on CI, build or developer tooling',
      'Monorepo tooling and build caching',
      'Container-based build and test environments',
      'A record of attacking test flakiness rather than tolerating it',
      'Measuring and improving developer feedback loops with data',
    ],
    preferred: ['Turborepo, Bazel or a comparable system', 'Ephemeral preview environments', 'Artifact and dependency management at scale'],
  },
  'Technical Writer': {
    required: [
      'Three or more years writing technical documentation for a developer audience',
      'Ability to read code well enough to document an API without being told what it does',
      'API reference and integration guide writing, including runnable samples',
      'Docs-as-code: Markdown, version control and a documentation build',
      'Information architecture — organising documentation so it can be found',
    ],
    preferred: ['OpenAPI', 'Experience with a developer platform or public API', 'Some front-end ability for the docs site itself'],
  },
  'Developer Advocate': {
    required: [
      'Three or more years in engineering, developer relations or a mix',
      'Ability to build a real sample application and keep it working',
      'Technical writing and public speaking',
      'Genuine empathy for developer frustration and the willingness to relay it internally',
      'Comfort answering in public, including when we got something wrong',
    ],
    preferred: ['Conference speaking record', 'Community building', 'Experience with a public API product'],
  },

  // ══ Product ══════════════════════════════════════════════════════════════════
  'Product Manager, Candidate Experience': {
    required: [
      'Three or more years in product management on a consumer or user-facing product',
      'Funnel analysis you have done yourself, not commissioned',
      'A record of talking to users directly and changing your mind because of it',
      'Ability to write a specification that states the problem and leaves room for a better solution',
      'Comfort prioritising against a roadmap where the loudest request is not the most valuable',
      'Defining success before the work starts and reporting honestly when it does not move',
    ],
    preferred: ['Mobile-first product experience', 'Marketplace or two-sided product background', 'Experience in hiring, education or another high-stakes consumer journey'],
  },
  'Senior Product Manager, ATS': {
    required: [
      'Five or more years in B2B product management',
      'Experience with a configurable enterprise product and the discipline to resist configuration as the answer to everything',
      'Direct work with the operational users of a tool, watching them use it under pressure',
      'Understanding of compliance surfaces: audit trails, retention and data subject rights',
      'Ability to sequence a roadmap across several engineering teams',
      'Willingness to refuse an enterprise requirement that would damage the product',
    ],
    preferred: ['HR technology or ATS domain experience', 'Workflow or process-automation products', 'Experience with EEO or equivalent statutory reporting'],
  },
  'Associate Product Manager': {
    required: [
      'Some experience in product, or in a role adjacent to it — analytics, support, consulting or engineering',
      'Analytical ability and comfort in a database or an analytics tool',
      'Clear written communication',
      'Willingness to sit in on support escalations and customer calls',
    ],
    preferred: ['A technical degree or background', 'Experience in a startup where roles were not tidy'],
  },
  'Group Product Manager': {
    required: [
      'Six or more years in product with experience managing product managers',
      'Ownership of outcomes across several product areas',
      'A record of developing product managers',
      'Ability to make prioritisation calls between teams and defend them',
    ],
    preferred: ['B2B SaaS experience', 'Experience with a platform or multi-product portfolio'],
  },
  'Technical Program Manager': {
    required: [
      'Four or more years running technical programmes across teams',
      'Technical enough to challenge an estimate and understand why a design is hard',
      'Dependency and critical-path management on real programmes',
      'A record of escalating early rather than reporting green until the deadline',
      'Strong written communication and meeting discipline',
    ],
    preferred: ['An engineering background', 'Experience with migrations or infrastructure programmes', 'External or partner dependencies'],
  },
  'Product Operations Manager': {
    required: [
      'Three or more years in product operations, programme management or a similar function',
      'Experience running a planning cadence and keeping a roadmap honest',
      'Comfort with analytics tooling and feedback aggregation',
      'Ability to standardise a process without making it bureaucratic',
    ],
    preferred: ['Experience in a scaling product organisation', 'Experiment platform administration'],
  },

  // ══ Design ═══════════════════════════════════════════════════════════════════
  'Product Designer': {
    required: [
      'Three or more years designing digital products, with a portfolio showing your reasoning rather than only screens',
      'End-to-end flow design including empty, error, loading and permission states',
      'Mobile-first design for a real range of devices and connection speeds',
      'Fluency in Figma and in working within a design system',
      'Research literacy — able to run a usability session and act on it',
      'Willingness to stay with the work through build and review the implementation',
    ],
    preferred: ['Complex B2B or enterprise tool design', 'Accessibility experience', 'Ability to prototype in code'],
  },
  'Senior Product Designer': {
    required: [
      'Five or more years in product design with ownership of a significant surface',
      'Information architecture for dense, configurable interfaces',
      'A portfolio that shows systems thinking rather than screen-by-screen design',
      'Ability to run research that settles a disagreement',
      'Direct, useful critique — given and received',
    ],
    preferred: ['Enterprise software or operational tooling', 'Experience mentoring designers', 'Design systems ownership'],
  },
  'Senior UX Researcher': {
    required: [
      'Five or more years in user research',
      'Both generative and evaluative methods, and the judgement about which a question needs',
      'Participant recruitment that reaches a genuinely representative group, not only the easy-to-reach',
      'Rigorous analysis — findings that hold when challenged',
      'Ability to deliver findings people act on',
    ],
    preferred: ['Research in emerging markets or with low-digital-literacy users', 'Quantitative methods and survey design', 'Building a research repository'],
  },
  'Design Systems Engineer': {
    required: [
      'Four or more years bridging design and engineering',
      'Strong React and TypeScript, and strong CSS',
      'Building accessible components correctly — keyboard, focus and screen-reader behaviour',
      'Design tokens, theming and multi-brand support',
      'Library versioning, release and migration guidance',
      'Fluency in Figma and its component model',
    ],
    preferred: ['Experience with a published or open-source design system', 'Web Components', 'Visual regression testing'],
  },
  'UX Writer': {
    required: [
      'Three or more years writing interface copy',
      'A portfolio showing errors, empty states and difficult messages, not only marketing copy',
      'Ability to hold a content style guide and terminology across a product',
      'Writing for translation and for a multilingual audience',
      'Working with designers from the start rather than filling in at the end',
    ],
    preferred: ['Experience with a product used in high-stress moments', 'Localisation experience', 'Some research ability'],
  },
  'Brand Designer': {
    required: [
      'Four or more years in brand or campaign design',
      'A portfolio showing identity work and its application across surfaces',
      'Art direction of photography and video',
      'Ability to build a campaign system that others can extend',
      'Typography and layout at a high standard',
    ],
    preferred: ['Motion design ability', 'Environmental or print production experience', 'Employer brand work'],
  },
  'Graphic Designer': {
    required: [
      'Two or more years in a design role with a portfolio of production work',
      'Adobe Creative Suite or Figma to a professional standard',
      'Ability to work to brand guidelines consistently at volume',
      'Correct artwork preparation for both print and screen',
      'Comfort with several live jobs and real deadlines',
    ],
    preferred: ['Basic motion or video editing', 'Presentation design', 'Regional-language typesetting'],
  },
  'Design Manager': {
    required: [
      'Two or more years managing designers, on top of a design practice of your own',
      'A record of raising craft through critique rather than by taking work over',
      'Resourcing and prioritisation across product teams',
      'Hiring designers and holding a bar',
    ],
    preferred: ['Experience building a design team from small', 'Design operations experience'],
  },

  // ══ Data ═════════════════════════════════════════════════════════════════════
  'Data Engineer': {
    required: [
      'Three or more years building production data pipelines',
      'Strong SQL and a programming language, usually Python',
      'Orchestration with Airflow or a comparable scheduler, including retries and dependencies',
      'Warehouse modelling, and dbt or an equivalent transformation layer',
      'Handling late-arriving data, backfills and schema drift without losing correctness',
      'Data quality instrumentation — freshness, volume and distribution checks',
      'Understanding of the data-protection rules that must be enforced in the pipeline itself',
    ],
    preferred: ['Streaming with Kafka or similar', 'Cloud warehouse experience — BigQuery, Snowflake or Redshift', 'Change data capture'],
  },
  'Analytics Engineer': {
    required: [
      'Three or more years in analytics engineering or a strong analyst-plus-engineering background',
      'Expert SQL',
      'dbt in production, including testing and documentation',
      'Dimensional modelling and the discipline of a semantic layer',
      'Ability to turn a vague business question into something a model can answer',
    ],
    preferred: ['Experience defining company-wide metrics', 'BI tool administration', 'Python for the parts SQL cannot do'],
  },
  'Senior Data Scientist': {
    required: [
      'Five or more years in data science with production impact',
      'Strong statistics — experimental design, power, and the discipline not to go looking after the fact',
      'Python and SQL to a production standard',
      'Machine learning applied to real problems, with honest evaluation',
      'Ability to communicate uncertainty in a way a decision-maker can use',
      'Willingness to say the data does not support the conclusion',
    ],
    preferred: ['Causal inference', 'Fairness and bias measurement in models', 'Experience with recommendation or ranking'],
  },
  'Principal Data Scientist': {
    required: [
      'Eight or more years in data science with a record of technical leadership',
      'Deep expertise in statistical methodology and machine learning',
      'Experience setting experimentation standards for an organisation',
      'A record of mentoring data scientists',
      'Accountability for statistical claims made externally',
    ],
    preferred: ['Publications', 'Ranking, matching or recommender systems', 'Algorithmic fairness research'],
  },
  'Data Analyst': {
    required: [
      'Two or more years in an analytics role',
      'Strong SQL against a real warehouse',
      'A BI or visualisation tool used properly',
      'Ability to investigate why a number moved and reach the real cause',
      'Presenting to non-analysts without hiding the caveats',
    ],
    preferred: ['Python or R', 'Funnel and cohort analysis', 'Experience in a SaaS or marketplace business'],
  },
  'Business Intelligence Analyst': {
    required: [
      'Three or more years in business intelligence',
      'Strong SQL and dimensional modelling',
      'A BI platform administered rather than only used — governed datasets, permissions and performance',
      'Requirements gathering with business stakeholders',
      'Ability to train people to self-serve',
    ],
    preferred: ['Power BI, Tableau or Looker specifically', 'dbt familiarity', 'Finance or revenue reporting experience'],
  },
  'Data Governance Analyst': {
    required: [
      'Three or more years in data governance, privacy or compliance',
      'Data classification and cataloguing in practice',
      'Working knowledge of GDPR and India\'s DPDP Act as they apply to data handling',
      'Retention and deletion schedules, including erasure requests',
      'Access review and the ability to ask uncomfortable questions about who can see what',
    ],
    preferred: ['A data catalogue tool', 'Privacy impact assessment experience', 'A privacy certification such as CIPP or CIPM'],
  },
  'Head of Data': {
    required: [
      'Eight or more years in data with leadership across engineering, analytics or science',
      'A record of building and growing a data team',
      'Ownership of data strategy, platform and governance',
      'Accountability for the accuracy of numbers reported internally',
      'Ability to make data a routine input to decisions rather than a request queue',
    ],
    preferred: ['Experience building a data function from early stage', 'Machine learning platform experience'],
  },
  'Data Science Intern': {
    required: [
      'Currently studying a quantitative field — statistics, mathematics, computer science, economics or similar',
      'Python and some SQL',
      'Foundations in statistics and machine learning',
    ],
    preferred: ['A project or competition where you worked with messy real data', 'Familiarity with pandas and scikit-learn'],
  },

  // ══ Quality ══════════════════════════════════════════════════════════════════
  'QA Automation Engineer': {
    required: [
      'Three or more years in test automation',
      'A modern automation framework — Playwright, Cypress or Selenium — used at scale',
      'API test automation as well as UI',
      'Programming ability sufficient to maintain a real test codebase',
      'Test data and environment management for deterministic tests',
      'A record of attacking flakiness rather than reruns',
      'CI integration and keeping a suite fast enough to run on every change',
    ],
    preferred: ['Mobile test automation', 'Contract testing', 'Performance testing exposure'],
  },
  'QA Engineer (Manual)': {
    required: [
      'Two or more years in software testing',
      'Test case design covering edge and error paths, not the demonstration path',
      'Exploratory testing as a deliberate practice',
      'Cross-browser and real-device testing, including low-end devices',
      'Defect reports somebody can reproduce from',
      'Willingness to say a release is not ready',
    ],
    preferred: ['Some automation ability', 'Accessibility testing', 'API testing with Postman or similar'],
  },
  'QA Lead': {
    required: [
      'Five or more years in quality with team leadership',
      'Ability to set a quality strategy — what is automated, what is explored, what gates a release',
      'Ownership of release sign-off',
      'Quality metrics that are meaningful rather than decorative',
      'Working with engineering on defect prevention, not only detection',
    ],
    preferred: ['Test automation architecture', 'Experience in a regulated or high-correctness domain'],
  },
  'Performance Test Engineer': {
    required: [
      'Three or more years in performance testing',
      'A load testing tool — k6, JMeter, Gatling or similar — used against real systems',
      'Ability to model realistic traffic shapes rather than an even rate',
      'Bottleneck analysis across application, database and infrastructure',
      'Integrating performance tests into a pipeline',
    ],
    preferred: ['Experience with large seasonal spikes', 'APM and profiling tools', 'Chaos or failure testing'],
  },

  // ══ Infrastructure ═══════════════════════════════════════════════════════════
  'DevOps Engineer': {
    required: [
      'Three or more years running containerised workloads in production',
      'Kubernetes in practice — workloads, autoscaling, resource limits and debugging a pod that will not start',
      'Infrastructure as code with Terraform, under review rather than by hand',
      'CI/CD pipeline design and maintenance',
      'Observability: metrics, logs, traces and alerts that are worth waking up for',
      'Secrets, certificates and access management including rotation',
      'Linux and networking fundamentals',
    ],
    preferred: ['Multi-region and data residency experience', 'Service mesh', 'FinOps or cloud cost work'],
  },
  'Site Reliability Engineer': {
    required: [
      'Four or more years in SRE, infrastructure or backend engineering with production ownership',
      'SLOs and error budgets used as real inputs rather than as vocabulary',
      'Incident command experience and blameless postmortem writing',
      'Strong coding ability — automating toil is most of the job',
      'Kubernetes and cloud infrastructure in depth',
      'Capacity planning and load modelling',
    ],
    preferred: ['Chaos engineering or game days', 'Distributed tracing at scale', 'Database reliability experience'],
  },
  'Site Reliability Engineering Manager': {
    required: [
      'Six or more years in SRE or infrastructure with team leadership',
      'A record of making an on-call rotation sustainable',
      'Ownership of an SLO framework and an error-budget policy',
      'Incident process ownership including whether actions actually get done',
      'Ability to argue for unglamorous reliability investment',
    ],
    preferred: ['Experience scaling a reliability function', 'Multi-region operations'],
  },
  'Cloud Infrastructure Architect': {
    required: [
      'Seven or more years in cloud infrastructure with architecture ownership',
      'Multi-region design including data residency constraints',
      'Network topology, account structure and security boundaries',
      'Disaster recovery designed to a stated RTO and RPO, and tested',
      'Cloud cost as an architectural concern',
    ],
    preferred: ['AWS and one other major cloud', 'Regulated industry experience', 'Cloud certification at professional level'],
  },
  'Network Engineer': {
    required: [
      'Four or more years in network engineering',
      'Routing, switching, firewalls and segmentation in production',
      'Cloud networking — VPC design, peering, transit and hybrid connectivity',
      'VPN and remote access at scale',
      'Troubleshooting across links you do not control',
    ],
    preferred: ['Satellite or microwave links to remote sites', 'SD-WAN', 'CCNP or equivalent'],
  },
  'Database Reliability Engineer': {
    required: [
      'Five or more years operating production databases',
      'Deep PostgreSQL operations — replication, failover, pooling and upgrades',
      'Backup and recovery tested by actual restores, with a known recovery time',
      'Performance tuning at instance and query level',
      'Monitoring for replication lag, bloat and lock contention',
    ],
    preferred: ['Major version upgrades without downtime', 'Multi-region replication', 'Another engine alongside PostgreSQL'],
  },

  // ══ Security ═════════════════════════════════════════════════════════════════
  'Security Engineer': {
    required: [
      'Four or more years in application or product security',
      'Threat modelling done alongside engineers rather than as a review gate',
      'Secure code review, particularly for access control and authorisation flaws',
      'Understanding of the OWASP Top Ten applied to real code rather than recited',
      'Experience with SAST, dependency scanning and secret detection, and tuning them so people act on the output',
      'Vulnerability management from finding to verified fix',
      'Writing findings a developer can act on',
    ],
    preferred: ['Cloud security posture work', 'Experience with a bug bounty or disclosure programme', 'A relevant certification such as OSCP or GWAPT'],
  },
  'Security Operations Analyst': {
    required: [
      'Two or more years in security operations or incident response',
      'SIEM and log analysis in practice',
      'Detection engineering — writing rules, tuning them and retiring the noisy ones',
      'Incident triage and the discipline to evidence what you found',
      'Understanding of account takeover, credential stuffing and automated abuse',
      'Willingness to work a shift pattern covering the working day',
    ],
    preferred: ['Threat hunting experience', 'Scripting for automation', 'A certification such as GCIA or Security+'],
  },
  'Penetration Tester': {
    required: [
      'Three or more years in offensive security with authorised testing experience',
      'Web application and API testing to a professional standard',
      'Authentication, session and authorisation testing in depth',
      'Cloud and internal network testing',
      'Reports that prove the finding, rate it honestly and explain the fix',
      'Absolute discipline about scope and authorisation',
    ],
    preferred: ['Mobile application testing', 'OSCP, OSWE or equivalent', 'Exploit development'],
  },
  'Identity & Access Management Engineer': {
    required: [
      'Four or more years working on identity systems',
      'OIDC and SAML implemented against real identity providers that all interpret the spec differently',
      'SCIM provisioning',
      'Authorisation model design — roles, permissions and tenant boundaries that are enforceable',
      'Token handling, session management and key rotation',
      'Multi-factor authentication and a secure account recovery path',
    ],
    preferred: ['Enterprise SSO integrations at scale', 'OAuth 2.1 and modern best practice', 'Directory services experience'],
  },
  'Security Research Engineer': {
    required: [
      'Four or more years in security research or a strong engineering background with research output',
      'Ability to analyse abuse infrastructure and understand the economics behind it',
      'Strong programming for building detection and tooling',
      'Understanding of fraud and identity abuse patterns',
    ],
    preferred: ['Published research', 'Machine learning applied to abuse detection', 'Document forensics or forgery detection'],
  },
  'Governance, Risk & Compliance Analyst': {
    required: [
      'Three or more years in security compliance or IT audit',
      'SOC 2 or ISO 27001 programme work, including evidence collection and control testing',
      'Audit management end to end, including remediation',
      'Risk register ownership as a live document',
      'Accurate completion of security questionnaires — accurate rather than convenient',
      'Vendor risk assessment',
    ],
    preferred: ['CISA, CISM or ISO 27001 lead auditor', 'PCI DSS exposure', 'Privacy regulation familiarity'],
  },
  'Head of Information Security': {
    required: [
      'Ten or more years in security with leadership across several specialisms',
      'Ownership of a security programme covering application, infrastructure and compliance',
      'Building and leading a security team',
      'Incident command for serious incidents',
      'Credibility with customers, auditors and regulators',
      'Ability to balance security against delivery explicitly rather than by blocking',
    ],
    preferred: ['CISSP, CISM or equivalent', 'Experience in a regulated industry', 'Board-level reporting experience'],
  },

  // ══ IT ═══════════════════════════════════════════════════════════════════════
  'IT Support Specialist': {
    required: [
      'Two or more years in IT support',
      'Windows and macOS support to a professional standard',
      'Device provisioning, enrolment and encryption through an MDM',
      'Identity and access administration through joiner-mover-leaver',
      'Ticket queue discipline and a response standard',
      'Clear writing — documentation is part of the job',
    ],
    preferred: ['Linux support', 'Scripting for automation', 'Asset management across multiple sites'],
  },
  'IT Support Executive — Damanjodi': {
    required: [
      'Two or more years in IT support, preferably in an industrial or plant environment',
      'Windows support, networking basics and hardware troubleshooting',
      'Ability to work with operational systems where downtime stops production',
      'Odia and English',
      'Willingness to be based at Damanjodi',
    ],
    preferred: ['Experience supporting weighbridge, SCADA or plant systems', 'Networking certification'],
  },
  'IT Systems Administrator': {
    required: [
      'Three or more years administering corporate systems',
      'Identity platform administration — Entra ID, Google Workspace or equivalent',
      'Endpoint management and patching at scale',
      'SaaS administration and licence management',
      'Backup and recovery, tested',
      'Scripting to automate repetitive administration',
    ],
    preferred: ['Compliance evidence experience', 'Zero-trust or conditional access design'],
  },
  'IT Manager': {
    required: [
      'Six or more years in IT with team leadership',
      'Budget and vendor management',
      'Service standards and reporting against them',
      'Infrastructure project delivery, including at remote sites',
      'Working with security on endpoint and access posture',
    ],
    preferred: ['Multi-site or industrial IT experience', 'ITIL familiarity'],
  },

  // ══ Research ═════════════════════════════════════════════════════════════════
  'Applied Research Engineer': {
    required: [
      'A postgraduate degree in a relevant field, or equivalent research experience',
      'Ability to read the literature and implement from a paper',
      'Strong engineering — research that runs in production, not only in a notebook',
      'Building an evaluation set before tuning anything',
      'Willingness to conclude that an approach does not work',
    ],
    preferred: ['Publications', 'Experience with information retrieval or NLP', 'Open-source contributions'],
  },
  'Brand Researcher': {
    required: [
      'Three or more years in brand, market or consumer research',
      'Survey design and analysis to a proper standard',
      'Qualitative methods — interviews and focus groups',
      'Ability to track brand health with a method consistent enough to compare over time',
      'Findings delivered in a form marketing can act on',
    ],
    preferred: ['Employer brand research', 'Statistical analysis in R or Python', 'Multi-market research'],
  },

  // ══ Sales ════════════════════════════════════════════════════════════════════
  'Enterprise Account Executive': {
    required: [
      'Five or more years selling B2B software, with enterprise deals closed',
      'Experience navigating a buying committee across HR, IT, security, procurement and legal',
      'Discovery as a discipline rather than a demo followed by a proposal',
      'Coordinating a deal team — solutions engineering, security and legal',
      'Commercial negotiation and holding price where value supports it',
      'Accurate forecasting, including calling a deal that will not close',
      'CRM discipline',
    ],
    preferred: ['HR technology or SaaS platform sales', 'Experience selling into India and one other market', 'MEDDIC, Command of the Message or similar'],
  },
  'Account Executive, Mid-Market': {
    required: [
      'Three or more years in B2B software sales carrying a quota',
      'Full-cycle ownership including running your own demonstrations',
      'Outbound pipeline generation, not only inbound',
      'Negotiation and closing',
      'CRM hygiene',
    ],
    preferred: ['SaaS experience', 'HR technology exposure', 'Experience with a shorter, higher-volume cycle'],
  },
  'Account Executive — APAC': {
    required: [
      'Four or more years in B2B software sales across APAC markets',
      'Understanding that these markets buy quite differently from one another',
      'Comfort with local employment and data-protection requirements as part of a sale',
      'In-region pipeline generation, including through partners',
      'Working across time zones with a deal team elsewhere',
    ],
    preferred: ['A second regional language', 'Partner or channel selling', 'HR technology experience'],
  },
  'Sales Development Representative': {
    required: [
      'Some experience in a sales, customer-facing or target-carrying role',
      'Clear written communication — outreach that says something specific',
      'Research ability, so an email is not a template with a merge field',
      'Comfort on the phone',
      'CRM discipline',
      'Resilience — the volume of rejection is real and cannot change the quality of the next conversation',
    ],
    preferred: ['SaaS or technology exposure', 'Experience with a sales engagement platform', 'A second language'],
  },
  'Inside Sales Representative': {
    required: [
      'Two or more years in inside sales or a similar target-carrying role',
      'Full-cycle selling by phone and video, including demonstrations',
      'Fast response to inbound, which is most of the win rate at this end of the market',
      'CRM discipline',
    ],
    preferred: ['SaaS experience', 'Experience with high-volume pipeline'],
  },
  'Key Account Manager': {
    required: [
      'Five or more years managing large customer relationships commercially',
      'A record of growing accounts rather than only holding them',
      'Business reviews conducted honestly, including what has not gone well',
      'Renewal management well ahead of the date',
      'Escalation ownership when something goes wrong',
    ],
    preferred: ['Enterprise SaaS', 'Multi-region account management'],
  },
  'Channel Sales Manager': {
    required: [
      'Four or more years in channel or partner sales',
      'Partner recruitment, enablement and management',
      'Deal registration and channel conflict management',
      'Forecasting partner-sourced pipeline separately and accurately',
    ],
    preferred: ['SaaS channel experience', 'Experience in a market where channel is the primary route'],
  },
  'Business Development Manager': {
    required: [
      'Five or more years in business development or complex sales',
      'Opening markets or segments with no existing route in',
      'Structuring and negotiating non-standard deals',
      'Relationship building over a long horizon',
      'Bringing market intelligence back rather than only closing',
    ],
    preferred: ['New market entry experience', 'Partnership or alliance structuring'],
  },
  'Head of Sales, India': {
    required: [
      'Eight or more years in sales with leadership of a team carrying a number',
      'Deep understanding of the Indian B2B market and its price expectations',
      'Building a sales organisation — hiring, structure and territory',
      'Accurate forecasting to leadership, including bad news early',
      'Willingness to own the largest relationships personally',
    ],
    preferred: ['SaaS or HR technology', 'Experience scaling a team through growth'],
  },
  'VP of Sales': {
    required: [
      'Ten or more years in sales including leading leaders',
      'Ownership of a global revenue number',
      'Go-to-market strategy, segmentation and territory design',
      'Pricing and discounting discipline',
      'Board-level forecasting and accountability for its accuracy',
    ],
    preferred: ['International B2B SaaS', 'Experience through a significant scaling phase'],
  },
  'Sales Operations Analyst': {
    required: [
      'Three or more years in sales operations or revenue operations',
      'CRM administration and data quality ownership',
      'Pipeline and forecast reporting that leadership relies on',
      'Territory and quota modelling',
      'Commission calculation, accurately — this is somebody\'s pay',
    ],
    preferred: ['Salesforce or HubSpot administration', 'SQL', 'Win-loss analysis experience'],
  },
  'Solutions Engineer': {
    required: [
      'Three or more years in pre-sales engineering or a technical customer-facing role',
      'Ability to demonstrate a technical product credibly to a mixed audience',
      'Building proofs of concept that answer the customer\'s actual question',
      'Integration discussion — HRIS, identity providers and data residency',
      'Completing security questionnaires and RFP technical sections accurately',
      'Willingness to say something is not supported rather than letting a deal close on it',
    ],
    preferred: ['A software engineering background', 'Enterprise integration experience', 'HR technology domain knowledge'],
  },

  // ══ Marketing ════════════════════════════════════════════════════════════════
  'Content Marketing Manager': {
    required: [
      'Four or more years in content marketing with published work you can point to',
      'Strong writing and editing, and the judgement to cut your own paragraph',
      'Editorial calendar ownership and the ability to hold contributors to it',
      'Research discipline — sources cited, statistics checked',
      'Understanding of how search and answer engines actually use structured content',
      'Honest measurement: traffic that converts rather than traffic',
    ],
    preferred: ['B2B SaaS content', 'HR or recruitment domain knowledge', 'Experience commissioning and editing freelancers'],
  },
  'SEO & Growth Manager': {
    required: [
      'Four or more years in SEO with responsibility for organic performance',
      'Technical SEO: crawlability, indexation, canonicalisation, rendering and Core Web Vitals',
      'Structured data implementation, including JobPosting and its eligibility rules',
      'Keyword and intent research that decides what gets built',
      'Working with engineers on site architecture and internal linking',
      'Honest reporting that separates brand from non-brand traffic',
      'Understanding of thin-content risk when generating pages at scale',
    ],
    preferred: ['Experience with a large programmatic or location-based site', 'Log file analysis', 'International and hreflang work'],
  },
  'Performance Marketing Manager': {
    required: [
      'Three or more years managing paid acquisition budgets',
      'Google Ads and paid social managed hands-on',
      'Creative testing as the main lever rather than bid tweaking',
      'Tracking and attribution setup, and honesty about its limits',
      'Landing page testing',
    ],
    preferred: ['Recruitment marketing or job advertising', 'Programmatic display', 'GA4 and a tag manager'],
  },
  'Lifecycle Marketing Manager': {
    required: [
      'Three or more years in lifecycle, CRM or email marketing',
      'Marketing automation platform experience, building real journeys',
      'Segmentation based on behaviour rather than a list upload',
      'Consent and preference management as a legal requirement',
      'Deliverability management',
    ],
    preferred: ['In-product messaging', 'SQL for segmentation', 'B2B and B2C both'],
  },
  'Product Marketing Manager': {
    required: [
      'Four or more years in product marketing',
      'Positioning and messaging that is specific enough to be arguable',
      'Launch ownership end to end',
      'Sales enablement material the team actually uses',
      'Competitive research from the products themselves rather than their marketing',
      'Customer interviews to find out why people really bought',
    ],
    preferred: ['B2B SaaS', 'HR technology', 'Analyst relations exposure'],
  },
  'Brand & Communications Lead': {
    required: [
      'Six or more years in brand, communications or marketing leadership',
      'Ownership of a brand narrative across every channel',
      'External communications including press and analyst relations',
      'Crisis and sensitive communications handled quickly and honestly',
      'Employer brand experience',
    ],
    preferred: ['Agency and in-house both', 'Multi-market brand management'],
  },
  'Public Relations Manager': {
    required: [
      'Four or more years in public relations or communications',
      'Real relationships with journalists in a relevant sector',
      'Writing that is worth a journalist\'s time',
      'Spokesperson preparation',
      'Handling difficult inbound enquiry',
    ],
    preferred: ['Technology or HR sector coverage', 'Agency experience', 'Crisis communications'],
  },
  'Event Marketing Manager': {
    required: [
      'Three or more years running events end to end',
      'Logistics ownership: venue, stand, kit, travel, staffing and run of show',
      'Budget management against outcome',
      'Working with sales on follow-up planned before the event',
      'Honest reporting on what an event produced against its cost',
    ],
    preferred: ['Campus recruitment events', 'Conference stand management', 'Virtual and hybrid events'],
  },
  'Marketing Operations Manager': {
    required: [
      'Four or more years in marketing operations',
      'Marketing automation and CRM integration',
      'Lead scoring, routing and the data model behind them',
      'Attribution reporting, and the willingness to explain what it does not prove',
      'Database hygiene including consent state and deletion',
    ],
    preferred: ['HubSpot, Marketo or Pardot', 'SQL', 'Data privacy familiarity'],
  },
  'Blog Writer': {
    required: [
      'Two or more years writing professionally, with published work',
      'Research discipline and source citation — an invented statistic costs more than the article earns',
      'Ability to write in a house voice rather than your own',
      'Interviewing people to get material not available elsewhere',
      'Working with SEO without letting a piece become a keyword container',
    ],
    preferred: ['HR, careers or labour market subject knowledge', 'Experience writing for an Indian and international audience'],
  },
  'Newsletter Editor': {
    required: [
      'Two or more years in editorial or content, ideally with a newsletter',
      'Curation judgement — the willingness to cut the item that only fills a slot',
      'A distinct editorial voice',
      'Understanding of list growth and what the unsubscribe rate is telling you',
    ],
    preferred: ['Experience growing a newsletter audience', 'Email platform administration'],
  },
  'Marketing Design Intern': {
    required: [
      'Currently studying design or a related field, or building a portfolio',
      'Working knowledge of Figma or Adobe Creative Suite',
      'Willingness to take direction and revise',
    ],
    preferred: ['Social media asset design', 'Basic motion graphics'],
  },
  'Partnerships Manager': {
    required: [
      'Four or more years in partnerships, business development or alliances',
      'Negotiating agreements and then managing the relationship afterwards',
      'Joint go-to-market planning both sides actually commit to',
      'Enough technical fluency to own an integration roadmap conversation',
    ],
    preferred: ['Technology partnerships in SaaS', 'Ecosystem or marketplace experience'],
  },
  'Alliances Director': {
    required: [
      'Seven or more years in partnerships or alliances with revenue accountability',
      'Senior relationship building at partner organisations',
      'Structuring complex commercial agreements including revenue share',
      'Channel conflict management',
    ],
    preferred: ['Global systems integrator relationships', 'Experience building an alliance function'],
  },

  // ══ Customer ═════════════════════════════════════════════════════════════════
  'Customer Success Manager': {
    required: [
      'Three or more years in customer success or account management for a software product',
      'Onboarding customers into genuine adoption rather than completed configuration',
      'Business reviews backed by real usage data',
      'Early risk detection — usage falling, a champion leaving, a quiet renewal',
      'Renewal and expansion ownership',
      'Honesty internally about accounts that will not renew',
    ],
    preferred: ['B2B SaaS', 'HR technology or ATS experience', 'Technical enough to handle a configuration conversation'],
  },
  'Customer Success Manager — North America': {
    required: [
      'Three or more years in customer success for a B2B software product',
      'Comfort working across a large time-zone gap with supporting teams elsewhere',
      'Familiarity with US employment compliance as it touches hiring software — EEO reporting and retention',
      'Clear asynchronous written escalation',
    ],
    preferred: ['HR technology experience', 'Enterprise account management'],
  },
  'Customer Success Manager — APAC': {
    required: [
      'Three or more years in customer success across APAC markets',
      'Understanding that hiring practice differs substantially between these markets',
      'Working with local data-protection and employment requirements',
      'Ability to bring regional product gaps back with context',
    ],
    preferred: ['A regional language beyond English', 'HR technology experience'],
  },
  'Customer Success Director': {
    required: [
      'Seven or more years in customer success including team leadership',
      'Accountability for retention and expansion as numbers',
      'Designing an engagement model across customer segments',
      'Executive relationship ownership at large accounts',
      'Honest churn reporting including the reasons',
    ],
    preferred: ['Experience building a customer success function', 'Enterprise SaaS'],
  },
  'Renewals Manager': {
    required: [
      'Three or more years in renewals, account management or sales',
      'Running renewals to a process rather than a scramble',
      'Negotiation backed by usage and value evidence',
      'Accurate renewal forecasting including the churn',
      'Feeding churn reasons back with enough specificity to act on',
    ],
    preferred: ['SaaS subscription experience', 'Multi-year contract negotiation'],
  },
  'Technical Support Engineer': {
    required: [
      'Two or more years in technical support for a software product',
      'Debugging across a stack from a customer description that is rarely the actual problem',
      'API and integration troubleshooting, comfortable reading logs and HTTP traces',
      'SQL sufficient to investigate a data question',
      'Reproducing an issue before escalating, and escalating with what an engineer needs',
      'Handling a customer who is angry and right',
    ],
    preferred: ['Experience with webhooks and OAuth troubleshooting', 'Knowledge base writing', 'A scripting language'],
  },
  'Technical Support Engineer — APAC': {
    required: [
      'Two or more years in technical support for a software product',
      'API and integration troubleshooting',
      'Willingness to work a shift covering the APAC day',
      'Written escalation that stands on its own across time zones',
    ],
    preferred: ['A regional language', 'Experience in a follow-the-sun support model'],
  },
  'Support Specialist': {
    required: [
      'Some experience in a customer support or customer-facing role',
      'Clear, calm written communication',
      'Comfort across email, chat and phone',
      'Judgement about when to escalate and the discipline to stay with it until closed',
      'The right tone for people at an anxious point in their career',
    ],
    preferred: ['A second language', 'Experience with a helpdesk platform', 'SaaS support background'],
  },
  'Support Team Lead': {
    required: [
      'Four or more years in support including team leadership',
      'Queue and shift management across a working day',
      'Coaching through call and ticket review',
      'Escalation ownership and a working relationship with engineering',
      'Reporting volume drivers so the product team can remove them',
    ],
    preferred: ['Support tooling administration', 'Experience scaling a support team'],
  },
  'Implementation Consultant': {
    required: [
      'Three or more years implementing software for customers',
      'Configuring a product to a customer\'s process — workflows, roles, approvals and templates',
      'Data migration from systems that are messier than described',
      'Training administrators and end users so they can work without you',
      'Project management to a date, with slippage flagged early',
      'Clean handover with promises and open items written down',
    ],
    preferred: ['HRIS or ATS implementation', 'Integration configuration', 'SQL or data transformation ability'],
  },
  'Implementation Consultant — APAC': {
    required: [
      'Three or more years in software implementation',
      'Configuration and data migration experience',
      'Working across time zones with product and engineering elsewhere',
      'Familiarity with local employment and data-protection requirements in the region',
    ],
    preferred: ['A regional business language', 'HR technology experience'],
  },

  // ══ Operations, Supply & Facilities ══════════════════════════════════════════
  'Business Operations Analyst': {
    required: [
      'Two or more years in business operations, consulting or analytics',
      'Financial and operational modelling in a spreadsheet you can defend',
      'SQL or a BI tool for getting your own data',
      'Ability to take a cross-functional problem with no owner and make progress on it',
      'Bringing a recommendation rather than a survey of options',
    ],
    preferred: ['Consulting background', 'SaaS metrics familiarity', 'Experience running a planning cycle'],
  },
  'Business Operations Manager — Americas': {
    required: [
      'Five or more years in business operations with regional ownership',
      'Planning, reporting and operating rhythm for a region',
      'Working with regional leadership on targets and performance',
      'Familiarity with entity-level operational requirements in the region',
    ],
    preferred: ['Multi-entity operations', 'Experience coordinating with global functions across time zones'],
  },
  'Revenue Operations Manager': {
    required: [
      'Four or more years in revenue, sales or marketing operations',
      'Ownership of the systems connecting marketing, sales and customer success',
      'Forecast model building and improving its accuracy',
      'Territory, quota and compensation plan design',
      'Finding where deals stall and fixing the process rather than reporting on it',
    ],
    preferred: ['Salesforce administration', 'SQL and BI tooling', 'SaaS subscription metrics'],
  },
  'Operations Manager': {
    required: [
      'Five or more years in operations with team management',
      'Process design and documentation that survives a person leaving',
      'Vendor management',
      'Reporting against operational targets and acting on misses',
    ],
    preferred: ['Multi-site operations', 'Continuous improvement methodology'],
  },
  'Operations Manager — APAC': {
    required: [
      'Five or more years in regional operations',
      'Managing vendors and service providers across several markets',
      'Familiarity with the operational compliance requirements of employing across the region',
    ],
    preferred: ['Experience opening operations in a new market', 'A regional language'],
  },
  'Program Coordinator': {
    required: [
      'Two or more years in coordination, project support or programme administration',
      'Schedule, action and dependency tracking',
      'Making status honest rather than green',
      'Running a meeting so decisions get recorded',
      'The persistence to chase what would otherwise quietly not happen',
    ],
    preferred: ['Project management tooling', 'Experience in a cross-functional environment'],
  },
  'Logistics Coordinator': {
    required: [
      'Two or more years in logistics coordination',
      'Transport booking and consignment tracking',
      'Delivery documentation and proof of delivery discipline',
      'Telling people the truth about when a late consignment will actually arrive',
    ],
    preferred: ['Experience with a transport management system', 'Multi-modal exposure'],
  },
  'Supply Chain Manager': {
    required: [
      'Six or more years in supply chain with end-to-end ownership',
      'Demand planning and the balance between stock-out and working capital',
      'Supplier performance management with data rather than impression',
      'Cost and lead-time reduction you can quantify',
      'Risk management — single-source dependency and disruption planning',
    ],
    preferred: ['ERP experience', 'International or import supply chains', 'APICS or equivalent certification'],
  },
  'Warehouse Supervisor': {
    required: [
      'Three or more years supervising warehouse operations',
      'Receipt, put-away, picking, packing and dispatch processes',
      'Team management on a floor',
      'Stock accuracy through cycle counting',
      'Warehouse safety including materials handling equipment',
    ],
    preferred: ['WMS experience', 'Forklift certification or licensing'],
  },
  'Inventory Analyst': {
    required: [
      'Two or more years in inventory or supply chain analysis',
      'Strong spreadsheet ability and comfort with an ERP',
      'Reorder point and safety stock setting on evidence',
      'Investigating discrepancies to a cause rather than adjusting them away',
    ],
    preferred: ['SQL', 'Demand forecasting experience'],
  },
  'Procurement Specialist': {
    required: [
      'Three or more years in procurement or sourcing',
      'Running a tender from requirement to award',
      'Negotiation with market knowledge behind it',
      'Purchase order process management',
      'Supplier due diligence and onboarding',
      'Honest savings tracking against the price actually paid before',
    ],
    preferred: ['Category management exposure', 'ERP or procurement platform experience', 'Industrial or MRO procurement'],
  },
  'Category Manager': {
    required: [
      'Five or more years in procurement with category ownership',
      'Category strategy and supplier base design',
      'Major tender and negotiation leadership',
      'Supplier relationship management at a senior level',
      'Market knowledge sufficient to time a contract',
    ],
    preferred: ['Indirect or technology categories', 'Total cost of ownership modelling'],
  },
  'Contracts Administrator': {
    required: [
      'Two or more years in contract administration',
      'Contract lifecycle management from request to renewal',
      'Repository management so obligations can actually be found',
      'Key date tracking raised in time to act',
      'Attention to detail and comfort with legal language',
    ],
    preferred: ['A CLM platform', 'Paralegal or legal support background'],
  },
  'Workplace & Facilities Manager': {
    required: [
      'Five or more years in facilities or workplace management',
      'Vendor management across cleaning, catering, security and maintenance',
      'Statutory building compliance including fire safety and its certificates',
      'Space planning and move management',
      'Budget ownership',
    ],
    preferred: ['Multi-site management', 'Fit-out project experience', 'Health and safety qualification'],
  },
  'Maintenance Technician': {
    required: [
      'Two or more years in building services or equipment maintenance',
      'Preventive and corrective maintenance across electrical, plumbing and HVAC basics',
      'Working safely under permit where required',
      'Accurate maintenance records',
      'Judgement about what needs a specialist',
    ],
    preferred: ['A relevant trade certificate or ITI qualification', 'HVAC or electrical licensing'],
  },
  'Health & Safety Officer': {
    required: [
      'Three or more years in occupational health and safety',
      'Risk assessment, inspection and incident investigation',
      'Statutory compliance including registers, certificates and drills',
      'Training delivery that is worth sitting through',
      'Emergency preparedness including first aid cover',
    ],
    preferred: ['NEBOSH or an equivalent qualification', 'Multi-site experience', 'Fire safety certification'],
  },

  // ══ Finance ══════════════════════════════════════════════════════════════════
  'Financial Analyst': {
    required: [
      'Two or more years in financial planning and analysis',
      'Financial modelling to a standard that survives challenge',
      'Budgeting and forecasting cycle experience',
      'Variance analysis to a cause somebody can act on',
      'Strong Excel, and comfort with a reporting tool',
    ],
    preferred: ['SaaS metrics', 'SQL', 'A professional qualification in progress'],
  },
  'Financial Analyst — EMEA': {
    required: [
      'Three or more years in financial planning and analysis',
      'Multi-currency reporting and translation effects',
      'Working with local advisers on statutory requirements',
      'Budget and forecast partnership with regional leadership',
    ],
    preferred: ['Multi-entity European experience', 'IFRS familiarity'],
  },
  'Accountant': {
    required: [
      'Three or more years in accounting with month-end ownership',
      'General ledger, reconciliations and the discipline to clear items rather than carry them',
      'Fixed asset register and depreciation',
      'Statutory schedule preparation and audit support',
      'A relevant qualification — CA, CMA, ACCA or equivalent, qualified or part-qualified',
    ],
    preferred: ['ERP experience', 'Multi-entity accounting', 'Ind AS or IFRS'],
  },
  'Site Accountant — Koraput': {
    required: [
      'Three or more years in accounting, preferably at a plant or mine site',
      'Cost booking, stores accounting and site expenditure control',
      'Reconciling production and dispatch quantities to what is booked',
      'Contractor bill processing including measurement and certification',
      'Willingness to be based at the Koraput site',
    ],
    preferred: ['Mining or process industry accounting', 'Royalty computation familiarity', 'Odia'],
  },
  'Payroll Specialist': {
    required: [
      'Three or more years running payroll',
      'Indian statutory deductions and filings — provident fund, ESI, professional tax and TDS',
      'Joiners, leavers and full and final settlement',
      'Payroll to ledger reconciliation every cycle',
      'Absolute confidentiality and accuracy — this is somebody\'s salary',
    ],
    preferred: ['Multi-country payroll', 'Site payroll with attendance, shift allowance and overtime', 'A payroll platform'],
  },
  'Accounts Payable Executive': {
    required: [
      'Two or more years in accounts payable',
      'Three-way matching against purchase order and goods receipt',
      'Payment cycle management to terms',
      'Supplier statement reconciliation',
      'Expense claim processing against policy',
    ],
    preferred: ['ERP experience', 'GST input credit familiarity'],
  },
  'Accounts Payable Specialist': {
    required: [
      'Three or more years in accounts payable',
      'End-to-end payables cycle ownership',
      'Vendor master data control, particularly around bank detail changes',
      'Sub-ledger reconciliation and exception resolution',
      'Month-end accrual support',
    ],
    preferred: ['Shared service centre experience', 'Automation or OCR invoice processing'],
  },
  'Accounts Receivable Executive': {
    required: [
      'Two or more years in accounts receivable or collections',
      'Accurate and timely invoicing',
      'Collections with the judgement to understand why something is not being paid',
      'Receipt allocation and ledger hygiene',
      'Ageing reporting and early escalation of genuine risk',
    ],
    preferred: ['B2B collections', 'Working with sales on account-level payment problems'],
  },
  'Billing Specialist': {
    required: [
      'Two or more years in billing, preferably subscription billing',
      'Proration, credits and refunds handled correctly',
      'Billing query and dispute resolution',
      'Reconciliation of billing to revenue and to contract terms',
    ],
    preferred: ['A subscription billing platform', 'Revenue recognition familiarity'],
  },
  'Tax Manager': {
    required: [
      'Six or more years in tax, in practice or in industry',
      'Indian direct and indirect tax — GST, TDS and corporate tax compliance',
      'Transfer pricing documentation for intercompany arrangements',
      'Handling assessments, notices and the correspondence with them',
      'A qualification — CA or equivalent',
    ],
    preferred: ['International tax across several jurisdictions', 'Experience with a tax authority audit'],
  },
  'Treasury Analyst': {
    required: [
      'Three or more years in treasury or a finance role covering cash',
      'Cash positioning and forecasting',
      'Foreign exchange exposure management',
      'Banking relationship and mandate administration',
      'Payment controls and segregation of duties',
    ],
    preferred: ['Hedging instrument experience', 'Multi-currency treasury', 'A treasury management system'],
  },
  'Internal Auditor': {
    required: [
      'Four or more years in internal or external audit',
      'Risk-based audit planning',
      'Control testing with documented evidence rather than an assurance taken on trust',
      'Findings written specifically and rated honestly',
      'Remediation follow-up and verification',
    ],
    preferred: ['CIA, CA or equivalent', 'IT audit exposure', 'Experience auditing a site operation'],
  },
  'Finance Controller': {
    required: [
      'Eight or more years in accounting and control',
      'Ownership of the close to a timetable, and improving it',
      'A control environment you can demonstrate works',
      'External audit management',
      'Statutory reporting across multiple entities',
      'A qualification — CA, CPA, ACCA or equivalent',
    ],
    preferred: ['Multi-country group reporting', 'Experience with a system implementation'],
  },
  'VP Finance': {
    required: [
      'Twelve or more years in finance with leadership across several sub-functions',
      'Financial strategy, capital allocation and planning ownership',
      'Board presentation and accountability for the numbers presented',
      'Building a finance leadership team',
      'A qualification and a track record at scale',
    ],
    preferred: ['Fundraising or corporate transaction experience', 'Multi-entity international group experience'],
  },

  // ══ Legal ════════════════════════════════════════════════════════════════════
  'Corporate Counsel': {
    required: [
      'Five or more years qualified, in practice or in-house',
      'Commercial contract drafting and negotiation — customer, vendor and data processing agreements',
      'Employment and corporate advisory across more than one jurisdiction',
      'Building a contracting playbook so routine negotiation does not need a lawyer per clause',
      'Advice stated plainly with the risk named, rather than hedged into uselessness',
    ],
    preferred: ['Technology or SaaS in-house experience', 'Data protection knowledge', 'Admission in India plus one other jurisdiction'],
  },
  'Data Privacy Officer': {
    required: [
      'Five or more years in data protection or privacy',
      'GDPR and India\'s DPDP Act applied in practice rather than cited',
      'Record of processing maintained as a true document',
      'Data protection impact assessments run before processing starts',
      'Data subject request handling within statutory time limits',
      'Breach assessment and notification against a 72-hour clock',
    ],
    preferred: ['CIPP/E, CIPM or equivalent', 'Cross-border transfer mechanism experience', 'A legal qualification'],
  },
  'Contracts Manager': {
    required: [
      'Five or more years in contract management',
      'Negotiating standard and near-standard agreements independently',
      'Template and fallback position maintenance',
      'Obligation, renewal and expiry tracking',
      'Reporting on where standard terms keep being pushed back on',
    ],
    preferred: ['A legal qualification', 'CLM platform implementation', 'Technology contracting'],
  },
  'Company Secretary': {
    required: [
      'A Company Secretary qualification and membership',
      'Corporate secretarial compliance for multiple entities',
      'Board and committee meeting convening and minuting',
      'Statutory registers and timely filings',
      'Governance advice to a board',
    ],
    preferred: ['Multi-jurisdiction entity administration', 'Experience with incorporations and closures'],
  },
  'Paralegal': {
    required: [
      'Two or more years in a paralegal or legal support role',
      'Drafting and reviewing routine agreements against a template',
      'Contract repository and intake management',
      'Legal research',
      'Compliance calendar management and the persistence to chase',
    ],
    preferred: ['A law degree', 'In-house experience', 'Corporate secretarial exposure'],
  },

  // ══ Strategy & Executive ═════════════════════════════════════════════════════
  'Strategy Manager': {
    required: [
      'Four or more years in strategy, consulting or corporate development',
      'Market and competitive analysis from primary sources',
      'Business case building behind significant investment',
      'Ability to bring a view rather than an analysis without a conclusion',
    ],
    preferred: ['Top-tier consulting background', 'Technology sector focus', 'Corporate development exposure'],
  },
  'Corporate Development Analyst': {
    required: [
      'Two or more years in investment banking, private equity, consulting or corporate development',
      'Valuation and scenario modelling',
      'Diligence support across workstreams',
      'Market tracking maintained as a live view',
    ],
    preferred: ['Technology sector transactions', 'A finance qualification'],
  },
  'Business Analyst': {
    required: [
      'Three or more years in business analysis',
      'Process mapping of current and target state, specific about the gap',
      'Requirements documentation a team can build from',
      'Stakeholder management across functions',
    ],
    preferred: ['Experience in a system implementation', 'SQL', 'Agile delivery experience'],
  },
  'Chief of Staff': {
    required: [
      'Six or more years across operations, strategy or consulting',
      'Running an executive operating rhythm so decisions get made and recorded',
      'Taking on priorities that need an owner and do not have one',
      'Board material preparation',
      'Judgement and complete discretion on sensitive matters',
    ],
    preferred: ['Consulting or investment background', 'Experience in a scaling company'],
  },
  'Executive Assistant': {
    required: [
      'Three or more years supporting senior executives',
      'Complex calendar management across time zones, with the trade-offs it demands',
      'End-to-end travel arrangement including when it goes wrong',
      'Meeting preparation and action follow-up',
      'Complete discretion with confidential information',
    ],
    preferred: ['Board meeting support', 'Experience in an international company'],
  },

  // ══ People ═══════════════════════════════════════════════════════════════════
  'HR Business Partner': {
    required: [
      'Five or more years in HR with business partnering experience',
      'Coaching managers through underperformance, conflict and difficult exits',
      'Employee relations casework — investigated fairly, documented and defensible',
      'Organisational design and change support',
      'Running performance and compensation cycles',
      'Willingness to tell leadership what they would rather not hear',
    ],
    preferred: ['Experience supporting technical or site-based populations', 'An HR qualification', 'Multi-jurisdiction employment knowledge'],
  },
  'HR Generalist': {
    required: [
      'Two or more years in an HR generalist role',
      'Employee lifecycle administration end to end',
      'Accurate and compliant employee records',
      'Benefits, leave and policy administration',
      'Knowing when to escalate',
    ],
    preferred: ['HRIS experience', 'Indian labour law familiarity', 'An HR qualification'],
  },
  'People Operations Specialist': {
    required: [
      'Two or more years in people operations or HR administration',
      'Onboarding that works on day one, at every site',
      'HRIS data accuracy, since everything downstream depends on it',
      'Documentation, letters and verification requests',
      'Improving the processes that generate the most queries',
    ],
    preferred: ['Process automation experience', 'Multi-site or multi-country administration'],
  },
  'Compensation & Benefits Analyst': {
    required: [
      'Three or more years in compensation and benefits',
      'Band structure design and market benchmarking against real data',
      'Cost modelling of compensation decisions',
      'Benefits administration across jurisdictions with different statutory requirements',
      'Pay equity analysis',
    ],
    preferred: ['Equity or long-term incentive administration', 'Multi-country compensation', 'Strong analytics ability'],
  },
  'Employee Relations Manager': {
    required: [
      'Six or more years in HR with substantial employee relations casework',
      'Investigating grievance and misconduct impartially and writing it up defensibly',
      'Advising managers on process and stopping the shortcut that becomes a claim',
      'Policy maintenance current with the law in each jurisdiction',
      'Statutory body, works council or union relationships',
    ],
    preferred: ['Indian industrial relations experience', 'A legal or HR qualification', 'Site or manufacturing ER experience'],
  },
  'HRIS Analyst': {
    required: [
      'Three or more years administering an HR information system',
      'Configuration, data integrity and integrations',
      'People reporting and dashboards',
      'Automating manual steps in people processes',
      'Security model design for employee data',
    ],
    preferred: ['A specific HRIS platform in depth', 'SQL', 'Integration or API experience'],
  },
  'Diversity & Inclusion Manager': {
    required: [
      'Four or more years in diversity and inclusion or a closely related people role',
      'Workforce and hiring data analysis, reported honestly',
      'Working with talent acquisition on structured, fairer hiring practice',
      'Programme design — mentorship, networks and inclusive leadership training',
      'Meeting statutory reporting obligations where they exist',
    ],
    preferred: ['Experience in a multi-country organisation', 'Accessibility and disability inclusion work'],
  },
  'HR Director': {
    required: [
      'Ten or more years in HR with leadership of a function',
      'People strategy ownership — organisation design, capability, culture and retention',
      'Executive advisory including on decisions not yet asked about',
      'Employment compliance across multiple jurisdictions',
      'Building an HR leadership team',
    ],
    preferred: ['Experience with both corporate and site-based workforces', 'A senior HR qualification'],
  },

  // ══ Talent Acquisition ═══════════════════════════════════════════════════════
  'Technical Recruiter': {
    required: [
      'Three or more years recruiting technical roles',
      'Active sourcing rather than waiting for applications',
      'Outreach a good engineer would actually reply to',
      'Enough technical screening ability to have a real conversation',
      'Process management so nobody waits three weeks for an answer',
      'Offer closing including a counter-offer handled honestly',
    ],
    preferred: ['In-house recruiting at a technology company', 'ATS administration', 'Data and AI hiring experience'],
  },
  'Sourcing Specialist': {
    required: [
      'Two or more years sourcing candidates',
      'Boolean and platform search to a genuinely skilled level',
      'Outreach specific enough to the person to get replies',
      'Running a first conversation and handing over a genuinely interested candidate',
      'Talent pool maintenance',
    ],
    preferred: ['Technical sourcing', 'Market mapping experience', 'A second language'],
  },
  'Recruitment Coordinator': {
    required: [
      'Some experience in coordination, administration or recruiting support',
      'Scheduling across calendars, time zones and panels, and fixing it when it falls apart',
      'Candidate communication that keeps people informed',
      'ATS data accuracy',
      'Organisation under pressure',
    ],
    preferred: ['ATS experience', 'Travel and reimbursement administration', 'Campus recruitment exposure'],
  },
  'Campus Recruitment Lead': {
    required: [
      'Five or more years in recruiting with substantial campus experience',
      'Placement cell relationships across engineering, management or technical institutions',
      'Running a placement season where a year of hiring compresses into weeks',
      'Designing a selection process that is fair and defensible at volume',
      'Managing the offer-to-joining gap, which is where campus hiring is usually lost',
    ],
    preferred: ['Relationships across tier-two and tier-three institutions', 'Internship programme ownership', 'ITI or polytechnic hiring'],
  },
  'Field Recruiter — Koraput': {
    required: [
      'Three or more years recruiting for site, trade or industrial roles',
      'Running trade tests, practical assessment and a medical process at site',
      'Verifying certificates and statutory qualifications',
      'Odia and English',
      'Willingness to be based in the Koraput region and travel to the surrounding blocks',
    ],
    preferred: ['Mining or heavy industry recruitment', 'ITI and polytechnic relationships', 'Experience with high-volume site mobilisation'],
  },
  'Recruitment Marketing Manager': {
    required: [
      'Four or more years in recruitment marketing or employer brand',
      'Careers site ownership as a product — content, search and conversion',
      'Campaign building for genuinely hard-to-fill roles',
      'Working with content and media teams to show the work rather than describe the culture',
      'Funnel measurement from impression to hire',
    ],
    preferred: ['SEO knowledge', 'Experience with job advertising platforms', 'Video and social content production'],
  },
  'Head of Talent Acquisition': {
    required: [
      'Eight or more years in recruiting with leadership of a team',
      'Hiring strategy and workforce planning alongside finance and the business',
      'A record of structured interviewing and published rubrics actually adopted',
      'Building a recruiting team across specialisms',
      'Honest reporting on time to hire, quality and where the process fails',
    ],
    preferred: ['Recruiting across both corporate and industrial populations', 'Multi-country hiring', 'Experience at a company whose product is hiring'],
  },

  // ══ Learning ═════════════════════════════════════════════════════════════════
  'Learning & Development Manager': {
    required: [
      'Five or more years in learning and development',
      'Capability assessment rather than a course catalogue',
      'Management development programme design and delivery',
      'Learning platform management',
      'Statutory and safety training tracking, which is auditable',
      'Measuring whether training changed anything',
    ],
    preferred: ['Experience with site-based and safety-critical training', 'Instructional design ability', 'Coaching qualification'],
  },
  'Instructional Designer': {
    required: [
      'Three or more years in instructional design',
      'Designing from objectives and assessment rather than from content',
      'E-learning authoring and blended programme design',
      'Working with subject-matter experts without letting content become a lecture',
      'Designing for constrained access — a phone, a poor connection, a second language',
    ],
    preferred: ['Authoring tool expertise', 'Multilingual content design', 'Video production ability'],
  },
  'Technical Trainer': {
    required: [
      'Three or more years delivering technical training',
      'Ability to build material and keep it current with a changing product',
      'In-person and remote delivery, adjusting when the room is not following',
      'Assessment that tests whether people can do the thing',
    ],
    preferred: ['Certification programme ownership', 'A support or implementation background', 'Instructional design ability'],
  },

  // ══ Media & Creative Production ══════════════════════════════════════════════
  'Videographer': {
    required: [
      'Two or more years shooting professionally, with a showreel',
      'Confident operating a cinema or mirrorless camera in manual — exposure, white balance and picture profile',
      'Interview lighting in rooms that were not built for it',
      'Audio capture: radio mics, boom placement and a usable backup track',
      'Media management discipline — two backups before a card is cleared, without exception',
      'Shooting for the edit: coverage, cutaways and room tone',
      'Willingness to travel to sites, including remote ones',
    ],
    preferred: ['Basic editing ability', 'Drone certification', 'Experience shooting in industrial environments'],
  },
  'Senior Videographer / Director of Photography': {
    required: [
      'Five or more years as a camera operator or DOP with a strong reel',
      'Ownership of a look — lensing, lighting and movement — held across a shoot',
      'Shot listing and lighting planning from a script',
      'Leading a camera department and directing gaffer and grip',
      'Working with a colourist so what is graded matches the intent',
      'Making the call when location, light or schedule changes',
    ],
    preferred: ['Experience in difficult conditions — industrial, remote or weather-dependent', 'Knowledge of log workflows and LUTs', 'Documentary and commercial both'],
  },
  'Photographer': {
    required: [
      'Three or more years shooting professionally, with a portfolio',
      'Portraiture, including with people who do not want their photograph taken',
      'Location lighting with a small kit, and knowing when available light is better',
      'Editing and delivering a selected, finished set rather than a card',
      'Archive organisation and captioning',
    ],
    preferred: ['Industrial or documentary photography', 'Experience working to site safety rules', 'Video ability'],
  },
  'Video Editor': {
    required: [
      'Two or more years editing professionally, with a reel',
      'Premiere Pro or DaVinci Resolve to a professional standard',
      'Finding the story in the rushes, which is most of the job',
      'Media management and project organisation somebody else could pick up',
      'Sound editing — levels, noise and music that sits under a voice',
      'Reframing properly for landscape, square and vertical rather than cropping',
      'Taking notes without defending the first cut',
    ],
    preferred: ['After Effects', 'Colour grading basics', 'Subtitling workflows'],
  },
  'Senior Video Editor': {
    required: [
      'Five or more years editing with a strong reel',
      'Working with a director from assembly to lock',
      'Post pipeline ownership — media management, proxies and hand-off to grade and sound',
      'Supervising and reviewing other editors\' cuts',
      'Technical delivery to platform specifications',
    ],
    preferred: ['Long-form or documentary experience', 'Colour and sound finishing ability', 'Post supervision'],
  },
  'Motion Graphics Designer': {
    required: [
      'Three or more years in motion design with a reel',
      'After Effects to a professional standard',
      'Designing to a brand system rather than to plugin defaults',
      'Building reusable templates for work that will be made repeatedly',
      'Correct delivery including alpha channels and platform specifications',
    ],
    preferred: ['Cinema 4D or Blender', 'Expressions and scripting', 'Data-driven or automated graphics'],
  },
  'Live Streaming Operator (OBS)': {
    required: [
      'Two or more years running live streams or broadcasts',
      'OBS to a genuinely advanced level — scenes, sources, transitions and overlays',
      'Signal chain management: camera, audio, encoder settings and a backup connection',
      'Audio, which is what an audience actually leaves over',
      'Monitoring stream health live and fixing it without the audience noticing',
      'Calm under pressure — there is no second take',
    ],
    preferred: ['vMix or Wirecast', 'Hardware encoder and switcher experience', 'Multi-camera live production'],
  },
  'Broadcast Engineer': {
    required: [
      'Four or more years in broadcast or AV engineering',
      'Signal path design — SDI and NDI routing, conversion, sync and monitoring',
      'Encoder, switcher and streaming infrastructure configuration',
      'Networking for video, including bandwidth and latency behaviour',
      'Fault diagnosis while a production is live',
    ],
    preferred: ['IP video standards such as SMPTE 2110', 'Studio build experience', 'Audio engineering ability'],
  },
  'Studio Manager': {
    required: [
      'Three or more years managing a studio or production facility',
      'Equipment inventory, maintenance and servicing schedules',
      'Booking, crew and production coordination',
      'Budget and purchasing ownership',
      'Studio safety — rigging, power and load limits',
    ],
    preferred: ['Technical production background', 'Experience specifying and buying kit'],
  },
  'Content Producer': {
    required: [
      'Three or more years producing content end to end',
      'Concept development and treatment writing',
      'Shoot planning: schedule, crew, locations, permissions and budget',
      'Running a shoot day and making the calls when the plan meets reality',
      'Steering an edit and managing approvals without a piece being reviewed to death',
      'Delivering on the date',
    ],
    preferred: ['Branded content or corporate production', 'Some shooting or editing ability', 'Multi-format production'],
  },
  'Line Producer': {
    required: [
      'Four or more years line producing or production managing',
      'Budgeting a production and then holding it',
      'Scheduling and call sheet construction',
      'Crew, kit, location and supplier booking',
      'Permits, insurance and clearances, including for industrial sites',
      'Production settlement — invoices, releases and the paperwork',
    ],
    preferred: ['Experience with remote or industrial locations', 'Commercial or branded content', 'Knowledge of production insurance'],
  },
  'Production Coordinator': {
    required: [
      'Two or more years coordinating productions',
      'Call sheet production and distribution',
      'Paperwork management: releases, permits, insurance and risk assessments',
      'Travel and access logistics, including to difficult locations',
      'Being the person who knows where everybody is meant to be',
    ],
    preferred: ['Experience with site access procedures', 'Production accounting exposure'],
  },
  'Production Assistant': {
    required: [
      'Some experience on set, or a genuine determination to learn',
      'Physical capability for a long shoot day, including lifting and carrying',
      'Reliability and timekeeping',
      'Looking after contributors, who are usually nervous',
      'A driving licence is useful',
    ],
    preferred: ['Film or media studies', 'Any camera, sound or lighting exposure', 'First aid certification'],
  },
  'Scriptwriter': {
    required: [
      'Three or more years writing scripts, with produced work',
      'Research including interviewing the people who do the job being filmed',
      'Writing for the ear rather than the page',
      'Writing to a duration',
      'Taking notes and rewriting without losing the piece',
    ],
    preferred: ['Corporate or branded content', 'Documentary writing', 'Writing in more than one language'],
  },
  'Storyboard Artist': {
    required: [
      'Two or more years storyboarding, with a portfolio',
      'Drawing quickly and clearly — this is communication, not illustration',
      'Understanding of staging, framing and how a sequence cuts',
      'Working with a director',
    ],
    preferred: ['Animatic production with timing', 'Digital storyboarding tools', 'Animation background'],
  },
  'Art Director — Production': {
    required: [
      'Four or more years in art direction or production design',
      'Designing to a script and a budget at the same time',
      'Sourcing, building and dressing, and managing the crew doing it',
      'Continuity across a multi-day shoot',
      'Striking a location properly afterwards',
    ],
    preferred: ['Set construction experience', 'Props and wardrobe coordination'],
  },
  'Gaffer / Lighting Technician': {
    required: [
      'Three or more years as a gaffer or lighting technician',
      'Rigging and operating lighting safely, including stands and rigging points',
      'Power distribution including generators and load calculation',
      'Shaping light with flags, diffusion, negative fill and bounce',
      'Working at height and with electricity to the safety standard',
      'Proper strike and pack so kit works on the next job',
    ],
    preferred: ['Electrical certification', 'Large-format or studio lighting', 'DMX and lighting control'],
  },
  'Key Grip': {
    required: [
      'Three or more years as a grip',
      'Dolly, jib and slider operation, including laying track for a smooth move',
      'Rigging flags, nets and frames with the gaffer',
      'Rigging safety including vehicle-mounted camera work',
      'Physical capability and problem-solving under time pressure',
    ],
    preferred: ['Specialist rigging experience', 'Crane or technocrane', 'Rigging certification'],
  },
  'Camera Assistant / Focus Puller': {
    required: [
      'Two or more years as a camera assistant',
      'Pulling focus reliably — the job that decides whether a take is usable',
      'Camera build, preparation and maintenance including lenses, filters and support',
      'Battery and media management through a shoot day',
      'Marking, measuring and knowing the lens well enough to judge it',
      'Accurate camera reports',
    ],
    preferred: ['Wireless follow focus systems', 'Multiple camera systems', 'DIT ability'],
  },
  'Digital Imaging Technician': {
    required: [
      'Three or more years as a DIT or in on-set data management',
      'Absolute data safety discipline — checksummed copies to two destinations before any card is cleared',
      'LUT creation, look management and camera matching',
      'Exposure monitoring and flagging a problem while it can still be reshot',
      'Dailies preparation and organised hand-off to post',
    ],
    preferred: ['Colour science knowledge', 'Resolve or Livegrade', 'Multi-camera workflows'],
  },
  'Sound Recordist': {
    required: [
      'Three or more years recording production sound',
      'Radio mics, boom operation and mixing on location',
      'Getting clean dialogue in environments not designed for it',
      'Timecode and sync management',
      'Recording room tone and wild lines because the edit will need them',
      'Accurate sound reports and organised hand-off',
    ],
    preferred: ['Multi-track field recording', 'Post-production sound ability', 'Experience in industrial environments'],
  },
  'Audio Engineer': {
    required: [
      'Three or more years in audio engineering',
      'Recording, editing and mixing for film, podcast or broadcast',
      'Mixing for the destination rather than for your headphones',
      'Dialogue clean-up: noise, plosives and room',
      'Studio chain maintenance and calibration',
    ],
    preferred: ['Loudness standards for broadcast and streaming', 'Music production ability', 'Live sound experience'],
  },
  'Sound Designer & Composer': {
    required: [
      'Four or more years in sound design or composition, with a portfolio',
      'Designing sound to picture — effects, atmosphere and texture',
      'Composing original music to a cut',
      'Library and licensing management kept straight',
      'Mixing to loudness standards rather than by ear alone',
    ],
    preferred: ['Orchestral or live instrument recording', 'Foley', 'Experience across several genres'],
  },
  'Podcast Producer': {
    required: [
      'Two or more years producing podcasts or audio content',
      'Guest research and questions that get past the prepared answer',
      'Clean studio and remote recording, with a local track from each end',
      'Editing for pace, cutting what is only there because it was said',
      'Publishing, distribution, show notes and chapters',
    ],
    preferred: ['Audience growth experience', 'Video podcast production', 'Interviewing ability'],
  },
  'Colourist': {
    required: [
      'Four or more years grading professionally, with a reel',
      'DaVinci Resolve to a professional standard',
      'Shot matching across a sequence shot over several days',
      'Calibrated monitoring and correct colour management',
      'Colour space and deliverable requirements including broadcast-legal output',
    ],
    preferred: ['Working with DOPs before a shoot', 'Film emulation and look development', 'HDR grading'],
  },
  'VFX & Compositing Artist': {
    required: [
      'Three or more years compositing, with a reel',
      'Nuke or After Effects to a professional standard',
      'Clean-up, screen replacement, tracking and set extension',
      'Rotoscoping and keying including difficult edges',
      'Matching grade, grain and lens characteristics so the work is invisible',
      'Render and version management',
    ],
    preferred: ['3D integration', 'Planar tracking', 'Camera solve experience'],
  },
  '3D Artist': {
    required: [
      'Three or more years in 3D, with a portfolio',
      'Modelling, texturing, lighting and rendering',
      'Blender, Cinema 4D or Maya to a professional standard',
      'Building reusable assets rather than rebuilding each time',
      'Matching 3D to live-action plates',
    ],
    preferred: ['Product visualisation', 'Real-time engines', 'Simulation experience'],
  },
  'Photo Editor & Retoucher': {
    required: [
      'Two or more years in photo editing and retouching',
      'Lightroom and Photoshop to a professional standard',
      'Culling and selection judgement',
      'Natural retouching appropriate to corporate and documentary work',
      'Colour correction and set matching',
      'Metadata and caption discipline',
    ],
    preferred: ['Batch processing and automation', 'Colour management knowledge'],
  },
  'Media Librarian & Archivist': {
    required: [
      'Three or more years in media asset management or archiving',
      'Cataloguing and tagging so material can be found years later',
      'Metadata standards enforced at ingest rather than repaired afterwards',
      'Backup and archive strategy with verified restores',
      'Rights, release and licence expiry tracking',
    ],
    preferred: ['A DAM or MAM platform', 'Library or information science background', 'Preservation format knowledge'],
  },
  'Subtitler & Captioner': {
    required: [
      'Two or more years subtitling or captioning',
      'Timing captions to speech so they are readable',
      'Accessibility standards including speaker identification and non-speech audio',
      'Translation and localisation without losing meaning to a literal rendering',
      'Delivery in the formats each platform requires',
    ],
    preferred: ['Two or more Indian languages', 'Subtitling software expertise', 'Live captioning'],
  },
  'Teleprompter Operator': {
    required: [
      'Some experience operating a prompter, or comparable live production experience',
      'Reading a presenter and matching their pace',
      'Script formatting and last-minute changes during a recording',
      'Prompter hardware setup and mounting',
    ],
    preferred: ['Live broadcast experience', 'Multi-language prompting'],
  },
  'Creative Director': {
    required: [
      'Eight or more years in creative roles with a strong body of work',
      'Concept development for campaigns and major productions',
      'Directing a creative team and raising work through review rather than taking it over',
      'Presenting and defending work, and knowing which notes to take',
      'Holding brand coherence across a lot of output by a lot of people',
    ],
    preferred: ['Agency and in-house both', 'Film direction experience', 'Employer brand work'],
  },
  'Event Production Manager': {
    required: [
      'Four or more years producing live events',
      'Technical build planning: staging, audio, lighting, video and power',
      'Crew, supplier and schedule management through build, show and strike',
      'Running a show and making the calls when something fails',
      'Event safety including crowd, rigging and electrical',
    ],
    preferred: ['Hybrid and streamed events', 'Large venue experience', 'A safety qualification'],
  },
  'Casting Coordinator': {
    required: [
      'Two or more years in casting or talent coordination',
      'Sourcing through agencies and direct outreach',
      'Organising auditions and self-tapes with clear briefs',
      'Contracts, releases, usage rights and payment administration',
      'Absolute clarity that we never take a fee from anyone auditioning, and will report anyone who suggests it',
    ],
    preferred: ['Commercial casting experience', 'A talent database of your own', 'Regional-language casting'],
  },
  'Wardrobe & Styling Assistant': {
    required: [
      'Some experience in wardrobe, styling or fashion',
      'Sourcing and preparing wardrobe for shoots',
      'Continuity across a multi-day shoot',
      'Fittings and basic alterations',
      'Organisation — returns, laundering and settlement',
    ],
    preferred: ['Costume or fashion training', 'Experience on commercial shoots'],
  },
  'Makeup & Hair Artist': {
    required: [
      'Two or more years doing makeup and hair for camera',
      'A kit that genuinely covers a full range of skin tones',
      'Continuity through a shoot day and touch-ups between takes',
      'Professional hygiene standards',
      'Working quickly with people who are nervous about being filmed',
    ],
    preferred: ['Formal training', 'Grooming for corporate and broadcast work', 'Special effects ability'],
  },
  'Media Monitoring Analyst': {
    required: [
      'Two or more years in media monitoring, PR or communications',
      'Daily monitoring across press, broadcast, social and online',
      'Judgement about what actually needs a response, quickly',
      'Consistent sentiment and share-of-voice methodology',
      'Archive maintenance',
    ],
    preferred: ['A media monitoring platform', 'Multi-language monitoring'],
  },
  'Video Presenter / Anchor': {
    required: [
      'Two or more years presenting on camera, with a reel',
      'Working from a script and from a prompter and making both sound like speech',
      'Interviewing on camera and actually listening',
      'Taking direction and keeping energy on the fifth take',
      'Clear, natural delivery',
    ],
    preferred: ['Presenting in more than one Indian language', 'Live broadcast or event hosting', 'Some journalism background'],
  },
  'Actor — Brand Films': {
    required: [
      'Acting training or demonstrable experience, with a showreel',
      'Working from a script and taking direction on set',
      'Hitting marks and holding continuity across takes and days',
      'Professional reliability against a call sheet',
    ],
    preferred: ['Screen acting training', 'Commercial or corporate film experience', 'More than one language'],
  },
  'Voice-Over Artist — Indian Languages': {
    required: [
      'Professional voice-over experience with a demo reel',
      'Native or near-native fluency in at least one of Hindi, Odia, Tamil, Telugu, Bengali or Marathi',
      'Reading to timing, to picture and to a brief',
      'Consistency across a session and matching one recorded weeks earlier',
      'Access to a properly treated recording setup for remote work',
    ],
    preferred: ['More than one language', 'Character and narration range', 'Dubbing experience'],
  },
  'Event Host / Emcee': {
    required: [
      'Two or more years hosting events',
      'Holding a room, including when the schedule slips and you have to fill',
      'Working from a run of show and adapting when it changes',
      'On-stage interviewing and audience interaction',
    ],
    preferred: ['Hosting in more than one language', 'Campus or youth audience experience', 'Live streaming experience'],
  },
  'Sign Language Interpreter': {
    required: [
      'Professional qualification or certification in Indian Sign Language interpreting',
      'Experience interpreting events, meetings or media',
      'Preparation from material in advance, particularly technical vocabulary',
      'Adherence to professional standards including confidentiality',
    ],
    preferred: ['Experience interpreting in employment or hiring contexts', 'Technical or corporate vocabulary', 'Advising on production accessibility'],
  },

  // ══ Social ═══════════════════════════════════════════════════════════════════
  'Social Media Manager': {
    required: [
      'Four or more years managing social channels professionally',
      'Building content for each platform rather than cross-posting one asset',
      'Community management and setting the tone of a reply, particularly to a complaint',
      'Handling a situation that is turning, quickly and without making it worse',
      'Honest reporting including when a campaign did nothing',
      'Understanding of the difference between an audience that matters and a number',
    ],
    preferred: ['B2B and employer brand social', 'Video-first content experience', 'Paid social familiarity'],
  },
  'Social Media Executive': {
    required: [
      'One or more years managing social channels',
      'Platform-appropriate copywriting',
      'Publishing and scheduling to a calendar',
      'Community response within a standard',
      'Weekly performance reporting',
    ],
    preferred: ['Basic design or video editing', 'A scheduling platform', 'A second language'],
  },
  'Content Creator (Short-Form Video)': {
    required: [
      'Demonstrable short-form video work with real audience results',
      'Shooting, editing and publishing largely on your own',
      'Understanding of what holds attention in the first two seconds, from data rather than an article',
      'Comfort appearing on camera',
      'Working in a brand voice while making something that does not look like an advertisement',
    ],
    preferred: ['A personal audience you built yourself', 'Editing on both mobile and desktop', 'More than one language'],
  },
  'Regional Content Creator — Odia': {
    required: [
      'Native Odia fluency, and enough English to work with the wider team',
      'Demonstrable short-form video work',
      'Shooting and editing your own content on location',
      'Comfort on camera and in the local community online',
      'Willingness to travel to the Koraput and Keonjhar operations',
    ],
    preferred: ['An existing Odia-language audience', 'Knowledge of the region', 'Photography ability'],
  },
  'Regional Content Creator — Tamil': {
    required: [
      'Native Tamil fluency, and enough English to work with the wider team',
      'Demonstrable short-form video work',
      'Shooting and editing your own content',
      'Comfort on camera and managing a community in Tamil',
    ],
    preferred: ['An existing Tamil-language audience', 'Campus or careers content experience'],
  },
  'Regional Content Creator — Hindi': {
    required: [
      'Native Hindi fluency, and enough English to work with the wider team',
      'Demonstrable short-form video work',
      'Shooting and editing your own content',
      'Comfort on camera and managing a Hindi-language community',
      'Willingness to travel to the Jharkhand, Chhattisgarh and Rajasthan sites',
    ],
    preferred: ['An existing Hindi-language audience', 'Industrial or site content experience'],
  },
  'Community Manager': {
    required: [
      'Three or more years in community management',
      'Daily presence in a community rather than broadcasting into it',
      'Setting and enforcing guidelines fairly, including difficult moderation calls',
      'Bringing community feedback back internally with evidence',
      'Growing membership without the room getting worse',
    ],
    preferred: ['Professional or career-focused communities', 'Discord, Slack or forum platform experience', 'Event or programme running'],
  },
  'Influencer & Creator Partnerships Manager': {
    required: [
      'Three or more years in influencer or creator partnerships',
      'Identifying creators by audience relevance rather than size',
      'Negotiating terms, deliverables and usage rights',
      'Briefing creators properly and then letting them make it in their own voice',
      'Ensuring disclosure is correct, which is a legal requirement',
      'Measuring what a partnership actually delivered against cost',
    ],
    preferred: ['Creator relationships in India', 'Campaign management at scale', 'Contract and rights familiarity'],
  },
  'Social Media Analyst': {
    required: [
      'Two or more years in social or marketing analytics',
      'Cross-channel performance analysis reported as meaning rather than numbers',
      'Dashboard building and a reporting cadence',
      'Proper test design — format, timing, hook and length',
      'The willingness to call a metric vanity',
    ],
    preferred: ['SQL', 'Social listening platforms', 'Competitive analysis experience'],
  },
  'Social Copywriter': {
    required: [
      'Two or more years writing social copy professionally',
      'Hooks that earn the next second without being clickbait',
      'Adapting one idea across several platforms',
      'Writing in a brand voice',
      'Writing the difficult posts — an announcement, an apology, a correction',
    ],
    preferred: ['B2B social copywriting', 'A second language', 'Some video scripting ability'],
  },
  'Campus Content Ambassador': {
    required: [
      'Currently enrolled at a college or university',
      'Comfort making and publishing your own content',
      'Honesty, including saying what you do not know',
      'Willingness to support campus events and hiring drives',
    ],
    preferred: ['An existing following on campus', 'Involvement in the placement cell or a student body'],
  },

  // ══ AI ═══════════════════════════════════════════════════════════════════════
  'AI Software Engineer': {
    required: [
      'Three or more years in software engineering with production machine learning exposure',
      'Strong Python and at least one other production language',
      'Model serving: latency budgets, batching, caching and behaviour when the model is unavailable',
      'Building an evaluation harness before tuning anything',
      'Handling messy real input — every CV format, multilingual and code-mixed text, photographed documents',
      'Designing the fallback for when the model is wrong, because it will be',
    ],
    preferred: ['LLM application experience', 'Vector databases and retrieval', 'Document processing pipelines'],
  },
  'Machine Learning Engineer': {
    required: [
      'Three or more years building and deploying machine learning models in production',
      'Strong Python, PyTorch or TensorFlow, and solid SQL',
      'Feature pipeline and training data ownership, which is where most model quality comes from',
      'Rigorous evaluation and the discipline not to tune on the held-out set',
      'Production ownership — serving, monitoring, retraining and rollback',
      'Testing for differential impact across candidate groups before shipping a ranking change',
    ],
    preferred: ['Ranking or recommendation systems', 'NLP experience', 'MLOps tooling'],
  },
  'Senior Machine Learning Engineer': {
    required: [
      'Five or more years in machine learning with production ownership',
      'Deep understanding of evaluation methodology, including fairness measurement',
      'Leading difficult modelling problems and knowing when a simpler approach wins',
      'Mentoring on both modelling and the engineering around it',
      'Accountability for production model behaviour including its failures',
    ],
    preferred: ['Large-scale ranking systems', 'Research publications', 'Experience with regulated AI use cases'],
  },
  'MLOps Engineer': {
    required: [
      'Three or more years in ML infrastructure or platform engineering',
      'Training infrastructure, experiment tracking and model registry',
      'Reproducible training including data versioning',
      'Deployment patterns: canary, shadow traffic and rollback',
      'Drift, data quality and performance monitoring',
      'GPU capacity and cost management',
    ],
    preferred: ['Kubernetes for ML workloads', 'Feature store experience', 'A specific ML platform in depth'],
  },
  'NLP Engineer': {
    required: [
      'Three or more years in natural language processing',
      'Transformer models applied to real problems, fine-tuned rather than only called',
      'Named entity recognition and information extraction',
      'Handling multilingual, code-mixed and transliterated text',
      'Working with OCR output from photographed documents',
      'Building evaluation sets per language rather than assuming English transfers',
    ],
    preferred: ['Indian language NLP', 'Resume or document parsing', 'Semantic search and embeddings'],
  },
  'Computer Vision Engineer': {
    required: [
      'Three or more years in computer vision',
      'Document image processing — detection, rectification and OCR',
      'Handling skewed, shadowed, cropped phone photographs as the normal input',
      'Model optimisation for on-device inference',
      'Evaluation across document types and regions rather than a clean benchmark',
    ],
    preferred: ['Document forgery or tampering detection', 'Identity document processing', 'Edge deployment experience'],
  },
  'Speech & Audio ML Engineer': {
    required: [
      'Three or more years in speech or audio machine learning',
      'Speech recognition model training or fine-tuning',
      'Working across Indian languages and accents where off-the-shelf recognition performs badly',
      'Handling real recording conditions — a phone, a noisy room, a poor connection',
      'Speaker diarisation for multi-party recordings',
    ],
    preferred: ['Low-resource language speech', 'Audio signal processing background', 'Real-time inference'],
  },
  'Applied AI Engineer': {
    required: [
      'Three or more years in engineering with applied AI work shipped',
      'Fast prototyping with honest evaluation',
      'Designing the interaction around a model — showing uncertainty and making correction easy',
      'Willingness to conclude an approach does not work',
    ],
    preferred: ['LLM application development', 'Product engineering background', 'Front-end ability'],
  },
  'Prompt & AI Interaction Engineer': {
    required: [
      'Two or more years working directly with large language models in a product',
      'Building evaluation sets that show whether a prompt change helped or just felt better',
      'Handling failure modes deliberately: hallucination, refusal and prompt injection from user-uploaded documents',
      'Designing what a user sees when the model is uncertain',
      'Versioning prompts like code, with review and rollback',
    ],
    preferred: ['Retrieval-augmented generation', 'Adversarial testing experience', 'A writing or linguistics background'],
  },
  'AI Research Scientist': {
    required: [
      'A PhD in machine learning or a related field, or equivalent research experience',
      'Experimental design to a standard that would survive review',
      'Strong implementation ability — research that does not stop at a paper',
      'Publications or comparable research output',
    ],
    preferred: ['Fairness in ranking research', 'Information retrieval', 'Industry research experience'],
  },
  'Research Engineer — Ranking': {
    required: [
      'Four or more years working on ranking, search or recommendation',
      'Offline evaluation: judged sets, counterfactual estimation and metrics that correlate with online outcomes',
      'Online experimentation and interpreting it without post-hoc storytelling',
      'Handling position bias and the feedback loop where a model trains on its own output',
      'Measuring differential impact of a ranking change before shipping',
    ],
    preferred: ['Learning-to-rank at scale', 'Two-sided marketplace ranking', 'Publications'],
  },
  'Responsible AI Lead': {
    required: [
      'Five or more years spanning machine learning and AI governance, ethics or policy',
      'Defining fairness metrics and thresholds that are actually implemented',
      'Running a model review process with real authority to stop a launch',
      'Working knowledge of the EU AI Act, the New York City bias-audit rule and what is coming after them',
      'Ability to train engineering and product teams so this is a design constraint rather than a gate',
    ],
    preferred: ['Independent AI audit experience', 'Legal or policy background alongside technical', 'Published work on algorithmic fairness'],
  },
  'Data Annotation Lead': {
    required: [
      'Three or more years leading annotation or data labelling operations',
      'Writing annotation guidelines, which is most of what decides quality',
      'Quality processes: inter-annotator agreement, gold sets and adjudication',
      'Team management measured on throughput and accuracy together',
      'Handling sensitive data correctly — annotators see real CVs and real documents',
    ],
    preferred: ['Annotation tooling experience', 'Multilingual annotation programmes', 'Machine learning familiarity'],
  },
  'Head of AI': {
    required: [
      'Ten or more years in machine learning with leadership of a function',
      'AI strategy — what to build, what to buy and what not to do',
      'Accountability for the fairness and safety of models influencing hiring decisions',
      'Building a team across research, engineering and responsible AI',
      'Credibility with customers, auditors and regulators',
    ],
    preferred: ['Regulated AI experience', 'Research leadership record', 'Product partnership experience'],
  },

  // ══ Trust & Safety ═══════════════════════════════════════════════════════════
  'Trust & Safety Analyst': {
    required: [
      'Two or more years in trust and safety, fraud or content moderation',
      'Investigating fake employers and fraudulent postings',
      'Employer verification and detecting re-registration after removal',
      'Consistent policy enforcement with documented reasoning',
      'Spotting the pattern behind individual reports and escalating it as a campaign',
    ],
    preferred: ['Marketplace or platform trust experience', 'SQL for investigation', 'A second language'],
  },
  'Fraud Investigator': {
    required: [
      'Four or more years in fraud investigation',
      'Following evidence across accounts, payments and infrastructure',
      'Building a case file to a standard that supports action',
      'Working with law enforcement and banking channels',
      'Feeding detection signals back to engineering',
    ],
    preferred: ['Financial crime or AML background', 'Recruitment or employment fraud specifically', 'A certification such as CFE'],
  },
  'Content Moderator': {
    required: [
      'Some experience in moderation, support or a similar review role',
      'Consistent policy application and escalating the genuinely ambiguous case',
      'Attention to detail at volume',
      'Judgement about a discriminatory, fee-charging or fake posting',
      'Willingness to use the wellbeing support that comes with this role',
    ],
    preferred: ['A second language', 'Platform moderation experience', 'Familiarity with employment advertising rules'],
  },
  'Trust & Safety Manager': {
    required: [
      'Five or more years in trust and safety with team leadership',
      'Setting enforcement policy and an escalation framework',
      'Law enforcement and regulator relationships',
      'Honest prevalence and enforcement reporting, including what is getting through',
      'Balancing enforcement against the false positive that shuts out a legitimate employer',
    ],
    preferred: ['Marketplace platform experience', 'Policy or legal background'],
  },
  'Policy Manager': {
    required: [
      'Four or more years in platform policy, legal or regulatory affairs',
      'Writing policy specific enough to be applied consistently by a moderation team',
      'Tracking the regulatory environment across several markets',
      'Handling precedent-setting cases and recording the reasoning',
      'Writing in plain language users can understand',
    ],
    preferred: ['A legal qualification', 'Employment or advertising regulation knowledge', 'Public policy experience'],
  },

  // ══ Localisation ═════════════════════════════════════════════════════════════
  'Localisation Manager': {
    required: [
      'Four or more years in localisation management',
      'Translator and vendor management, and holding quality',
      'Building a process so translation is not a bottleneck at the end of every release',
      'Terminology and glossary ownership, particularly for vocabulary with no clean equivalent',
      'Testing localised builds in context',
    ],
    preferred: ['A translation management system', 'Indian language markets', 'Some engineering literacy'],
  },
  'Linguist — Indian Languages': {
    required: [
      'Native fluency in at least one of Hindi, Odia, Tamil, Telugu, Bengali or Marathi, plus strong English',
      'Professional translation or localisation experience',
      'Localising rather than translating, particularly hiring vocabulary',
      'Glossary and style guide maintenance',
      'Reviewing machine translation and knowing when to rewrite rather than correct',
    ],
    preferred: ['More than one Indian language', 'Software or UI localisation', 'A translation qualification'],
  },
  'Localisation Engineer': {
    required: [
      'Three or more years in localisation engineering or software engineering with i18n ownership',
      'Internationalisation done properly: pluralisation, date, number and currency formatting',
      'Handling text expansion and scripts that break naive layouts',
      'Automating extraction and reintegration into CI',
      'Pseudo-localisation testing to catch layout problems before translation',
    ],
    preferred: ['ICU message format', 'Right-to-left layout experience', 'A translation management system API'],
  },

  // ══ Site Administration & Transport ══════════════════════════════════════════
  'Driver': {
    required: [
      'A valid driving licence for the class of vehicle, held for two or more years',
      'A clean driving record',
      'Daily vehicle checks — tyres, fluids, lights and brakes — before the first trip',
      'Honest trip and fuel logs',
      'Knowledge of local routes and the discipline to drive to the rules even when somebody is late',
    ],
    preferred: ['Commercial driving experience', 'Basic vehicle maintenance knowledge', 'First aid training'],
  },
  'Light Vehicle Driver — Damanjodi': {
    required: [
      'A valid light motor vehicle licence held for two or more years',
      'Experience driving hill and ghat roads, including in monsoon',
      'Daily vehicle checks and defect reporting rather than driving on',
      'Willingness to work to a shift pattern and be based in the Damanjodi area',
      'Odia and basic Hindi or English',
    ],
    preferred: ['Experience driving at an industrial site', 'Defensive driving training'],
  },
  'Bus Driver — Employee Transport': {
    required: [
      'A valid heavy passenger vehicle licence and the required badge',
      'Three or more years driving passenger vehicles',
      'Experience on ghat and hill roads in all conditions',
      'Pre-trip checks on a passenger vehicle including emergency exits and first aid kit',
      'Passenger safety discipline — seated capacity, no standing on ghat sections, no boarding while moving',
      'Reliability against a shift timetable',
    ],
    preferred: ['Employee or school transport experience', 'First aid certification'],
  },
  'Fleet Coordinator': {
    required: [
      'Two or more years coordinating a vehicle fleet',
      'Vehicle document tracking — registration, insurance, fitness, permit and pollution certificates',
      'Servicing and repair scheduling',
      'Fuel consumption monitoring and investigating the outlier',
      'Accident handling and insurance claims',
    ],
    preferred: ['GPS or telematics systems', 'Commercial vehicle knowledge'],
  },
  'Dispatch Executive': {
    required: [
      'Two or more years in dispatch or logistics coordination',
      'Documentation completeness checked before a vehicle leaves',
      'Vehicle scheduling against a dispatch plan',
      'Consignment tracking and updating the people waiting',
      'Daily dispatch reconciliation',
    ],
    preferred: ['Transport management system experience', 'Knowledge of transit documentation requirements'],
  },
  'Front Desk Executive': {
    required: [
      'One or more years in reception, front office or a customer-facing role',
      'Visitor registration, badging and security procedures',
      'Meeting room, courier and post administration',
      'Clear, professional communication',
    ],
    preferred: ['Hospitality background', 'A second language', 'Basic office software'],
  },
  'Office Assistant': {
    required: [
      'Reliability and a willingness to do what the day needs',
      'Basic literacy and numeracy',
      'Physical capability for setting up rooms and moving materials',
    ],
    preferred: ['Previous office support experience', 'Basic computer skills'],
  },
  'Administration Executive': {
    required: [
      'Two or more years in office administration',
      'Vendor, supplies and facilities coordination',
      'Travel booking and reimbursement processing',
      'Invoice handling and coordination with finance',
      'Accurate administrative records',
    ],
    preferred: ['Experience supporting multiple sites', 'Event coordination'],
  },
  'Security Supervisor': {
    required: [
      'Three or more years in security, including supervising a team',
      'Access control, visitor management and material movement control',
      'Patrol and inspection discipline, including checking that guards are doing the same',
      'Incident investigation and reporting',
      'Liaison with local police and a security agency',
    ],
    preferred: ['Ex-services or police background', 'A security qualification', 'Industrial site security'],
  },
  'Security Supervisor — Sunabeda': {
    required: [
      'Three or more years in security supervision, preferably at an industrial site',
      'Shift roster and coverage management across a site and township',
      'Incident investigation and reporting',
      'Liaison with the district police and local administration',
      'Odia and Hindi or English',
    ],
    preferred: ['Ex-services background', 'Township or residential security experience'],
  },
  'Housekeeping Supervisor': {
    required: [
      'Two or more years supervising housekeeping',
      'Schedule planning, allocation and checking the work',
      'Supplies and equipment management including safe chemical handling',
      'Hygiene standards, particularly pantry and washroom areas',
      'Waste segregation and disposal',
    ],
    preferred: ['Facility management background', 'Experience at an industrial or township site'],
  },
  'Township Facilities Supervisor': {
    required: [
      'Three or more years in facilities, estate or township management',
      'Housing allocation and maintenance coordination',
      'Water, power and common area management',
      'Resident complaint handling followed through to a fix',
      'Maintenance contractor management and work quality checking',
    ],
    preferred: ['Experience with a company township', 'Water and sanitation systems knowledge', 'Odia'],
  },

  // ══ Mine Operations ══════════════════════════════════════════════════════════
  // Statutory certificates are stated plainly and sit in `required`. Somebody without
  // the ticket cannot legally hold the post, and should know that before applying.
  'Mine Manager': {
    required: [
      'First Class Manager\'s Certificate of Competency under the Mines Act 1952, valid and current',
      'Ten or more years in mining operations with substantial supervisory experience',
      'A degree in mining engineering',
      'Willingness to accept statutory responsibility in law for the safety of everyone employed at the mine',
      'Working knowledge of the Mines Act, the Metalliferous Mines Regulations and the rules under them',
      'Experience managing to an approved mining plan and environmental clearance conditions',
      'Experience representing a mine to DGMS and the state authorities',
      'Accident investigation and statutory notification experience',
    ],
    preferred: ['Experience at a mine of comparable scale', 'Opencast and underground both', 'Experience with a DGMS inspection or enquiry'],
  },
  'Mine Manager — Bauxite': {
    required: [
      'First Class Manager\'s Certificate of Competency under the Mines Act 1952, valid and current',
      'Ten or more years in mining operations, with bauxite or comparable opencast experience',
      'A degree in mining engineering',
      'Willingness to accept statutory responsibility in law for the mine',
      'Experience running a mine that feeds a downstream plant to its requirement',
      'Working knowledge of the Mines Act and the regulations under it',
      'Willingness to be based in the Koraput region',
    ],
    preferred: ['Plateau or hill mining experience', 'Conveyor-fed operations', 'Odia'],
  },
  'Assistant Mine Manager': {
    required: [
      'Second Class Manager\'s Certificate of Competency or above, valid and current',
      'Five or more years in mining operations',
      'A degree or diploma in mining engineering',
      'Experience making and recording statutory inspections',
      'Experience directing overmen and mates on shift',
      'Willingness to take charge of the mine in the manager\'s absence',
    ],
    preferred: ['Experience working towards a First Class certificate', 'Opencast operations experience'],
  },
  'Mining Engineer': {
    required: [
      'A degree in mining engineering',
      'Three or more years at an operating mine',
      'Blast design — pattern, burden, spacing, charge and initiation sequence',
      'Bench, haul road and dump geometry design',
      'Mine planning software and reading plans and sections against survey data',
      'Production, stripping ratio and equipment productivity tracking',
      'Working knowledge of the statutory requirements and the approved mining plan',
    ],
    preferred: ['A statutory certificate held or in progress', 'Vibration and fragmentation control experience', 'Surpac, Datamine or a comparable package'],
  },
  'Mining Engineer — Bauxite': {
    required: [
      'A degree in mining engineering',
      'Three or more years at an operating opencast mine',
      'Experience with ripping and dozing operations rather than only drill-and-blast',
      'Grade control at the face against a downstream plant specification',
      'Bench and haul route planning',
      'Willingness to be based in the Koraput region',
    ],
    preferred: ['Bauxite or laterite experience', 'A statutory certificate held or in progress', 'Odia'],
  },
  'Graduate Mining Engineer': {
    required: [
      'A degree in mining engineering, recently completed',
      'Willingness to work shifts at site and learn from the face upwards',
      'Willingness to work towards statutory certification, which the company sponsors',
      'Physical fitness for site work and a clean medical',
    ],
    preferred: ['Vacation training or internship at an operating mine', 'Familiarity with mine planning software'],
  },
  'Mine Planning Engineer': {
    required: [
      'A degree in mining engineering',
      'Four or more years in mine planning',
      'Deposit modelling and extraction scheduling in planning software',
      'Pit, bench, haul road and waste dump design',
      'Monthly reconciliation of planned against actual production, explained honestly',
      'Preparing mining plan documents for statutory approval',
    ],
    preferred: ['Surpac, Datamine, Deswik or MineSched', 'Long-term strategic planning experience', 'Geotechnical familiarity'],
  },
  'Overman': {
    required: [
      'Overman\'s Certificate of Competency under the Mines Act, valid and current',
      'Five or more years underground or opencast mining experience',
      'Ability to make and record statutory inspections in the prescribed registers',
      'Experience supervising mates and working crews',
      'Willingness to stop work where it is unsafe',
      'Gas testing certificate where the operation requires it',
    ],
    preferred: ['Experience working towards a manager\'s certificate', 'Mines rescue training'],
  },
  'Mining Mate': {
    required: [
      'Mining Mate\'s Certificate of Competency, valid and current',
      'Three or more years mining experience',
      'Ability to inspect a working place before shift and record it as the regulations require',
      'Supervisory experience with working crews',
      'Judgement about face, side and roof conditions before anybody works under them',
    ],
    preferred: ['Gas testing certificate', 'First aid certification', 'Experience working towards an overman\'s certificate'],
  },
  'Mining Mate — Bauxite': {
    required: [
      'Mining Mate\'s Certificate of Competency, valid and current',
      'Three or more years opencast mining experience',
      'Supervising dozing, ripping and loading crews',
      'Bench and dump edge awareness, which is where opencast incidents happen',
      'Willingness to be based in the Koraput region',
    ],
    preferred: ['Bauxite experience', 'Odia', 'First aid certification'],
  },
  'Blaster / Shot Firer': {
    required: [
      'A valid Blaster\'s or Shot Firer\'s permit',
      'A PESO licence to handle explosives',
      'Three or more years of blasting at an operating mine',
      'Charging to a design — explosive, primer, stemming and initiation sequence',
      'Exact accounting for explosives and detonators from magazine to face and back',
      'Danger zone clearance and guarding discipline, with no shortcut ever',
      'Misfire handling under the prescribed procedure',
      'Accurate explosive register maintenance, which is a legal record',
    ],
    preferred: ['Electronic detonator experience', 'Controlled blasting near structures', 'Vibration monitoring familiarity'],
  },
  'Drill Operator': {
    required: [
      'Two or more years operating drill rigs at a mine or quarry',
      'Drilling to a marked pattern at the specified depth, angle and spacing',
      'Pre-start inspection and defect reporting before starting',
      'Bit, rod and compressor management',
      'Dust suppression use and respiratory protection discipline',
      'Accurate per-hole drilling records',
      'Safe working near a bench edge',
    ],
    preferred: ['Specific rig experience — Atlas Copco, Sandvik or comparable', 'Basic maintenance ability'],
  },
  'Excavator Operator': {
    required: [
      'Three or more years operating hydraulic excavators or shovels at a mine or large earthworks site',
      'Consistent loading to correct payload',
      'Cutting and maintaining a face and bench to profile',
      'Daily pre-start inspection and defect reporting',
      'Working area awareness — trucks, people on the ground, bench edge and loose above',
      'Daily greasing and routine machine maintenance',
    ],
    preferred: ['Large-class machine experience', 'Experience with a specific manufacturer', 'Basic mechanical knowledge'],
  },
  'Excavator Operator — Bauxite': {
    required: [
      'Three or more years operating excavators at a mine or large earthworks site',
      'Loading to payload and keeping a face to profile',
      'Working with grade control marking',
      'Pre-start checks and daily greasing',
      'Ability to work safely in monsoon conditions on a plateau',
    ],
    preferred: ['Bauxite or laterite experience', 'Odia', 'Willingness to be based in the Koraput region'],
  },
  'Dumper / Haul Truck Driver': {
    required: [
      'Two or more years driving rear-dump haul trucks at a mine',
      'Correct spotting under an excavator and taking a load without damaging the truck',
      'Tipping exactly where directed and never over an unbermed edge',
      'Pre-start inspection every shift with defect reporting',
      'Mine traffic rules — right of way, speed, separation and the blind spots of a machine this size',
      'A valid heavy vehicle licence',
    ],
    preferred: ['Large-capacity truck experience', 'Fatigue management awareness', 'Basic mechanical knowledge'],
  },
  'Dumper Driver — Bauxite': {
    required: [
      'Two or more years driving haul trucks at a mine',
      'Handling gradients and plateau haul roads, particularly in monsoon',
      'Spotting, loading and tipping to the mine traffic rules',
      'Pre-start checks and defect reporting',
      'A valid heavy vehicle licence',
    ],
    preferred: ['Hill or ghat road experience', 'Odia'],
  },
  'Tipper Driver': {
    required: [
      'A valid heavy vehicle licence held for two or more years',
      'Experience driving tippers on site and on public roads',
      'Safe loading and tipping, never on a slope or an unstable edge',
      'Daily checks and keeping vehicle documents in order',
      'Load sheeting and road rule compliance off site',
    ],
    preferred: ['Mine or quarry experience', 'Clean driving record over several years'],
  },
  'Dozer Operator': {
    required: [
      'Three or more years operating track dozers',
      'Ripping to depth and direction',
      'Dump management including building the berms that stop a truck going over an edge',
      'Safe operation on a slope, which is where dozer incidents happen',
      'Pre-start checks and daily maintenance',
    ],
    preferred: ['Large-class dozer experience', 'Haul road construction', 'GPS-guided dozing'],
  },
  'Motor Grader Operator': {
    required: [
      'Three or more years operating motor graders',
      'Cutting a haul road to correct camber and crossfall so it drains',
      'Drain, windrow and road edge maintenance',
      'Working in traffic on a live haul road with a grader\'s visibility limitations',
      'Pre-start checks and defect reporting',
    ],
    preferred: ['Mine haul road experience specifically', 'GPS-guided grading'],
  },
  'Wheel Loader Operator': {
    required: [
      'Two or more years operating wheel loaders',
      'Stockpile work, truck loading and crusher feeding',
      'Working around fixed plant and conveyors where clearances are tight',
      'Pre-start checks and daily greasing',
    ],
    preferred: ['Large-class loader experience', 'Basic mechanical knowledge'],
  },
  'Crane Operator': {
    required: [
      'A valid crane operator certification',
      'Three or more years operating cranes in an industrial environment',
      'Working strictly to the load chart and refusing a lift outside it',
      'Lift planning with a rigger — ground conditions, outriggers, radius and exclusion zone',
      'Pre-use inspection of crane, ropes and lifting gear, recorded',
    ],
    preferred: ['Mobile and crawler crane both', 'Rigging qualification', 'Plant maintenance lift experience'],
  },
  'Mine Helper': {
    required: [
      'Physical fitness for site work and a clean medical',
      'Willingness to follow safety instructions and wear the protective equipment issued, without exception',
      'Reliability and willingness to work shifts',
      'Basic literacy is useful but not essential — training is provided',
    ],
    preferred: ['Previous site or industrial work', 'An ITI qualification in any trade', 'Local residence'],
  },
  'Mine Helper — Damanjodi': {
    required: [
      'Physical fitness for site work and a clean medical',
      'Willingness to follow safety instructions and wear protective equipment without exception',
      'Reliability and willingness to work shifts',
      'Local residence in the Koraput blocks is prioritised',
    ],
    preferred: ['Previous plant or site work', 'An ITI qualification', 'Odia'],
  },
  'Pit Supervisor': {
    required: [
      'Five or more years in mining operations including supervisory experience',
      'Allocating equipment and people to a shift plan and adjusting as it goes',
      'Pit safety — traffic, edges, berms and road condition',
      'Honest production and delay reporting',
      'Proper shift handover',
    ],
    preferred: ['A statutory certificate', 'Experience with a large haul fleet', 'Fleet management system familiarity'],
  },
  'Winding Engine Driver': {
    required: [
      'Winding Engine Driver\'s Certificate under the Mines Act, valid and current',
      'A maintained medical fitness certificate, which the post requires by law',
      'Two or more years operating winding equipment',
      'Prescribed pre-shift checks on winder, brakes and safety devices, recorded',
      'Exact adherence to the signalling code, every time, with no shortcut ever',
      'Willingness to stop winding immediately on any irregularity',
    ],
    preferred: ['Experience with man-winding as well as material', 'Mechanical or electrical background'],
  },
  'Ventilation Officer': {
    required: [
      'A degree or diploma in mining engineering',
      'Three or more years in mine ventilation',
      'Gas testing certificate',
      'Taking statutory air measurements and gas readings and recording them',
      'Ventilation network planning — fans, doors, stoppings and regulators',
      'Acting on a gas reading rather than reporting it',
    ],
    preferred: ['Ventilation survey and modelling software', 'Mines rescue training', 'Underground coal experience'],
  },
  'Conveyor Maintenance Attendant': {
    required: [
      'Two or more years maintaining conveyor systems',
      'Belts, idlers, pulleys, scrapers and take-ups',
      'Belt tracking, splicing and repair',
      'Absolute lock-out and tag-out discipline — a conveyor that starts during work is fatal',
      'Keeping transfer points and walkways clear, since spillage causes both fires and injuries',
    ],
    preferred: ['Vulcanising or splicing certification', 'Mechanical fitting background'],
  },

  // ══ Survey & Geology ═════════════════════════════════════════════════════════
  'Mine Surveyor': {
    required: [
      'A survey qualification recognised for mine survey work under the applicable rules',
      'Four or more years in mine surveying',
      'Total station, level and GPS survey to the prescribed accuracy',
      'Volume measurement for monthly production reconciliation',
      'Setting out the working — pegs, lines, levels and marking',
      'Boundary verification against the lease, which is a legal obligation',
      'Producing statutory plans and sections on schedule',
    ],
    preferred: ['Drone or photogrammetric survey', 'AutoCAD and mine survey software', 'Experience with a lease boundary dispute'],
  },
  'Assistant Surveyor': {
    required: [
      'A diploma in survey, civil or mining engineering',
      'One or more years of field survey experience',
      'Total station, level and GPS operation',
      'Survey data processing and plan updating',
      'Instrument care and calibration',
    ],
    preferred: ['Mine survey experience', 'AutoCAD'],
  },
  'Geologist': {
    required: [
      'A degree in geology or applied geology',
      'Three or more years at an operating mine',
      'Face and deposit mapping',
      'Core and sample logging and interpretation',
      'Grade control — marking ore and waste boundaries operators actually dig to',
      'Reconciling grade between model, face and plant and investigating disagreement',
    ],
    preferred: ['A postgraduate qualification', 'Resource modelling software', 'Experience with the commodity we mine'],
  },
  'Senior Exploration Geologist': {
    required: [
      'A postgraduate degree in geology',
      'Seven or more years in exploration',
      'Programme planning — targeting, drilling and interpretation',
      'Resource modelling to a reportable standard',
      'Drilling contractor management and QA/QC on sampling and assay',
      'Preparing geological reports for statutory and lease purposes',
    ],
    preferred: ['Competent person or qualified person status', 'Leapfrog, Surpac or comparable modelling software', 'Structural geology depth'],
  },
  'Sampler': {
    required: [
      'Basic education and the ability to follow a sampling procedure exactly',
      'Understanding that an unrepresentative sample is worse than none because it will be believed',
      'Sample preparation — crushing, splitting and pulverising to specification',
      'Labelling, recording and dispatch so chain of custody holds',
      'Equipment cleaning discipline, since contamination destroys the result',
    ],
    preferred: ['Previous mine or laboratory experience', 'An ITI or science background'],
  },

  // ══ Mine Maintenance ═════════════════════════════════════════════════════════
  'HEMM Maintenance Engineer': {
    required: [
      'A degree or diploma in mechanical engineering',
      'Five or more years maintaining heavy earth-moving equipment',
      'Running a preventive maintenance schedule and holding it against production pressure',
      'Root cause failure analysis rather than component replacement',
      'Oil analysis and condition monitoring, acting on the trend before the breakdown',
      'Major component change and rebuild planning',
      'Availability, utilisation and MTBF accountability',
      'Spares holding management against the cost of downtime',
    ],
    preferred: ['Specific OEM experience — Caterpillar, Komatsu, BEML or Hitachi', 'Reliability-centred maintenance training', 'CMMS experience'],
  },
  'Workshop Supervisor': {
    required: [
      'Five or more years in a heavy equipment workshop including supervision',
      'Job planning and bay allocation so the critical machine is not queued behind a service',
      'Work quality sign-off before a machine returns to production',
      'Tool, equipment and workshop safety management',
      'Accurate job records and history, which is what makes failure analysis possible',
    ],
    preferred: ['A trade background', 'CMMS experience', 'Contractor management'],
  },
  'Mechanical Fitter': {
    required: [
      'An ITI or equivalent qualification in fitting',
      'Three or more years in mechanical maintenance on plant or mobile equipment',
      'Stripping, inspecting, repairing and reassembling to manual and torque specification',
      'Diagnosis from symptom and inspection rather than replacing parts until it stops',
      'Absolute lock-out and tag-out and permit discipline',
      'Alignment, bearing fitting and working to real fits and tolerances',
    ],
    preferred: ['Hydraulics knowledge', 'Welding ability', 'Mine or heavy industry experience'],
  },
  'Mechanical Fitter — Damanjodi': {
    required: [
      'An ITI or equivalent qualification in fitting',
      'Three or more years in mechanical maintenance in a process plant',
      'Pumps, agitators, filters, valves and conveying equipment',
      'Permit, lock-out and tag-out discipline on a plant handling caustic liquor at temperature',
      'Alignment, bearing fitting, gland packing and mechanical seals',
      'Willingness to support planned shutdowns and be based at Damanjodi',
    ],
    preferred: ['Refinery or chemical plant experience', 'Odia', 'Rotating equipment specialisation'],
  },
  'HEMM Fitter — Semiliguda': {
    required: [
      'An ITI or equivalent qualification in fitting or diesel mechanics',
      'Three or more years maintaining heavy earth-moving equipment',
      'Field and workshop repair including hydraulics, transmissions, final drives and undercarriage',
      'Proper diagnosis before dismantling',
      'Safe working on machines of this size — chocking, propping and never relying on hydraulic pressure to hold a raised component',
      'Willingness to be based in the Semiliguda area',
    ],
    preferred: ['Specific OEM experience', 'Odia', 'Auto electrical knowledge'],
  },
  'Diesel Mechanic': {
    required: [
      'An ITI or equivalent qualification in diesel mechanics',
      'Three or more years on heavy diesel engines',
      'Diagnosis from symptoms, fault codes and actual measurement',
      'Fuel injection, turbocharger, cooling and air system service and repair',
      'Scheduled servicing to manufacturer intervals',
    ],
    preferred: ['Engine rebuild experience', 'Electronic engine management systems', 'Generator maintenance'],
  },
  'Auto Electrician': {
    required: [
      'An ITI or equivalent qualification in auto electrical work',
      'Three or more years on mobile equipment electrical systems',
      'Diagnosis from a wiring diagram with a meter rather than by replacing components',
      'Machine control and monitoring electronics on modern HEMM',
      'Proper loom and connector repair that will not fail again',
      'Battery and charging system maintenance',
    ],
    preferred: ['Specific OEM diagnostic systems', 'Mine equipment experience', 'Some electronics background'],
  },
  'Mine Electrician': {
    required: [
      'An ITI or diploma in electrical engineering',
      'An electrical supervisory certificate of competency, or willingness to work under a holder while obtaining one',
      'Three or more years in industrial electrical maintenance',
      'Distribution, motors, starters, lighting and control',
      'Working knowledge of the electrical safety regulations applying in mines, which are stricter than general industry',
      'Statutory testing and inspection of the installation, recorded',
      'Isolate, lock out and prove dead before working, every time',
    ],
    preferred: ['HT experience', 'Mine or heavy industry background', 'VFD and drives knowledge'],
  },
  'Plant Electrician — Damanjodi': {
    required: [
      'An ITI or diploma in electrical engineering',
      'Three or more years in process plant electrical maintenance',
      'HT and LT distribution, motors, drives and control systems',
      'Variable frequency drives, starters and motor control centres',
      'Planned electrical maintenance and testing, recorded',
      'Permit and strict isolation discipline on a continuous plant',
      'Willingness to be based at Damanjodi',
    ],
    preferred: ['Refinery experience', 'Electrical supervisory certificate', 'Odia'],
  },
  'Welder': {
    required: [
      'An ITI or equivalent welding qualification',
      'Three or more years welding in an industrial or mining environment',
      'Arc, MIG and gas processes',
      'Proper joint preparation, cleaning, preheat and consumable selection',
      'Welding to a standard that holds under load on structures where failure is a safety event',
      'Hot work permit, fume extraction and fire watch discipline',
    ],
    preferred: ['A welder qualification test to a recognised standard', 'Hardfacing and wear plate repair', 'Fabrication and drawing reading'],
  },
  'Welder — Damanjodi': {
    required: [
      'An ITI or equivalent welding qualification',
      'Three or more years welding on process plant — pipework, tanks and structures',
      'Hot work permit discipline on a live plant, with fire watch and gas testing',
      'Welding on stainless and lined sections that will not tolerate the wrong technique',
      'Working to a specified welding procedure',
      'Willingness to support shutdowns and be based at Damanjodi',
    ],
    preferred: ['TIG capability', 'A qualification test to ASME or an equivalent standard', 'Odia'],
  },
  'Hydraulic Technician': {
    required: [
      'An ITI or equivalent qualification in a relevant trade',
      'Three or more years on hydraulic systems in heavy equipment or plant',
      'Diagnosis from pressure and flow measurement rather than symptom alone',
      'Cylinder, pump, motor and valve repair and testing',
      'Oil cleanliness management, which is what actually decides component life',
      'Safe working with stored energy and high pressure — never searching for a leak by hand',
    ],
    preferred: ['Manufacturer hydraulic training', 'Hydrostatic transmission experience'],
  },
  'Tyre Technician': {
    required: [
      'Two or more years handling earthmover tyres',
      'Safe working with split rims and the stored energy that can kill and has',
      'Using the cage, correct procedure and remote inflation gear every time',
      'Pressure, wear and damage monitoring, and taking a tyre off before it fails on a haul road',
      'Tyre life and cost tracking, and managing rotation',
    ],
    preferred: ['OTR tyre training from a manufacturer', 'Mine site experience'],
  },
  'Instrumentation Technician': {
    required: [
      'An ITI or diploma in instrumentation',
      'Three or more years in industrial instrumentation',
      'Calibration to traceable standards with records maintained',
      'Control system field devices, transmitters and final control elements',
      'Loop checking and fault finding from drawings',
      'Permit and intrinsic safety discipline in classified areas',
    ],
    preferred: ['DCS or PLC familiarity', 'Analyser maintenance', 'Process plant experience'],
  },
  'Instrumentation Technician — Damanjodi': {
    required: [
      'An ITI or diploma in instrumentation',
      'Three or more years in process plant instrumentation',
      'Flow, level, density and temperature measurement in a continuous process',
      'Calibration to traceable standards with audit-ready records',
      'Loop fault-finding from drawings on a plant that cannot simply be stopped',
      'Willingness to be based at Damanjodi',
    ],
    preferred: ['Refinery experience', 'Analyser maintenance', 'Odia'],
  },
  'Maintenance Engineer — Refinery': {
    required: [
      'A degree or diploma in mechanical engineering',
      'Five or more years maintaining process plant equipment',
      'Pumps, agitators, heat exchangers, filters and material handling',
      'Preventive maintenance programme ownership on a continuous plant',
      'Annual shutdown planning and execution',
      'Failure analysis and reliability improvement rather than repeated repair',
      'Contractor management including their safety',
    ],
    preferred: ['Alumina refinery or chemical plant experience', 'Rotating equipment specialisation', 'CMMS experience'],
  },

  // ══ Processing & Refining ════════════════════════════════════════════════════
  'Plant Manager — Beneficiation': {
    required: [
      'A degree in mineral processing, metallurgy or chemical engineering',
      'Eight or more years in mineral processing including plant management',
      'Recovery and product quality accountability against specification',
      'Plant availability management and the maintenance relationship behind it',
      'Tailings and water circuit management and its compliance obligations',
      'Leading a plant team across shifts',
    ],
    preferred: ['Experience with the commodity we process', 'Plant commissioning experience', 'Statutory certification'],
  },
  'Mineral Processing Engineer': {
    required: [
      'A degree in mineral processing, metallurgy or chemical engineering',
      'Three or more years in an operating plant',
      'Circuit optimisation across crushing, screening, grinding, separation and dewatering',
      'Metallurgical accounting and mass balancing a circuit',
      'Designing and evaluating plant trials against a proper baseline',
      'Troubleshooting from data as well as from the plant floor',
    ],
    preferred: ['Process simulation software', 'Comminution expertise', 'Laboratory test work experience'],
  },
  'Process Engineer — Alumina': {
    required: [
      'A degree in chemical or metallurgical engineering',
      'Three or more years in an alumina refinery or comparable process plant',
      'Bayer process knowledge — digestion, clarification, precipitation or calcination',
      'Liquor circuit control: caustic concentration, alumina-to-caustic ratio, temperature and residence time',
      'Yield and energy optimisation',
      'Managing scaling and its effect on heat transfer',
      'Process upset investigation to a cause',
    ],
    preferred: ['Specific Bayer circuit section depth', 'Process simulation', 'Willingness to be based at Damanjodi'],
  },
  'Refinery Shift Engineer': {
    required: [
      'A degree or diploma in chemical, mechanical or metallurgical engineering',
      'Three or more years in a continuous process plant',
      'Taking charge of a plant on shift and running it to process parameters',
      'Responding to upsets and equipment trips and making shift decisions',
      'Proper shift handover, since a continuous plant is handed over rather than stopped',
      'Permit system ownership on shift',
      'Willingness to work a rotating shift pattern',
    ],
    preferred: ['Alumina refinery experience', 'DCS operation', 'Emergency response training'],
  },
  'Refinery Process Operator': {
    required: [
      'An ITI, diploma or equivalent technical qualification',
      'Two or more years operating a continuous process plant',
      'Control room and field operation',
      'Field rounds — checking equipment, taking readings and finding the developing problem before the instrument does',
      'Start-up, shutdown and upset handling to procedure',
      'Safe working with caustic liquor at temperature and pressure, in the protective equipment required, every time',
      'Preparing equipment for maintenance: isolate, drain, flush and hand over under permit',
    ],
    preferred: ['Alumina or chemical plant experience', 'DCS familiarity', 'Odia for the Damanjodi site'],
  },
  'Metallurgist': {
    required: [
      'A degree in metallurgy or mineral processing',
      'Three or more years in metallurgical test work or plant metallurgy',
      'Metallurgical accounting and reconciliation',
      'Designing and evaluating test programmes supporting process changes',
      'Ore characterisation and understanding feed variability',
      'Recommending only what the data supports',
    ],
    preferred: ['A postgraduate qualification', 'Laboratory management experience', 'Specific commodity expertise'],
  },
  'Plant Operator': {
    required: [
      'An ITI or equivalent technical qualification',
      'One or more years operating industrial plant',
      'Starting, running, monitoring and stopping to procedure',
      'Reporting the abnormal rather than working around it',
      'Field rounds, readings and routine adjustments',
      'Preparing equipment for maintenance and receiving it back',
    ],
    preferred: ['Mineral processing experience', 'Control room experience'],
  },
  'Crusher Operator': {
    required: [
      'Two or more years operating crushing plant',
      'Managing feed to keep a crusher choke-fed rather than starved',
      'Clearing blockages and bridging safely, never from inside the chamber without full isolation',
      'Liner wear monitoring and reporting before product is affected',
      'Keeping transfer points and conveyors clear of spillage',
    ],
    preferred: ['Jaw, cone and impact crusher experience', 'Basic mechanical ability'],
  },
  'Conveyor Attendant': {
    required: [
      'Physical fitness and willingness to patrol a conveyor system on shift',
      'Watching for belt tracking, spillage and the hot idler that starts a fire',
      'Clearing spillage and keeping walkways and transfer points clear',
      'Reporting belt damage, misalignment and worn components before failure',
      'Correct use of pull-cords and interlocks, and never working near an unisolated conveyor',
    ],
    preferred: ['Previous plant experience', 'Basic mechanical knowledge'],
  },
  'Boiler Operator': {
    required: [
      'A valid Boiler Attendant Certificate under the applicable Boiler Rules',
      'Three or more years operating boilers',
      'Water level, pressure, combustion and feedwater control',
      'Boiler water chemistry management with the laboratory',
      'Statutory checks on safety devices, recorded',
      'Start-up, shutdown and emergency procedures',
    ],
    preferred: ['High-pressure boiler experience', 'A first class certificate'],
  },
  'Calcination Plant Supervisor': {
    required: [
      'A diploma or degree in chemical, mechanical or metallurgical engineering',
      'Four or more years in calcination, kiln or high-temperature process operations',
      'Fuel, temperature profile and residence time control to product specification',
      'Product quality management — loss on ignition, surface area and particle size',
      'Refractory condition management and planning for its repair',
      'Shift crew supervision and proper handover',
    ],
    preferred: ['Alumina calcination specifically', 'Rotary kiln or fluid bed calciner experience'],
  },
  'Laboratory Chemist / Assayer': {
    required: [
      'A degree in chemistry or a related science',
      'Two or more years in an analytical or assay laboratory',
      'Standard analytical methods for ore and product',
      'Quality control regime — standards, blanks, duplicates and control charts',
      'Instrument maintenance and calibration',
      'Reporting with proper traceability, since these are commercially and statutorily significant numbers',
    ],
    preferred: ['XRF, AAS or ICP experience', 'NABL or ISO 17025 laboratory experience', 'Fire assay'],
  },
  'Refinery Laboratory Chemist': {
    required: [
      'A degree in chemistry or chemical engineering',
      'Two or more years in a process plant laboratory',
      'Analysis of process liquor and solids — caustic, alumina, ratio, impurities and organics',
      'Fast turnaround so the shift can act on a result',
      'Product analysis to specification for despatch',
      'Quality control regime and instrument calibration',
    ],
    preferred: ['Bayer process liquor analysis specifically', 'ISO 17025 experience', 'Odia'],
  },
  'Laboratory Technician': {
    required: [
      'A diploma or degree in a science subject',
      'Sample preparation and routine analysis to procedure',
      'Laboratory equipment operation and maintenance',
      'Accurate recording and flagging results outside the expected range',
      'Chemical safety including correct handling and disposal',
    ],
    preferred: ['Mineral or process laboratory experience', 'Instrument experience'],
  },
  'Quality Control Inspector': {
    required: [
      'A diploma or degree in a technical subject',
      'Two or more years in quality inspection',
      'Inspection and testing against specification before dispatch',
      'Sampling and quality verification at loading and dispatch points',
      'Documenting results and holding non-conforming product',
      'Investigating customer complaints to a real cause',
    ],
    preferred: ['Experience with certificates of analysis', 'ISO 9001 familiarity', 'Mineral product knowledge'],
  },

  // ══ Mine Safety, Health & Environment ════════════════════════════════════════
  'Safety Officer (Mines)': {
    required: [
      'The qualification prescribed for a Safety Officer under the Mines Rules — a degree or diploma in mining or engineering with the required safety qualification',
      'Five or more years in mining, with safety responsibility',
      'Making and recording the prescribed inspections in the statutory registers',
      'Willingness to exercise the authority to stop unsafe work on a production day',
      'Accident and dangerous occurrence investigation to a real cause',
      'Statutory notification and returns to DGMS within the prescribed time',
      'Risk assessment kept current rather than annual',
      'Delivering statutory safety training',
    ],
    preferred: ['Mines rescue training', 'A formal safety qualification such as NEBOSH', 'Experience with a DGMS enquiry'],
  },
  'Safety Officer — Damanjodi': {
    required: [
      'The prescribed safety officer qualification, with a degree or diploma in engineering',
      'Five or more years in safety at a process plant or mine',
      'Refinery hazards — caustic liquor at temperature, confined space, work at height, hot work and the red mud area',
      'Permit-to-work system ownership and auditing that it is followed rather than signed',
      'Incident investigation and action close-out',
      'Safety training and induction delivery in Odia as well as English',
      'Willingness to exercise the authority to stop unsafe work',
    ],
    preferred: ['Alumina refinery experience', 'NEBOSH or equivalent', 'Emergency response leadership'],
  },
  'Safety Supervisor': {
    required: [
      'A diploma in engineering or a recognised safety qualification',
      'Three or more years in a safety role at an industrial or mine site',
      'Area inspection with on-the-spot correction',
      'Toolbox talks and checking permits match the work being done',
      'Protective equipment issue, use and condition checking',
      'Incident and near miss reporting and investigation',
      'Willingness to stop unsafe work',
    ],
    preferred: ['Mines safety experience', 'First aid certification', 'Mines rescue training'],
  },
  'Mines Rescue Trained Person': {
    required: [
      'Rescue training and the medical fitness the role requires by law, maintained',
      'A substantive trade or operating role held alongside rescue membership',
      'Physical fitness for work in breathing apparatus',
      'Commitment to regular rescue training and practice to keep the ticket current',
      'Willingness to respond to emergencies at the mine',
    ],
    preferred: ['Existing rescue certification', 'First aid or paramedic training', 'Underground experience'],
  },
  'Fire & Emergency Officer': {
    required: [
      'A fire and safety qualification',
      'Four or more years in fire safety or emergency response at an industrial site',
      'Fire detection, suppression and hydrant system maintenance and testing',
      'Emergency planning for the emergencies this site can actually have',
      'Running drills that test the plan rather than perform it, and reporting honestly on failures',
      'Leading an emergency response team',
      'Coordinating with the district fire service and mutual aid arrangements',
    ],
    preferred: ['Industrial firefighting experience', 'Ex-services or fire service background', 'Hazmat response training'],
  },
  'Environment Officer': {
    required: [
      'A degree in environmental science or engineering',
      'Three or more years in environmental compliance at an industrial or mine site',
      'Monitoring programmes for air, water, noise and groundwater',
      'Statutory environmental returns and compliance reports filed on time',
      'Waste and effluent management to consent conditions',
      'Plantation and reclamation programmes, which are obligations rather than gestures',
      'Handling pollution control board inspections',
    ],
    preferred: ['Mining sector environmental experience', 'EIA or clearance process familiarity', 'ISO 14001'],
  },
  'Environment Officer — Koraput': {
    required: [
      'A degree in environmental science or engineering',
      'Three or more years in environmental compliance at a mine or process plant',
      'Monitoring across air, water, noise and groundwater in a catchment communities depend on',
      'Red mud and effluent compliance obligations',
      'Plantation and reclamation programme delivery',
      'Statutory returns and pollution control board inspections',
      'Willingness to be based in the Koraput region',
    ],
    preferred: ['Alumina refinery environmental experience', 'Odia', 'Community consultation experience'],
  },
  'Red Mud & Tailings Supervisor': {
    required: [
      'A diploma or degree in civil, mining or environmental engineering',
      'Three or more years at a tailings or residue disposal facility',
      'Monitoring freeboard, seepage, phreatic surface and instrumentation',
      'Managing deposition to plan so the facility stays stable',
      'Daily and weekly inspections recorded as the management plan requires',
      'Reporting any deviation immediately rather than at the end of shift',
    ],
    preferred: ['Tailings management certification or training', 'Geotechnical background', 'Experience supporting an independent tailings review'],
  },
  'Occupational Health Nurse': {
    required: [
      'A nursing qualification and current registration',
      'Three or more years in occupational health or a clinical role',
      'Periodic medical examinations as required for mine workers',
      'Health surveillance including audiometry and respiratory screening',
      'First line treatment and medical centre management',
      'Confidential medical record keeping to the standard the regulations require',
    ],
    preferred: ['An occupational health qualification', 'Industrial or mining experience', 'Emergency care training'],
  },
  'Occupational Health Nurse — Damanjodi': {
    required: [
      'A nursing qualification and current registration',
      'Three or more years in occupational health or a clinical role',
      'Statutory periodic medical examinations for mine and plant workers',
      'Health surveillance for refinery exposures — caustic, dust, noise and heat',
      'First line treatment and medical centre management',
      'Odia as well as English',
    ],
    preferred: ['An occupational health qualification', 'Process plant experience', 'Emergency care training'],
  },
  'First Aid Attendant': {
    required: [
      'A recognised first aid certification, current',
      'Willingness to be stationed at the working places on shift',
      'First aid box, stretcher point and emergency equipment maintenance',
      'Injury response and arranging onward transport',
      'Accurate treatment records, since they are the first record in any investigation',
    ],
    preferred: ['Previous industrial or mine site experience', 'Emergency medical technician training', 'Mines rescue training'],
  },

  // ══ Mine Administration ══════════════════════════════════════════════════════
  'Mine Store Keeper': {
    required: [
      'Two or more years in stores or inventory management, preferably industrial',
      'Receipt, inspection, storage, issue and return processes',
      'Accurate stock records — a spare the system says exists and does not is a machine down',
      'Critical spares management with level breach escalation',
      'Cycle counting and investigating discrepancies rather than adjusting them',
      'Correct storage: shelf life, segregation and conditions each item needs',
    ],
    preferred: ['ERP or inventory system experience', 'HEMM spares knowledge'],
  },
  'Store Keeper — Damanjodi': {
    required: [
      'Two or more years in industrial stores',
      'Receipt, storage, issue and reconciliation',
      'Critical spares and shutdown material staging',
      'Chemical handling with correct segregation and storage',
      'Accurate records supporting site accounts on consumption and valuation',
      'Willingness to be based at Damanjodi',
    ],
    preferred: ['Process plant stores experience', 'ERP experience', 'Odia'],
  },
  'Explosive Magazine In-charge': {
    required: [
      'A licence or authorisation to hold charge of an explosive magazine under the Explosives Act',
      'Three or more years handling explosives at a mine',
      'Exact accounting for every explosive and detonator received, issued and returned',
      'Correct and separate storage of explosives and detonators to the licence and rules',
      'Magazine security, with immediate reporting of any discrepancy',
      'Issuing only to permitted persons against authorisation, recorded',
      'Handling inspections by the explosives authority',
    ],
    preferred: ['A blaster\'s permit', 'Experience with a licence renewal or magazine inspection'],
  },
  'Weighbridge Operator': {
    required: [
      'Basic education with good numeracy and accurate data entry',
      'One or more years operating a weighbridge or in a comparable control role',
      'Weighment slip generation, since dispatch, invoicing and royalty computation depend on it',
      'Verifying vehicle and consignment details against documentation before release',
      'Calibration awareness and immediate reporting of any suspected error',
      'Integrity — this is a control point exposed to manipulation, not a data entry job',
    ],
    preferred: ['Mine or plant weighbridge experience', 'Familiarity with transit documentation'],
  },
  'Weighbridge Operator — Semiliguda': {
    required: [
      'Basic education with good numeracy and accurate data entry',
      'One or more years operating a weighbridge or in a comparable control role',
      'Accurate weighment recording and slip issue',
      'Verifying vehicle, consignment and documentation before release',
      'Calibration records and error reporting',
      'Odia and basic Hindi or English',
    ],
    preferred: ['Mine or plant experience', 'Local residence'],
  },
  'Dispatch Supervisor': {
    required: [
      'Three or more years in dispatch at a mine, plant or industrial site',
      'Loading, weighment, documentation and release supervision',
      'Ensuring statutory transit permits accompany every consignment',
      'Vehicle queue and loading coordination',
      'Daily reconciliation of dispatch against production and stock',
      'Integrity and willingness to prevent and report malpractice',
    ],
    preferred: ['Mineral dispatch experience', 'Knowledge of e-way bill and transit permit requirements'],
  },
  'Dispatch Supervisor — Jeypore': {
    required: [
      'Three or more years in dispatch operations',
      'Documentation and statutory transit permit compliance',
      'Loading, weighment and vehicle movement coordination',
      'Daily dispatch reconciliation and reporting',
      'Odia and Hindi or English',
    ],
    preferred: ['Mineral dispatch experience', 'Local knowledge of the Jeypore area'],
  },
  'Fuel Station Attendant': {
    required: [
      'Basic education with good numeracy',
      'Accurate recording of every fuel issue against the machine',
      'Daily reconciliation of fuel issued against stock, investigating differences rather than writing them off',
      'Dispensing equipment and storage tank maintenance',
      'Fuel safety — no smoking, bonding and earthing, and spill containment',
      'Integrity and willingness to report suspected pilferage',
    ],
    preferred: ['Previous fuel handling experience', 'Basic mechanical knowledge'],
  },
  'Time Office Clerk': {
    required: [
      'Basic education with strong numeracy and accurate record keeping',
      'One or more years in a time office, HR administration or payroll support role',
      'Attendance and shift record maintenance, which is what payroll is built from',
      'Statutory register maintenance under the Mines Act — employment, attendance, leave and wages',
      'Handling leave records and worker queries',
    ],
    preferred: ['Mine or factory time office experience', 'Familiarity with attendance systems', 'Local language'],
  },
  'Mine Security Guard': {
    required: [
      'Physical fitness and a clean record',
      'Access control and checking persons, vehicles and materials in and out',
      'Site patrolling including stores, fuel point and magazine areas',
      'Accurate security and gate registers',
      'Prompt incident and unauthorised access reporting',
    ],
    preferred: ['Ex-services background', 'Security training or licensing', 'Local residence'],
  },
  'Mine Canteen Supervisor': {
    required: [
      'Two or more years supervising a canteen or catering operation',
      'Menu planning and provisions management including storage',
      'Staff management and hygiene practice',
      'Statutory canteen obligations under the Mines Act',
      'Canteen accounts and subsidy management',
    ],
    preferred: ['A food safety certification', 'Industrial canteen experience'],
  },
  'Community Relations Officer': {
    required: [
      'A degree in social work, sociology, rural development or a related field',
      'Three or more years in community relations, CSR or rural development',
      'Handling grievances honestly and following them through, including when the answer is no',
      'Community development programme delivery and honest reporting on it',
      'Supporting public hearing and consultation obligations',
      'Fluency in the local language',
    ],
    preferred: ['Mining or extractive sector experience', 'Land and rehabilitation exposure', 'Panchayat and district administration relationships'],
  },
  'Community Relations Officer — Koraput': {
    required: [
      'A degree in social work, sociology, rural development or a related field',
      'Three or more years in community relations in a rural or tribal area',
      'Fluency in Odia and familiarity with the local languages of the surrounding blocks',
      'Handling land, employment and environmental grievances',
      'Understanding of the consultation and consent obligations in a scheduled area, which are stronger than elsewhere',
      'Working with Panchayat institutions and the district administration',
    ],
    preferred: ['Experience in a scheduled area', 'Extractive sector experience', 'Knowledge of PESA and the Forest Rights Act'],
  },
  'CSR & Skilling Coordinator': {
    required: [
      'A degree in social work, rural development, education or a related field',
      'Three or more years in skilling, CSR or livelihoods programmes',
      'Coordinating with ITIs, polytechnics and skilling partners on curriculum and delivery',
      'Honest outcome tracking — trained, certified and actually employed are three different numbers',
      'CSR budget management and statutory reporting',
      'Local language fluency',
    ],
    preferred: ['NSDC or sector skill council familiarity', 'Placement linkage experience', 'Mining sector CSR'],
  },
  'Land & Liaison Officer': {
    required: [
      'A degree, preferably in law, revenue administration or a related field',
      'Four or more years handling land matters for an industrial or mining operation',
      'Land records, acquisition, rights and dispute handling',
      'Liaison with revenue authorities, district administration and statutory bodies',
      'Lease and land documentation maintenance',
      'Local language fluency',
    ],
    preferred: ['Mining lease experience', 'Rehabilitation and resettlement experience', 'A legal qualification'],
  },
  'Mine HR Officer': {
    required: [
      'A degree or postgraduate qualification in HR or social work',
      'Three or more years in HR at a site, plant or mine',
      'Statutory registers and returns under the Mines Act and the labour laws',
      'Contractor labour compliance, which is where site operations most often get into trouble',
      'Industrial relations and union relationships',
      'Supporting training, statutory certification and medical examination programmes',
      'Local language fluency',
    ],
    preferred: ['Mining sector HR experience', 'Experience with a labour inspection', 'IR case handling'],
  },
  'Site HR Officer — Koraput': {
    required: [
      'A degree or postgraduate qualification in HR or social work',
      'Three or more years in site HR',
      'Statutory registers, returns and contractor labour compliance',
      'Supporting local recruitment from the surrounding blocks, which is a priority here',
      'Employee relations handling',
      'Odia as well as English',
    ],
    preferred: ['Mining or process plant HR', 'Township administration exposure'],
  },
  'Mining Statutory Compliance Officer': {
    required: [
      'A degree in mining engineering, law or a related field',
      'Five or more years in mining compliance or operations with statutory responsibility',
      'Working knowledge of the Mines Act, the regulations, the rules and lease conditions',
      'Statutory registers, returns and notifications filed accurately and on time',
      'Tracking obligations attached to every clearance, consent and permission held',
      'Managing inspections by DGMS, the IBM and state authorities',
      'Following up observations until they are actually closed',
    ],
    preferred: ['A statutory certificate of competency', 'Experience with a lease renewal', 'Legal qualification'],
  },

  // ══ Trade Finance & Insurance ════════════════════════════════════════════════
  'Trade Credit Insurance Manager': {
    required: [
      'Five or more years in trade credit insurance, at an insurer, a broker or in industry',
      'Placing and negotiating policies, including the terms that decide whether a claim actually pays',
      'Credit limit applications and discretionary limit management',
      'Portfolio monitoring and reducing exposure while it is still reducible',
      'Claims notification to policy conditions, which are unforgiving about timing',
      'Advising commercial teams on insurability before a deal is agreed',
    ],
    preferred: ['Relationships with the major credit insurers', 'Emerging market buyer risk', 'A credit or insurance qualification'],
  },
  'Marine Cargo Insurance Specialist': {
    required: [
      'Four or more years in marine cargo insurance',
      'Open covers and shipment declaration',
      'Institute Cargo Clauses A, B and C, war and strikes cover, and the warranties that void a claim if breached',
      'Insurable interest and the correct assured, particularly where the Incoterm decides who bears risk at which point',
      'Claims from notification through survey to settlement',
      'Loss prevention advice on packing and stowage',
    ],
    preferred: ['An insurance qualification such as ACII', 'Bulk commodity cargo experience', 'Surveyor relationships'],
  },
  'Trade Finance Manager': {
    required: [
      'Five or more years in trade finance, at a bank or in a trading business',
      'Letters of credit, documentary collections, guarantees and standby credits',
      'Structuring financing so neither side carries the whole risk',
      'Banking relationship and facility management',
      'UCP 600 documentary compliance',
      'Working capital management across the trade cycle',
      'Sanctions and compliance screening on every transaction, without exception',
    ],
    preferred: ['A CDCS qualification', 'Commodity trade finance', 'Multi-corridor experience'],
  },
  'Trade Finance Manager — MENA': {
    required: [
      'Five or more years in trade finance with MENA corridor experience',
      'Regional bank relationships for facilities, letters of credit and guarantees',
      'Regional documentary and regulatory requirements',
      'Rigorous sanctions screening, which in this corridor is the highest-consequence control',
      'UAE work eligibility',
    ],
    preferred: ['Islamic trade finance structures', 'Arabic', 'CDCS qualification'],
  },
  'Letters of Credit Specialist': {
    required: [
      'Three or more years examining documents under letters of credit',
      'UCP 600 applied in practice, finding discrepancies before the bank does',
      'Preparing and checking full document sets so they present clean',
      'Getting credit terms workable before issuance rather than amending later',
      'Presentation deadline and expiry tracking',
      'Resolving discrepancies with banks and counterparties to get payment released',
    ],
    preferred: ['CDCS certification', 'ISBP familiarity', 'Bank trade services background'],
  },
  'Trade Credit Underwriter': {
    required: [
      'Four or more years underwriting credit or analysing counterparty risk',
      'Financial statement analysis, payment behaviour and country risk assessment',
      'Working with incomplete information, which is normal for a private buyer in an emerging market',
      'Portfolio monitoring and reducing exposure on deterioration',
      'Willingness to say no to a deal the commercial team wants, with a reason that holds',
      'Documenting decisions well enough to be reviewed later',
    ],
    preferred: ['Credit insurance underwriting specifically', 'Emerging market exposure', 'A credit qualification'],
  },
  'Trade Credit Underwriter — APAC': {
    required: [
      'Four or more years in credit underwriting or counterparty risk',
      'Assessing counterparties across markets with very different disclosure standards and legal enforceability',
      'Country and sector risk monitoring across the region',
      'Independence from the commercial teams you work with',
    ],
    preferred: ['A regional language', 'Trade credit insurance background', 'Singapore or Hong Kong market experience'],
  },
  'Cargo Claims Manager': {
    required: [
      'Four or more years handling cargo claims',
      'Notification, survey, quantification and recovery',
      'Appointing and instructing surveyors so evidence is gathered before it disappears',
      'Preserving recovery rights within the time bars under the Hague-Visby Rules and equivalent conventions',
      'Negotiating settlement with underwriters and pursuing recovery from the party at fault',
      'Claims pattern analysis feeding loss prevention',
    ],
    preferred: ['A legal or insurance qualification', 'Marine surveying background', 'Bulk and containerised both'],
  },
  'Counterparty Risk Analyst': {
    required: [
      'Three or more years in credit or counterparty risk analysis',
      'Risk model building and scoring behind limit decisions',
      'Exposure monitoring with immediate escalation of a breach',
      'Country, sector and currency risk tracking',
      'Risk reporting leadership actually uses to set appetite',
    ],
    preferred: ['Strong quantitative and modelling skills', 'A risk qualification such as FRM', 'Trade or commodity exposure'],
  },

  // ══ Payments ═════════════════════════════════════════════════════════════════
  'Payment Gateway Engineer': {
    required: [
      'Three or more years building payment systems in production',
      'Authorisation, capture, refund and void flows and the state machine underneath them',
      'Acquirer and PSP integration, against providers that behave differently from their documentation',
      'Idempotency on every path — a retry must never become a double charge',
      '3-D Secure and the strong customer authentication requirements of each market',
      'Tokenisation and vaulting to keep card data out of scope',
      'Webhook and asynchronous notification handling, with ordering and replay',
    ],
    preferred: ['PCI DSS scope experience', 'Multiple acquirer integrations', 'Ledger or double-entry systems'],
  },
  'Senior Payments Engineer — Cross-Border': {
    required: [
      'Five or more years in payments engineering with cross-border experience',
      'Correspondent banking and local payment rails',
      'Multi-currency handling: FX at the point of quote, rate expiry, and who bears the movement',
      'Cut-off times and value dates and what they mean for settlement',
      'Sanctions and AML screening on every leg, with false-positive handling that does not block the business',
      'Reconciliation across corridors where money moves through several parties',
      'Regulatory reporting per corridor',
    ],
    preferred: ['SWIFT messaging', 'ISO 20022', 'Licensing and regulatory experience in a payments business'],
  },
  'Payments Engineer — APAC': {
    required: [
      'Three or more years in payments engineering',
      'Local payment method integration for APAC markets, where cards are not the primary rail',
      'Regulatory requirements per jurisdiction including data and licensing constraints',
      'Reconciliation and settlement for regional corridors',
    ],
    preferred: ['UPI, PayNow, GrabPay or comparable local rails', 'A regional language', 'Cross-border settlement experience'],
  },
  'Payments Integration Specialist': {
    required: [
      'Three or more years integrating payment providers',
      'Reading a specification and then discovering how the provider actually behaves',
      'Provider certification processes before going live',
      'Migrating between providers without dropping in-flight transactions',
      'Documentation good enough that the next person can support it',
    ],
    preferred: ['Multiple provider integrations', 'API design experience', 'Payments domain depth'],
  },
  'Settlement & Reconciliation Engineer': {
    required: [
      'Three or more years building reconciliation or financial systems',
      'Reconciling an acquirer settlement file against transaction records and breaking down the difference before cut-off',
      'The awkward cases: partial settlement, fees deducted at source, chargebacks, reversals and weekend timing differences',
      'Double-entry ledger design that balances by construction rather than by correction',
      'Automated matching so only genuine exceptions reach a person',
      'Investigating a break to its cause, because it is either a bug or somebody\'s money',
    ],
    preferred: ['Accounting knowledge', 'High-volume transaction reconciliation', 'Financial reporting integration'],
  },
  'PCI DSS Compliance Lead': {
    required: [
      'Five or more years in payment security or compliance',
      'PCI DSS programme ownership including scope definition and defence',
      'Working with a QSA through an annual assessment and quarterly scanning',
      'Control implementation and evidence — segmentation, key management, logging and access control',
      'Advising engineering on architecture that keeps card data out of scope',
      'Service provider compliance management',
    ],
    preferred: ['PCI ISA or QSA qualification', 'Cloud payment architecture', 'Broader security compliance experience'],
  },
  'Fraud & Chargeback Analyst': {
    required: [
      'Three or more years in payment fraud or chargeback management',
      'Fraud rule tuning against the real trade-off — every rule that stops fraud also declines legitimate customers',
      'Chargeback representment with real evidence, and accepting the ones not worth defending',
      'Tracking fraud and chargeback ratios against card scheme thresholds',
      'Fraud pattern investigation feeding back into detection',
    ],
    preferred: ['A fraud platform in depth', 'SQL for investigation', 'Machine learning familiarity'],
  },
  'Escrow Operations Manager': {
    required: [
      'Four or more years in escrow, payments operations or a comparable fiduciary role',
      'Release condition management and verifying they have actually been met',
      'Impartial dispute handling on evidence, defensible to both sides',
      'Client fund segregation and the reconciliation that proves it',
      'Regulatory requirements for holding funds on behalf of others',
    ],
    preferred: ['Marketplace or trade escrow experience', 'A compliance or legal background'],
  },
  'Payments Product Manager': {
    required: [
      'Four or more years in product management with payments domain depth',
      'Deciding which payment methods and markets to support next, on evidence',
      'Ownership of authorisation rates and cost per transaction',
      'Working with compliance and legal on licensing and regulatory position',
      'Making the fraud-versus-conversion trade-off explicitly',
    ],
    preferred: ['Cross-border payments', 'Marketplace payments including split settlement', 'Technical background'],
  },

  // ══ Shipping, Freight & Customs ══════════════════════════════════════════════
  'Freight Forwarding Manager': {
    required: [
      'Six or more years in freight forwarding including team management',
      'Carrier rate negotiation, contracts and allocation management',
      'Routing decisions balancing cost, transit time and reliability',
      'Landed cost ownership and quote accuracy',
      'Handling escalations: a rolled container, a vessel omission, a customs hold',
      'Sea, air and road across the modes',
    ],
    preferred: ['Multi-country operations', 'A freight forwarding qualification', 'Project or breakbulk cargo'],
  },
  'Freight Forwarding Manager — Jebel Ali': {
    required: [
      'Six or more years in freight forwarding with MENA experience',
      'Jebel Ali free zone regime and its documentation requirements',
      'Regional carrier and agent relationships',
      'Transhipment and re-export flows',
      'UAE work eligibility',
    ],
    preferred: ['Arabic', 'Bonded warehouse experience', 'Regional trade lane depth'],
  },
  'Ocean Freight Operations Executive': {
    required: [
      'Two or more years in ocean freight operations',
      'Booking and managing shipments end to end',
      'Working to the cut-offs that govern a shipment — gate-in, documentation, VGM and sailing',
      'Bill of lading preparation and checking, where a wrong container number stops a consignment at the gate',
      'Telling a customer the truth about where a shipment is',
      'Detention and demurrage management, acted on before it accrues',
    ],
    preferred: ['A freight forwarding qualification', 'Specific trade lane knowledge', 'A transport management system'],
  },
  'Air Freight Coordinator': {
    required: [
      'Two or more years in air freight',
      'Air waybill preparation and accompanying documentation',
      'IATA dangerous goods certification where shipments require it',
      'Chargeable weight calculation, volumetric as often as actual',
      'Coordinating with airlines, ground handlers and customs',
    ],
    preferred: ['IATA certification held', 'Perishable or temperature-controlled cargo', 'Charter experience'],
  },
  'Shipping Documentation Executive': {
    required: [
      'Two or more years preparing shipping documentation',
      'Invoice, packing list, bill of lading, certificate of origin and destination-specific requirements',
      'Exact attention to detail, because a discrepancy holds payment or holds cargo, often both',
      'Preparing documents to letter of credit terms, to the letter',
      'Courier and presentation deadline management',
      'Document record maintenance for audit and claims',
    ],
    preferred: ['Letter of credit document checking', 'Specific commodity documentation', 'A trade documentation qualification'],
  },
  'EXIM Documentation Specialist': {
    required: [
      'Three or more years in export and import documentation',
      'Indian export documentation — shipping bill, bill of entry, e-BRC and export incentive schemes',
      'HS classification, which decides duty, restriction and eligibility',
      'Licences, permits and commodity-specific certificates',
      'Keeping up with regulatory changes, which happen often',
    ],
    preferred: ['DGFT scheme experience', 'Customs broker exposure', 'Multi-commodity experience'],
  },
  'Customs Broker / Clearing Agent': {
    required: [
      'A customs broker licence, or employment under one with the required qualification',
      'Three or more years filing customs entries',
      'Classification and valuation you can defend',
      'Handling examination, query and assessment with customs authorities',
      'Duty payment and exemption or concession schemes',
      'Resolving holds and detentions, which is most of the job',
    ],
    preferred: ['G-card or H-card holder', 'Specific port experience', 'AEO familiarity'],
  },
  'Port Operations Executive': {
    required: [
      'Two or more years in port or terminal operations',
      'Gate, yard, terminal and vessel coordination',
      'Container movements, stuffing, destuffing and CFS operations',
      'Coordinating with terminal, line, CFS and transporters, none of whom report to you',
      'Handling examination and inspection at the port',
      'Willingness to work the hours the vessel requires when a berth is imminent',
    ],
    preferred: ['Specific port knowledge', 'Bulk as well as containerised', 'Terminal operating system familiarity'],
  },
  'Container Fleet Coordinator': {
    required: [
      'Three or more years in container or equipment management',
      'Availability, positioning and inter-location balance',
      'Repositioning before a shortage becomes a booking that cannot be taken',
      'Detention and demurrage exposure management',
      'Container repair, maintenance and survey coordination',
      'Leasing arrangements and return conditions',
    ],
    preferred: ['Shipping line or leasing company experience', 'Reefer equipment knowledge'],
  },
  'Chartering Manager': {
    required: [
      'Five or more years in chartering',
      'Fixing vessels for bulk cargoes and negotiating charter party terms',
      'Freight rate, laytime and demurrage negotiation, where the commercial outcome is decided',
      'Market knowledge sufficient to time a fixture',
      'Charter party disputes',
    ],
    preferred: ['Dry bulk specifically', 'A shipping qualification such as ICS', 'Broker relationships'],
  },
  'Vessel Operations Manager': {
    required: [
      'Four or more years in vessel or voyage operations',
      'Managing a voyage from fixture to completion',
      'Port agent appointment and port call management',
      'Laytime monitoring and calculation, since demurrage and despatch turn on it',
      'Bunkering, stores and voyage operational needs',
      'Cargo operations at load and discharge with the documentation',
    ],
    preferred: ['A seagoing background', 'ICS qualification', 'Dry bulk experience'],
  },
  'Trade Compliance Officer — Sanctions': {
    required: [
      'Four or more years in sanctions, export control or trade compliance',
      'Screening counterparties, vessels, banks and end users, and re-screening when lists change',
      'Dual-use and export control classification and licensing',
      'Investigating hits properly and documenting the decision',
      'Tracking a sanctions landscape that changes with little notice',
      'Willingness to stop a transaction that cannot be cleared',
    ],
    preferred: ['OFAC, EU and UN regimes in depth', 'A legal or compliance qualification', 'Maritime sanctions experience'],
  },
  'European Logistics Manager': {
    required: [
      'Five or more years in European logistics',
      'Road, rail and barge networks across the union',
      'Customs and transit procedures inside and at the EU border',
      'Warehouse and distribution partner management',
      'Cost and service ownership across a network',
      'EU work eligibility',
    ],
    preferred: ['Rotterdam or major port experience', 'A second European language', 'Multimodal optimisation'],
  },
  'EU Customs Compliance Specialist': {
    required: [
      'Four or more years in EU customs compliance',
      'Declarations, procedures and the authorisations behind them',
      'Union Customs Code including transit, warehousing and inward processing',
      'Combined nomenclature classification and duty consequences',
      'AEO status maintenance',
      'Customs audits and the record-keeping that survives them',
    ],
    preferred: ['A customs qualification', 'Multi-member-state experience', 'Post-Brexit UK-EU flows'],
  },

  // ══ Trade Operations ═════════════════════════════════════════════════════════
  'Trade Operations Manager': {
    required: [
      'Five or more years in trade operations or international trade',
      'Managing a trade from purchase order to final settlement',
      'Holding the chain together when supplier, documents, shipment or payment fails',
      'Telling both sides the truth about where a trade stands',
      'Team and process management',
      'Working with trade finance, shipping and marketplace as one chain',
    ],
    preferred: ['Commodity trading experience', 'Multi-corridor exposure', 'A trade qualification'],
  },
  'Regional Trade Operations Manager': {
    required: [
      'Five or more years in trade operations with regional responsibility',
      'Managing regional supplier and buyer relationships operationally',
      'Regulatory and documentary requirements of the markets in the region',
      'Trade performance and exception reporting',
    ],
    preferred: ['A regional language', 'Multi-country team management'],
  },
  'Purchase Order Management Executive': {
    required: [
      'Two or more years in purchase order or order management',
      'Raising and managing purchase orders against agreed terms',
      'Tracking confirmation, production status and readiness, chasing before the date',
      'Amendment management keeping commercial terms straight',
      'Supplier coordination on shipment readiness and documentation',
    ],
    preferred: ['ERP experience', 'International supplier experience'],
  },
  'Supplier Onboarding Specialist': {
    required: [
      'Two or more years in supplier onboarding, procurement or compliance',
      'Due diligence and verification that a supplier is a real business with the capacity claimed',
      'Compliance screening including sanctions and adverse media',
      'Certification, licence and bank detail validation with the controls that stop bank detail fraud',
      'Supporting the first transaction closely',
    ],
    preferred: ['KYC or KYB experience', 'International supplier verification', 'Audit background'],
  },
  'Pre-Shipment Quality Inspector': {
    required: [
      'Three or more years in quality inspection, preferably pre-shipment',
      'Sampling to an agreed standard and inspecting properly rather than confirming expectations',
      'Verifying quantity, packing, marking and labelling as well as quality',
      'Inspection reports with photographic evidence that will stand in a dispute',
      'Willingness to hold a shipment and say so to a supplier who does not want to hear it',
      'Willingness to travel to supplier sites',
    ],
    preferred: ['AQL sampling knowledge', 'Third-party inspection agency background', 'Specific commodity expertise'],
  },

  // ══ Marketplace ══════════════════════════════════════════════════════════════
  'Marketplace Product Manager': {
    required: [
      'Four or more years in product management on a marketplace or two-sided product',
      'Making two-sided trade-offs explicitly, since nearly every change helps one side at the other\'s expense',
      'Building trust mechanisms that let strangers in different countries transact',
      'Ownership of match rate, quote-to-order conversion and repeat transaction',
      'Working with trust and operations as one group rather than three functions',
    ],
    preferred: ['B2B marketplace experience', 'International or cross-border commerce', 'Trade domain knowledge'],
  },
  'Seller Onboarding Manager': {
    required: [
      'Three or more years in onboarding, account management or operations',
      'Business registration, ownership, capability and document verification',
      'Catching the seller shut down under another name and registering again',
      'Helping sellers build listings that convert rather than approving what is submitted',
      'Activation funnel ownership',
    ],
    preferred: ['Marketplace experience', 'KYB or verification background', 'Multi-country registry familiarity'],
  },
  'Buyer Success Manager': {
    required: [
      'Three or more years in customer success, account management or trade operations',
      'Helping buyers find and qualify suppliers, and managing the first transaction closely',
      'Impartial dispute and quality issue handling between buyer and seller',
      'Understanding why a buyer stopped, which is more useful than the ones who stayed',
      'Feeding recurring problems back into the product',
    ],
    preferred: ['B2B marketplace experience', 'International trade knowledge', 'A second language'],
  },
  'Catalogue Operations Lead': {
    required: [
      'Four or more years in catalogue, content or data operations',
      'Taxonomy and attribute schema design, which is what makes search and comparison possible',
      'Enrichment and normalisation of listing data submitted in every format imaginable',
      'Team management with a quality standard',
      'Measuring catalogue quality by whether buyers find things, not by row count',
    ],
    preferred: ['PIM system experience', 'B2B or industrial catalogues', 'SQL'],
  },
  'Marketplace Trust & Verification Manager': {
    required: [
      'Four or more years in trust, verification or compliance on a platform',
      'Designing verification standards across jurisdictions with very different registries',
      'Detecting fraudulent listings, misrepresented goods and reincarnated sellers',
      'Dispute and enforcement processes with defensible decisions',
      'Balancing verification friction against the legitimate seller it keeps out',
    ],
    preferred: ['Marketplace trust and safety', 'KYB and document authenticity', 'Investigation background'],
  },
  'Commercial Pricing Analyst': {
    required: [
      'Three or more years in pricing, commercial or financial analysis',
      'Pricing models and margin analysis behind commercial decisions',
      'Tracking commodity market prices and knowing what moves them',
      'Transaction profitability analysis including financing and logistics cost',
      'Strong analytical and modelling ability',
    ],
    preferred: ['Commodity trading exposure', 'SQL', 'Marketplace pricing experience'],
  },
};
