export interface PromptImage {
  url: string;
  alt?: string;
  credit?: string;
}

// One individual prompt inside a roundup post, e.g. one of the 5 in
// "5 Best Gemini Halloween Photo Prompts for Men".
export interface PromptItem {
  heading: string;
  subtitle?: string;
  prompt_text: string;
  model?: string;
  images: PromptImage[];
  chatgpt_url?: string;
  gemini_url?: string;
}

// A themed roundup post — the actual page at /prompts/[slug].
export interface Prompt {
  id: string;
  slug: string;
  title: string;
  intro?: string | null;
  hero_image?: string | null;
  category?: string | null;
  tags: string[];
  items: PromptItem[];
  pro_tips?: string | null;
  is_trending: boolean;
  trending_order?: number | null;
  status: 'active' | 'archived';
  views_count: number;
  copies_count: number;
  created_at: string;
  updated_at: string;
}
