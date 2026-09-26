import { NextResponse } from 'next/server';
import technologies from '@/data/technologies.json';
import { getGraphRelatedEntities } from '@/lib/utils/entityHelpers';

/**
 * Technology API Route.
 * Supports:
 * - Listing all technologies (with pagination)
 * - Fetching a single technology by slug
 * - Filtering by industry
 * - include_relations=true for graph traversal
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const industry = searchParams.get('industry');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const includeRelations = searchParams.get('include_relations') === 'true';

  if (slug) {
    const tech = (technologies as any[]).find((t) => t.slug === slug);
    if (!tech) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    if (includeRelations) {
      tech.related_graph_entities = getGraphRelatedEntities(tech.id);
    }

    return NextResponse.json({ data: tech, status: 200 });
  }

  let filteredTechnologies = [...technologies];

  if (industry) {
    filteredTechnologies = filteredTechnologies.filter(
      (t) => t.industry.toLowerCase() === industry.toLowerCase()
    );
  }

  const totalItems = filteredTechnologies.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = filteredTechnologies.slice(start, end);

  return NextResponse.json({
    data,
    status: 200,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}
