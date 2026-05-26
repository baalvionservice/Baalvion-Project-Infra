import { NextResponse } from 'next/server';
import companies from '@/data/companies.json';
import { getGraphRelatedEntities } from '@/lib/utils/entityHelpers';

/**
 * Company API Route.
 * Supports:
 * - Listing all companies (with pagination)
 * - Fetching a single company by slug
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

  // FUTURE: Replace this mock logic with a high-performance graph database (Neo4j)

  if (slug) {
    const company = (companies as any[]).find((c) => c.slug === slug);
    if (!company) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    if (includeRelations) {
      company.related_graph_entities = getGraphRelatedEntities(company.id);
    }

    return NextResponse.json({ data: company, status: 200 });
  }

  let filteredCompanies = [...companies];

  if (industry) {
    filteredCompanies = filteredCompanies.filter(
      (c) => c.industry.toLowerCase() === industry.toLowerCase()
    );
  }

  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = filteredCompanies.slice(start, end);

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
