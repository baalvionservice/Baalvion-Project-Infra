/**
 * The guides.
 *
 * These live in the repository rather than in the database on purpose. They are platform
 * writing, not member writing: they are reviewed in a pull request, they carry no author's
 * personal history, and they can be indexed by search engines — none of which is true of
 * anything a member writes here. Keeping them out of canwemarry-service also keeps the
 * public reading surface completely separate from the private one.
 *
 * Two rules for anything added to this file.
 *
 * Nothing is invented. Every legal statement below names the Act section or the judgment it
 * comes from, and the practical guidance is written as what tends to happen rather than as
 * findings from research nobody did. Where the law differs by state or is unsettled, the
 * guide says so instead of flattening it into a confident answer.
 *
 * And nothing is padded. A guide is as long as it has something to say. There is no target
 * length, no house structure every piece has to fill, and no synthesised "case study".
 */

export type Block =
    | { t: 'h'; text: string }
    | { t: 'p'; text: string }
    | { t: 'ul'; items: string[] }
    | { t: 'steps'; items: { title: string; text: string }[] }
    | { t: 'note'; tone: 'plain' | 'warn'; title?: string; text: string }
    | { t: 'sources'; items: string[] };

export type Category = 'Law' | 'Safety' | 'Family' | 'Money' | 'Community';

export interface Guide {
    slug: string;
    title: string;
    category: Category;
    excerpt: string;
    /** ISO date. Shown as "Updated" — these are living pages, not dated news. */
    updated: string;
    /** Optional. A guide gets a photograph only where one is honestly apt; the listing and
     *  article pages fall back to a typographic tile rather than forcing a wedding photo
     *  onto, say, the page about being threatened. */
    image?: { src: string; alt: string };
    body: Block[];
}

/**
 * Ordered deliberately: the two legal ones first, because that is what people arrive asking.
 *
 * Typed as a non-empty tuple so the listing page can take the first as its featured piece
 * without a runtime guard for a case that cannot happen — `noUncheckedIndexedAccess` is on,
 * and this is the honest way to satisfy it rather than a non-null assertion.
 */
export const GUIDES: [Guide, ...Guide[]] = [
    {
        slug: 'marry-without-converting',
        title: 'You can marry without either of you converting',
        category: 'Law',
        excerpt:
            'The Special Marriage Act is the civil route that exists precisely for couples from different faiths and different castes. What it actually requires — including the thirty-day notice that catches most people out.',
        updated: '2026-09-08',
        image: { src: '/img/threshold.jpg', alt: 'A carved sandstone doorway in an Indian building' },
        body: [
            { t: 'p', text: 'The first thing many families say is that one of you will have to convert. It is said with total confidence and it is not true. India has a civil marriage law that exists for exactly this situation, and it asks neither of you to change religion.' },

            { t: 'h', text: 'What it is' },
            { t: 'p', text: 'The Special Marriage Act, 1954 lets any two people in India marry regardless of the religion either was born into. The marriage is solemnised by a Marriage Officer rather than by a priest, and it is a marriage in every sense that matters afterwards — inheritance, a passport, a visa, a hospital next of kin.' },

            { t: 'h', text: 'Who can use it' },
            { t: 'p', text: 'Section 4 sets the conditions, and they are shorter than people expect.' },
            {
                t: 'ul',
                items: [
                    'Neither of you has a living spouse.',
                    'Both of you are capable of giving valid consent, and neither is prevented by unsoundness of mind from marrying or from having children.',
                    'The man has completed 21 years and the woman 18.',
                    'You are not within the degrees of prohibited relationship the Act lists — the rules about close blood relatives.',
                ],
            },
            { t: 'p', text: 'Caste is not on that list. Religion is not on that list. Parental consent is not on that list.' },

            { t: 'h', text: 'The thirty days' },
            { t: 'p', text: 'This is the part nobody warns couples about, and it is where plans usually come apart.' },
            {
                t: 'steps',
                items: [
                    { title: 'You give notice', text: 'One of you must have lived at least thirty days in the district where you file. You give written notice of the intended marriage to that district’s Marriage Officer.' },
                    { title: 'The notice goes up', text: 'The officer enters it in the Marriage Notice Book and displays a copy in the office, where anyone may read it. In practice copies have often also been sent to the addresses given on the notice.' },
                    { title: 'Thirty days pass', text: 'Anyone may object during that window — but only on the grounds the Act lists, which are the conditions above. A family disliking the match is not one of them.' },
                    { title: 'You marry', text: 'After the thirty days, before the Marriage Officer and three witnesses. The certificate that follows is conclusive evidence of the marriage.' },
                ],
            },
            {
                t: 'note',
                tone: 'warn',
                title: 'The notice is the risk, not the wedding',
                text: 'For a couple whose families are already opposed, a notice on a public board — or posted to a home address — is how a private plan becomes a confrontation, thirty days before you are married. Decide how you are handling that before you file, not after.',
            },

            { t: 'h', text: 'The notice may not be compulsory where you live' },
            { t: 'p', text: 'In January 2021 the Allahabad High Court held, in Safiya Sultana v. State of Uttar Pradesh, that a couple may ask in writing for the notice not to be published, and that insisting on publication interferes with their privacy and liberty. That judgment binds Uttar Pradesh. Elsewhere practice varies and in some states nothing has changed. It is one of the first questions to put to a lawyer in your own state.' },

            { t: 'h', text: 'And the state conversion laws' },
            { t: 'p', text: 'Several states have passed laws requiring advance declaration and official clearance before a religious conversion, including a conversion connected with a marriage, with penalties attached. What they require differs from state to state, and parts of them have been challenged and stayed in court. This route matters here precisely because it involves no conversion at all — but if conversion is being discussed in your family, get a lawyer in your state before anybody signs anything.' },

            {
                t: 'note',
                tone: 'plain',
                text: 'General information, not advice about your situation. Marriage law in India varies by state and changes; before you act, speak to a lawyer who practises where you live. The resource directory lists legal services volunteers have checked.',
            },
            { t: 'sources', items: ['Special Marriage Act, 1954 — sections 4 to 13', 'Safiya Sultana v. State of Uttar Pradesh, Allahabad High Court, 12 January 2021'] },
        ],
    },

    {
        slug: 'the-courts-already-decided',
        title: 'The courts settled this a long time ago',
        category: 'Law',
        excerpt:
            'Three judgments worth knowing when a family says an inter-caste or interfaith marriage “is not allowed”. It is allowed, and the Supreme Court has said so more than once.',
        updated: '2026-09-08',
        body: [
            { t: 'p', text: 'Families argue about this as though the question is open. It is not. Adults in India choose who they marry, and every time that has been tested at the top it has come back the same way.' },

            { t: 'h', text: 'Lata Singh v. State of Uttar Pradesh (2006)' },
            { t: 'p', text: 'A young woman married outside her caste and her family responded with a criminal case against her husband’s relatives. The Supreme Court quashed the proceedings, held there is no bar whatever to a marriage between two consenting adults of different castes, and directed police to protect such couples rather than harass them. Its instruction to disapproving relatives was blunt: cut off social relations if you wish, and go no further than that.' },

            { t: 'h', text: 'Shafin Jahan v. Asokan K.M. (2018)' },
            { t: 'p', text: 'A High Court had annulled an adult woman’s marriage at her father’s request. The Supreme Court restored it and held that the choice of a partner falls within the personal liberty the Constitution guarantees. Whether a court thinks the marriage was a good idea is not the question before it.' },

            { t: 'h', text: 'Shakti Vahini v. Union of India (2018)' },
            { t: 'p', text: 'The judgment on so-called honour crimes. The Supreme Court held that a khap panchayat — or any other assembly — has no authority at all to interfere with a marriage between consenting adults, and issued directions to the states: identify the districts where this happens, run a special cell couples can approach, and make a safe house available to those who need one.' },

            { t: 'h', text: 'What that is actually worth' },
            { t: 'p', text: 'It will not win an argument at your dining table. Nobody has ever been persuaded by a citation. What it changes is what happens once the disagreement leaves the house — when a complaint is filed, when a panchayat is called, when you need a police station to take you seriously. In those rooms this is the law, and it is on your side.' },

            { t: 'note', tone: 'plain', text: 'Summaries, not advice. If any of this is live in your own situation, a lawyer who practises where you live can tell you what it means for you.' },
            { t: 'sources', items: ['Lata Singh v. State of Uttar Pradesh, Supreme Court of India, 2006', 'Shafin Jahan v. Asokan K.M., Supreme Court of India, 2018', 'Shakti Vahini v. Union of India, Supreme Court of India, 2018'] },
        ],
    },

    {
        slug: 'if-it-stops-being-safe',
        title: 'If it stops being safe',
        category: 'Safety',
        excerpt:
            'What to do, in order, when opposition turns into being confined, followed, threatened, or reported missing by your own family. Worth reading before you need it.',
        updated: '2026-09-08',
        body: [
            { t: 'p', text: 'Most families who object never go beyond argument. Some do. This page is for that case, and the time to read it is before rather than during.' },

            {
                t: 'note',
                tone: 'warn',
                title: 'If you are in danger right now',
                text: 'Call 112 before reading anything else. Nothing on this page is a substitute for emergency help.',
            },

            { t: 'h', text: 'If you are being confined, or your phone is being taken' },
            {
                t: 'ul',
                items: [
                    'Tell one person outside the house where you are, while you still can.',
                    'Move your identity documents somewhere you can reach without asking — Aadhaar, PAN, passport, degree certificates, and your marriage certificate if you have one.',
                    'Agree a plain sentence with that one person that means “come and get me”, so you can send it from any phone.',
                ],
            },

            { t: 'h', text: 'If your family files a missing-person complaint' },
            { t: 'p', text: 'This happens often and it frightens people who have done nothing wrong. An adult who has left home has not been abducted. The Supreme Court dealt with exactly this in Laxmibai Chandaragi B. v. State of Karnataka in 2021, and gave police directions on handling such complaints — including recording the adult’s own statement rather than pursuing the couple. Do not respond by going further underground. Get your statement recorded, and get a lawyer.' },

            { t: 'h', text: 'If you are being threatened' },
            { t: 'p', text: 'Shakti Vahini requires states to run a district cell for this and to make a safe house available. Couples also go straight to the High Court for a protection order; it is an ordinary, well-worn petition and lawyers who do this work file them regularly. Neither route requires you to be married first.' },

            { t: 'h', text: 'Worth doing early, while nothing has happened' },
            {
                t: 'ul',
                items: [
                    'Keep a dated note of what is said and by whom. It is unpleasant to write and it is the difference between a complaint and a story.',
                    'Keep copies of documents somewhere outside the house.',
                    'Know which police station covers where you are, and which High Court.',
                    'Have one person who is not in either family and who knows the whole situation.',
                ],
            },

            { t: 'p', text: 'This site also has a quick way out of any page and does not keep what you write where a search engine can find it. That is on the safety page, along with what the platform can and cannot see.' },
        ],
    },

    {
        slug: 'the-first-conversation',
        title: 'The first conversation is not the one that decides it',
        category: 'Family',
        excerpt:
            'Most people plan it like a trial, get a verdict, and conclude the answer is no. It usually is not an answer — it is a first reaction, and those move.',
        updated: '2026-09-08',
        image: { src: '/img/hands.jpg', alt: 'Two hands resting together' },
        body: [
            { t: 'p', text: 'Almost everyone prepares the first conversation as though it were a trial: the case, the evidence, the ruling. Then it goes badly and they take the reaction as the verdict. It rarely is one. First reactions to this news are shock, and shock is not a position.' },

            { t: 'h', text: 'Separate the shock from the objection' },
            { t: 'p', text: 'What comes out in the first hour is usually fear wearing the clothes of principle — what relatives will say, what it does to a younger sister’s prospects, whether anyone will look after you when they cannot. Those are answerable, slowly. “It is against our religion” often is not, and arguing with it head-on is how the conversation ends rather than pauses.' },

            { t: 'h', text: 'Say less than you prepared' },
            { t: 'p', text: 'A long rehearsed case tells a parent that this was settled without them, which is frequently the thing they are actually upset about. That you have met someone, that it is serious, and that you wanted them to hear it from you is enough for one evening. The wedding does not have to be in the first conversation.' },

            { t: 'h', text: 'Find the one person who is not against it' },
            { t: 'p', text: 'In most families there is one — an aunt, an older cousin, a brother who says nothing at the time and calls afterwards. They matter more than any argument you can make, because parents change their minds in conversations you are not in.' },

            { t: 'h', text: 'Allow for time you have not budgeted' },
            { t: 'p', text: 'People who have come out the other side of this tend to describe months, and often longer. That is not a reason to put your own life on hold. It is a reason not to read the first month as the ending.' },

            { t: 'p', text: 'None of this is a technique, and it does not always work. Some families never come round, and someone who did everything thoughtfully can still end up having to choose. What helps in either case is talking to people who have already been in it rather than to people with opinions about it — which is the entire reason this platform exists.' },
        ],
    },

    {
        slug: 'what-a-supporter-does',
        title: 'What a supporter actually does',
        category: 'Community',
        excerpt:
            'Not advice, not a campaign, not an audience. What offering support here means — and the things it is deliberately built not to be.',
        updated: '2026-09-08',
        image: { src: '/img/marigolds.jpg', alt: 'Marigold flowers growing' },
        body: [
            { t: 'p', text: 'The word “support” has been worn thin by the internet, where it usually means a number going up. It means something narrower here, and the difference is the whole design.' },

            { t: 'h', text: 'What it is' },
            {
                t: 'ul',
                items: [
                    'Someone who has been through a version of your situation asks to stand with you.',
                    'You decide whether to accept. Nothing happens until you do, and you can undo it later.',
                    'They see only what your visibility setting already lets them see. Offering support does not unlock anything.',
                    'Mostly it looks like a person telling you which words landed with their own parents and which made it worse — the part that is in no article anywhere.',
                ],
            },

            { t: 'h', text: 'What it is not' },
            {
                t: 'ul',
                items: [
                    'Not a vote on your relationship. There is no count of supporters shown anywhere, because a marriage is not more valid for being popular.',
                    'Not a group that contacts your family. Nobody here approaches anyone on your behalf, ever.',
                    'Not a ranking. There is no leaderboard, no top supporter, no streak — the incentives those create are the opposite of the ones this needs.',
                    'Not legal or clinical advice. For that there are mediators, counsellors and lawyers, and the resource directory is where they are.',
                ],
            },

            { t: 'h', text: 'If you want to offer it' },
            { t: 'p', text: 'Read a case that is genuinely close to something you have lived, and offer there. An offer from someone whose family came round after two years is worth more to the person reading it than fifty from people who simply agree. If your offer is not accepted, that is the system working as intended.' },
        ],
    },

    {
        slug: 'which-marriage-act-applies',
        title: 'Which Act you marry under, and why it matters',
        category: 'Law',
        excerpt:
            'Inter-caste is not the same problem as interfaith, and the law treats them completely differently. Two Hindus of different castes are already covered by the ordinary Hindu marriage law. Nobody tells couples this.',
        updated: '2026-09-08',
        body: [
            { t: 'p', text: 'Couples arrive at this convinced they face one obstacle. In law there are two, they are unrelated, and a great many people are quietly stuck on the wrong one.' },

            { t: 'h', text: 'If you are both Hindu' },
            { t: 'p', text: 'The Hindu Marriage Act, 1955 applies to you, and caste appears nowhere in its conditions. Different castes, different sub-castes, one of you Scheduled Caste and the other not — none of it is a legal obstacle, and none of it requires the Special Marriage Act. You can marry by ordinary ceremony and register it like anybody else.' },
            { t: 'p', text: 'The Act’s own definition is wider than the word suggests: for these purposes Buddhists, Jains and Sikhs are covered by it too. So a Hindu marrying a Sikh, or a Jain marrying a Hindu, is an ordinary Hindu marriage in law, whatever anybody at home believes about it.' },

            { t: 'h', text: 'If one of you is Muslim, Christian, Parsi or Jewish' },
            { t: 'p', text: 'Now the Hindu Marriage Act does not reach you, and the choice is real: convert, or use the Special Marriage Act. There is no third door. This is the case families mean when they say “it is not possible” — and it is possible, through the civil route.' },

            { t: 'h', text: 'What the difference costs you' },
            {
                t: 'ul',
                items: [
                    'A Hindu Marriage Act wedding happens whenever the ceremony happens. There is no waiting period, no public notice and no objection window.',
                    'A Special Marriage Act wedding takes thirty days from notice, and the notice is displayed.',
                    'Registration is a separate step from the marriage in both cases, and a marriage certificate is the document that ends most arguments about whether the marriage is real.',
                ],
            },

            {
                t: 'note',
                tone: 'warn',
                title: 'The trap in the middle',
                text: 'Converting in order to marry under the other side’s personal law is legal in itself, but several states now regulate conversion connected with marriage and attach penalties to getting it wrong. If anyone in either family is proposing a conversion, that is the moment to involve a lawyer — not after.',
            },

            { t: 'p', text: 'So the first question is not “will they let us”. It is which of these two situations you are actually in, because one of them has no legal obstacle at all and the other has a thirty-day one.' },

            { t: 'note', tone: 'plain', text: 'General information, not advice about your situation. Personal law in India is intricate and varies by state and community; a lawyer where you live can tell you which Act covers you in an afternoon.' },
            { t: 'sources', items: ['Hindu Marriage Act, 1955 — sections 2 and 5', 'Special Marriage Act, 1954 — sections 4 to 13'] },
        ],
    },

    {
        slug: 'inter-caste-marriage-support-schemes',
        title: 'The money side nobody mentions',
        category: 'Money',
        excerpt:
            'India runs an incentive scheme for inter-caste marriages, and most couples who qualify never hear about it. What it is, roughly what it is worth, and the conditions that disqualify people.',
        updated: '2026-09-08',
        image: { src: '/img/street.jpg', alt: 'A fabric stall on an Indian street' },
        body: [
            { t: 'p', text: 'Couples in this situation lose things that do not usually get counted: a wedding somebody else was going to pay for, a place to live, sometimes a job in a family business. Very few know that the state has an interest in the marriage happening anyway.' },

            { t: 'h', text: 'The central scheme' },
            { t: 'p', text: 'The Dr Ambedkar Scheme for Social Integration through Inter-Caste Marriage, run by the Ministry of Social Justice and Empowerment, pays an incentive to a couple where one spouse belongs to a Scheduled Caste and the other does not. It has been set at ₹2.5 lakh. It exists for exactly the reason you would guess: the state would rather these marriages happened than didn’t.' },

            { t: 'h', text: 'The conditions that catch people out' },
            {
                t: 'ul',
                items: [
                    'One spouse must be from a Scheduled Caste and the other from outside it.',
                    'It must be a valid, registered marriage — the certificate is the thing being claimed against, not the wedding.',
                    'It must be a first marriage for both.',
                    'There is a window after the marriage in which the proposal has to be made. Leaving it for a couple of years is how most claims are lost.',
                ],
            },

            { t: 'h', text: 'And your own state may run one too' },
            { t: 'p', text: 'Many states have their own inter-caste marriage incentive, separate from the central one, with different amounts and different paperwork. They are administered through the state social welfare department, and they are almost never advertised. Ask there, in person, before assuming there is nothing.' },

            {
                t: 'note',
                tone: 'plain',
                title: 'Check the current terms before you rely on any figure',
                text: 'Amounts, eligibility and the claim window are set by government order and change. Treat the number above as a reason to go and ask, not as a promise. Your district social welfare office is the place to confirm what is running today.',
            },

            { t: 'p', text: 'None of this makes the hard part easier. It does sometimes decide whether a couple can afford to stop waiting.' },
        ],
    },

    {
        slug: 'living-together-before-marriage',
        title: 'Living together is not a crime, whatever you have been told',
        category: 'Law',
        excerpt:
            'Families and sometimes police talk about a couple living together as though it were an offence. The Supreme Court has said clearly that it is not — twice.',
        updated: '2026-09-08',
        body: [
            { t: 'p', text: 'Two adults sharing a home is not illegal in India. It is treated as scandalous in a great many families and as a crime by nobody with the authority to say so, and the gap between those two facts is where a lot of frightened people live.' },

            { t: 'h', text: 'What the court said' },
            { t: 'p', text: 'In S. Khushboo v. Kanniammal, decided in 2010, the Supreme Court quashed a stack of criminal complaints and stated plainly that living together is not an offence, and that two consenting adults doing so are within their rights however unpopular that is. In Indra Sarma v. V.K.V. Sarma, in 2013, the court went further into what such a relationship means legally, setting out when one falls within the protection of the domestic violence law.' },

            { t: 'h', text: 'What that is worth when a family objects' },
            { t: 'p', text: 'Mostly it means a complaint filed against your partner has nothing under it. Families sometimes go to a police station expecting the fact of cohabitation itself to be actionable. It is not, and a station that treats it as such is wrong on the law rather than exercising a discretion.' },

            { t: 'h', text: 'What it does not do' },
            {
                t: 'ul',
                items: [
                    'It does not make you married, and it does not create the rights a marriage creates.',
                    'It does not stop a landlord refusing you, which is common and is a separate fight.',
                    'It does not protect you from being reported missing by your own family — that is a different problem, and it has its own page here.',
                ],
            },

            { t: 'p', text: 'Worth knowing mostly because the accusation is so confidently made. It helps to be certain, in the moment, that the confident person is wrong.' },

            { t: 'sources', items: ['S. Khushboo v. Kanniammal, Supreme Court of India, 2010', 'Indra Sarma v. V.K.V. Sarma, Supreme Court of India, 2013'] },
        ],
    },

    {
        slug: 'when-the-police-get-involved',
        title: 'When the police get involved',
        category: 'Safety',
        excerpt:
            'A family that cannot stop a marriage sometimes goes to a police station instead. What tends to be alleged, why it usually collapses, and the one thing that ends it fastest.',
        updated: '2026-09-08',
        body: [
            { t: 'p', text: 'This is the point at which a family disagreement becomes something with a file number, and it frightens people out of all proportion to how it usually ends. Knowing the shape of it in advance is most of the advantage.' },

            { t: 'h', text: 'What normally gets alleged' },
            { t: 'p', text: 'Almost always one of two things: that an adult woman is missing, or that she has been taken. Both are serious offences when they are true, and neither describes an adult who left home of her own accord. The criminal law here was rewritten recently — the Bharatiya Nyaya Sanhita replaced the Indian Penal Code from July 2024, and the procedure code changed with it — so you may hear the same allegation described under old section numbers by one person and new ones by another. The substance has not changed.' },

            { t: 'h', text: 'Why it usually collapses' },
            { t: 'p', text: 'Because the allegation depends on the woman not having chosen this, and she is available to say otherwise. That is why the single most useful step is getting her own statement recorded, before a magistrate, as early as possible. A statement on the record is what turns a live investigation into a closed one.' },

            { t: 'h', text: 'What the Supreme Court has told police to do' },
            { t: 'p', text: 'In Laxmibai Chandaragi B. v. State of Karnataka, in 2021, the court dealt with precisely this — parents filing against an adult daughter who had married by choice — and directed police on how such complaints should be handled, including taking the adult’s own account and not pursuing the couple once it is clear no offence occurred. It also had things to say about the counselling police need on this subject, which tells you how routine the problem is.' },

            {
                t: 'ul',
                items: [
                    'Do not go quiet. Disappearing makes an abduction story look truer than it is.',
                    'Get a lawyer before attending a station, not after.',
                    'Get the statement recorded before a magistrate as early as you can.',
                    'Keep your identity documents and, if you are married, the certificate, where you can reach them.',
                ],
            },

            {
                t: 'note',
                tone: 'warn',
                title: 'If you are being threatened rather than reported',
                text: 'That is a different situation and a more urgent one. Call 112, and read the page on what to do when it stops being safe.',
            },

            { t: 'sources', items: ['Laxmibai Chandaragi B. v. State of Karnataka, Supreme Court of India, 2021', 'Bharatiya Nyaya Sanhita, 2023 — in force from 1 July 2024'] },
        ],
    },

    {
        slug: 'when-the-answer-stays-no',
        title: 'When the answer stays no',
        category: 'Family',
        excerpt:
            'Not every family comes round. Almost nothing written about this admits that, which leaves the people it happened to feeling they must have done it wrong.',
        updated: '2026-09-08',
        image: { src: '/img/threshold.jpg', alt: 'A carved sandstone doorway in an Indian building' },
        body: [
            { t: 'p', text: 'Every article about this ends with the parents at the wedding. Some of them are. Others are not, and the people in that second group tend to conclude they were insufficiently patient, or picked the wrong words, or should have waited another year. Usually none of that is true. Some positions do not move, and no technique reaches them.' },

            { t: 'h', text: 'It is rarely a clean break' },
            { t: 'p', text: 'The version in films is a door slammed once. The real thing is far more often a long unresolved middle: a mother who talks to you but will not meet him, a father who has not spoken in a year but asks after you through a cousin, an invitation to a wedding that does not include your husband. It is genuinely harder to carry than a clear refusal, because it never settles into something you can grieve and be done with.' },

            { t: 'h', text: 'You are allowed to stop making the case' },
            { t: 'p', text: 'People spend years assembling better arguments. At some point the arguing itself becomes the relationship, and every conversation is a hearing. Some families come back only once the pressure to approve is removed — not as a tactic, but because there is nothing left to defend against. Others do not come back at all. Either way, the constant advocacy costs you something and buys less than it feels like it should.' },

            { t: 'h', text: 'Keep the door unlocked, not held open' },
            { t: 'p', text: 'The people who describe the best outcomes years later mostly did the same unremarkable thing: they stopped pushing and stayed reachable. A message at Diwali. A note when someone was ill. Nothing that demanded a reply, nothing that reopened the argument. It costs little and it is the only thing that is still in place if anybody changes their mind.' },

            { t: 'h', text: 'And build the other family' },
            { t: 'p', text: 'This is the part that actually decides how the next decade feels. Nobody replaces parents. But the couples who do best are not the ones whose families relented — they are the ones who ended up surrounded by people anyway: friends who showed up, an aunt who broke ranks, other couples who had been through the same thing and did not need it explained.' },

            { t: 'p', text: 'That last one is what this site is for. Not because a community is a substitute for a family, but because going through this with nobody who understands it is the thing that breaks people, and that part is fixable even when the family is not.' },
        ],
    },
];

/** Word count of everything readable, at 200 wpm, floored at one minute. */
export function readMinutes(guide: Guide): number {
    const text = guide.body
        .flatMap((b) => {
            switch (b.t) {
                case 'h':
                case 'p':
                    return [b.text];
                case 'ul':
                    return b.items;
                case 'steps':
                    return b.items.flatMap((i) => [i.title, i.text]);
                case 'note':
                    return [b.title ?? '', b.text];
                case 'sources':
                    return b.items;
            }
        })
        .join(' ');
    return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}

export const getGuide = (slug: string): Guide | undefined => GUIDES.find((g) => g.slug === slug);
