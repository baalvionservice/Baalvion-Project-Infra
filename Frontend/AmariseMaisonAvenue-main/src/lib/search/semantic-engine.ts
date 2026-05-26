
/**
 * @fileOverview Institutional Semantic Discovery Engine
 * Simulates vector-based search logic for high-end luxury artifacts.
 */

import { Product, CountryCode } from '../types';

export interface SemanticResult<T> {
  item: T;
  resonanceScore: number; // 0 to 1
  contextTags: string[];
}

export class SemanticEngine {
  /**
   * Mock Vectorizer
   * In production, this would call an Embedding API (OpenAI / Vertex AI)
   */
  static async getEmbedding(text: string): Promise<number[]> {
    // Return a dummy 8-dimension vector based on text characteristics
    const vector = new Array(8).fill(0).map((_, i) => {
      const charCode = text.charCodeAt(i % text.length) || 0;
      return (charCode % 100) / 100;
    });
    return vector;
  }

  /**
   * Mock Cosine Similarity
   * Measures the "Resonance" between a query intent and an artifact.
   */
  static calculateSimilarity(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      mA += v1[i] * v1[i];
      mB += v2[i] * v2[i];
    }
    const similarity = dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
    return isNaN(similarity) ? 0 : similarity;
  }

  /**
   * Strategic Search Algorithm
   * Combines Intent Scoring with Multi-Market Filtering.
   */
  static async search<T extends { name: string; description?: string }>(
    query: string,
    items: T[],
    limit: number = 5
  ): Promise<SemanticResult<T>[]> {
    const queryVector = await this.getEmbedding(query);
    
    const results: SemanticResult<T>[] = await Promise.all(
      items.map(async (item) => {
        const itemVector = await this.getEmbedding(item.name + (item.description || ''));
        const score = this.calculateSimilarity(queryVector, itemVector);
        
        return {
          item,
          resonanceScore: score,
          contextTags: this.extractMockTags(item.name)
        };
      })
    );

    return results
      .sort((a, b) => b.resonanceScore - a.resonanceScore)
      .slice(0, limit);
  }

  private static extractMockTags(name: string): string[] {
    const tags = ['Heritage', 'Artisanal'];
    if (name.toLowerCase().includes('birkin')) tags.push('Investment', 'Iconic');
    if (name.toLowerCase().includes('gold')) tags.push('Precious', 'Status');
    return tags;
  }
}
