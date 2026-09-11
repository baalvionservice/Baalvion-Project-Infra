export type Article = {
  /** Headline */
  title: string;
  /** Destination route (real Imperialpedia page) */
  href: string;
  /** Category kicker / eyebrow label */
  category: string;
  /** Optional summary / dek */
  dek?: string;
  /** Fully-resolved image URL — a real uploaded photo, or a generated-art fallback */
  image: string;
  /** Optional byline */
  author?: string;
};

export type TopicGroup = {
  title: string;
  href: string;
  /** Real category photo (from the CMS category's own imageUrl), rendered as a section banner when present */
  categoryImage?: string;
  articles: Article[];
};
