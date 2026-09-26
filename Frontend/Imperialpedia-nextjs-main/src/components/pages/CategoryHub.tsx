/**
 * CategoryHub — legacy stub kept for type-compatibility.
 * No pages currently import this component; it is not rendered anywhere.
 */
export interface CategoryContent {
  title: string;
  description: string;
  terms: string[];
  takeaways: string[];
  contentHtml: string;
  faqs: { q: string; a: string }[];
  slug: string;
}

export default function CategoryHub(_props: CategoryContent) {
  return null;
}
