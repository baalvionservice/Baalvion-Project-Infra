/**
 * @fileOverview Type definitions for the Global Topic Index.
 */

export type TopicDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type TopicContentType = 'Article' | 'Guide' | 'Video';

export interface TopicNode {
  id: string;
  title: string;
  slug: string;
  definition: string;
  category: string;
  difficulty: TopicDifficulty;
  reading_time: string;
  popularity_score: number;
  type: TopicContentType;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  topics: { title: string; slug: string }[];
}

export interface GlobalTopicIndexData {
  topics: TopicNode[];
  trending_topics: string[];
  learning_paths: LearningPath[];
  categories: { name: string; count: number }[];
}
