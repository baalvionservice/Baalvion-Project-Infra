export type Article = {
  /** Headline */
  title: string;
  /** Destination route (real Imperialpedia page) */
  href: string;
  /** Category kicker / eyebrow label */
  category: string;
  /** Optional summary / dek */
  dek?: string;
  /** picsum.photos seed for deterministic editorial art */
  imageSeed: string;
  /** Optional byline */
  author?: string;
};

export type TopicGroup = {
  title: string;
  href: string;
  articles: Article[];
};
