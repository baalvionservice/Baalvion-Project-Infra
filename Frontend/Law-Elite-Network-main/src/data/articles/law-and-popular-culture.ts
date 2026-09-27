import type { LawArticle } from '../law-content';

const LAW_AND_POPULAR_CULTURE_CATEGORY = {
  id: 'e286998b-3748-4e69-bf82-10bbe9e2de95',
  name: 'Law & Popular Culture',
  slug: 'law-and-popular-culture',
};

/**
 * DRAFT / TEMPLATE ONLY -- not for publication. This is a structural
 * placeholder so the article template (headings, image, byline, sources
 * block) can be reviewed before the real, researched body is written. No
 * factual claims are made in the body below; every section is explicitly
 * marked pending. Local-only until approved -- see [[len-history-culture-repositioning]].
 */
export const articleHollywoodLawyers: LawArticle[] = [
  {
    id: 'lpc-001',
    title: 'How Hollywood Changed the Way We See Lawyers',
    slug: 'how-hollywood-changed-the-way-we-see-lawyers',
    alphabet: 'H',
    categoryId: LAW_AND_POPULAR_CULTURE_CATEGORY.id,
    subcategoryId: '',
    category: LAW_AND_POPULAR_CULTURE_CATEGORY,
    subcategory: { id: '', name: '', slug: '' },
    summary: '[Draft placeholder -- one to two real sentences summarizing the piece go here before publication.]',
    content: `<p><em>This is a draft placeholder showing the article template only. The paragraphs and headings below mark where real, sourced content will go -- nothing here is a factual claim.</em></p>

<h2>[Opening: the specific film or show moment this piece starts from]</h2>
<p>[Placeholder -- pending research and drafting.]</p>

<h2>[How that portrayal took hold]</h2>
<p>[Placeholder -- pending research and drafting.]</p>

<h2>[What changed, and what it changed about real perceptions of lawyers]</h2>
<p>[Placeholder -- pending research and drafting.]</p>

<h2>Sources</h2>
<p>[Placeholder -- real, checkable sources go here before publication.]</p>`,
    author: 'Law Elite Editorial Team',
    updatedAt: 'Draft',
    readingTime: 1,
    views: 0,
    featured: false,
    imageSeed: 'how-hollywood-changed-the-way-we-see-lawyers',
    primarySources: [],
  },
];
