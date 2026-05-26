import { NextResponse } from 'next/server';
import industries from '@/data/industries.json';
import { getGraphRelatedEntities } from '@/lib/utils/entityHelpers';

/**
 * Industry API Route.
 * Supports:
 * - Listing all industries (with pagination)
 * - Fetching a single industry by slug
 * - include_relations=true for graph traversal
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const includeRelations = searchParams.get('include_relations') === 'true';

  if (slug) {
    const industry = (industries as any[]).find((i) => i.slug === slug);
    if (!industry) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    if (includeRelations) {
      industry.related_graph_entities = getGraphRelatedEntities(industry.id);
    }

    return NextResponse.json({ data: industry, status: 200 });
  }

  const totalItems = industries.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = industries.slice(start, end);

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
