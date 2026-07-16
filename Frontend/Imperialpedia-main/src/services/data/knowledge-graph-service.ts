import { loadCompanies, loadCountries, loadIndustries, loadTechnologies } from '@/lib/data/loaders';
import { ApiResponse } from '@/types';
import { GraphNode, GraphConnection, KnowledgeGraphData, NodeType } from '@/types/knowledge-graph';
import { CompanyEntity, CountryEntity, IndustryEntity, TechnologyEntity, BaseEntity } from '@/types/entity';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Data service for the Financial Knowledge Graph Engine.
 *
 * Builds the graph from the real knowledge entities (company/country/industry/
 * technology — live from imperialpedia-service via `@/lib/data/loaders`, with the same
 * bundled-JSON fallback those loaders already provide). Connections are derived from
 * each entity's own real cross-reference fields (competitors, technologies, industry,
 * country, key_companies, top_countries, related_technologies) — the exact same fields
 * `getRelatedEntities` in loaders.ts resolves for the entity detail pages' "Related"
 * sections, so the graph stays consistent with the rest of the site.
 *
 * Capped per entity type so the graph stays a readable size; every node links to a real
 * entity detail page (/companies/{slug}, /countries/{slug}, etc.).
 */

const NODES_PER_TYPE = 15;

function nodeId(type: NodeType, slug: string): string {
  return `${type}:${slug}`;
}

function toNode(type: NodeType, entity: BaseEntity): GraphNode {
  return {
    id: nodeId(type, entity.slug),
    label: entity.name,
    type,
    category: entity.category || type,
    description: entity.description || '',
    metrics: { relations: 0, tags: (entity.tags || []).length },
    tags: entity.tags || [],
    slug: entity.slug,
  };
}

export const knowledgeGraphService = {
  async getGraphData(): Promise<ApiResponse<KnowledgeGraphData | null>> {
    try {
      const [companies, countries, industries, technologies] = await Promise.all([
        loadCompanies(),
        loadCountries(),
        loadIndustries(),
        loadTechnologies(),
      ]);

      const cappedCompanies = companies.slice(0, NODES_PER_TYPE);
      const cappedCountries = countries.slice(0, NODES_PER_TYPE);
      const cappedIndustries = industries.slice(0, NODES_PER_TYPE);
      const cappedTechnologies = technologies.slice(0, NODES_PER_TYPE);

      const nodes: GraphNode[] = [
        ...cappedCompanies.map((e) => toNode('company', e)),
        ...cappedCountries.map((e) => toNode('country', e)),
        ...cappedIndustries.map((e) => toNode('industry', e)),
        ...cappedTechnologies.map((e) => toNode('technology', e)),
      ];
      const nodeIds = new Set(nodes.map((n) => n.id));

      const connections: GraphConnection[] = [];
      const addEdge = (
        sourceType: NodeType,
        sourceSlug: string,
        targetType: NodeType,
        targetSlug: string,
        label: string,
      ) => {
        const source = nodeId(sourceType, sourceSlug);
        const target = nodeId(targetType, targetSlug);
        if (source === target) return;
        // Only keep edges where both endpoints made it into the (capped) node set,
        // otherwise the visualizer would render a dangling link.
        if (!nodeIds.has(source) || !nodeIds.has(target)) return;
        connections.push({ source, target, label });
      };

      cappedCompanies.forEach((c: CompanyEntity) => {
        (c.competitors || []).forEach((slug) => addEdge('company', c.slug, 'company', slug, 'Competes With'));
        (c.technologies || []).forEach((slug) => addEdge('company', c.slug, 'technology', slug, 'Uses Technology'));
        if (c.industry) addEdge('company', c.slug, 'industry', c.industry, 'Part of Industry');
        if (c.country) addEdge('company', c.slug, 'country', c.country, 'Operates In');
      });

      cappedIndustries.forEach((i: IndustryEntity) => {
        (i.top_countries || []).forEach((slug) => addEdge('industry', i.slug, 'country', slug, 'Present In'));
        (i.key_companies || []).forEach((slug) => addEdge('industry', i.slug, 'company', slug, 'Key Player'));
        (i.related_technologies || []).forEach((slug) =>
          addEdge('industry', i.slug, 'technology', slug, 'Related Technology'),
        );
      });

      cappedTechnologies.forEach((t: TechnologyEntity) => {
        (t.key_companies || []).forEach((slug) => addEdge('technology', t.slug, 'company', slug, 'Adopted By'));
        (t.related_technologies || []).forEach((slug) =>
          addEdge('technology', t.slug, 'technology', slug, 'Related Technology'),
        );
      });

      cappedCountries.forEach((c: CountryEntity) => {
        (c.industries || []).forEach((slug) => addEdge('country', c.slug, 'industry', slug, 'Hosts Industry'));
        (c.technologies || []).forEach((slug) => addEdge('country', c.slug, 'technology', slug, 'Adopts Technology'));
      });

      // Edges get proposed from both directions (e.g. a company lists a competitor and
      // that competitor may independently list it back) — dedupe by unordered pair + label.
      const seen = new Set<string>();
      const uniqueConnections = connections.filter((c) => {
        const key = `${[c.source, c.target].sort().join('|')}|${c.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const relationCounts = new Map<string, number>();
      uniqueConnections.forEach((c) => {
        relationCounts.set(c.source, (relationCounts.get(c.source) || 0) + 1);
        relationCounts.set(c.target, (relationCounts.get(c.target) || 0) + 1);
      });
      const finalNodes = nodes.map((n) => ({
        ...n,
        metrics: { ...n.metrics, relations: relationCounts.get(n.id) || 0 },
      }));

      return { data: { nodes: finalNodes, connections: uniqueConnections }, status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },
};
