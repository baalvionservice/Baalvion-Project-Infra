import { NextResponse } from 'next/server';
import countries from '@/data/countries.json';

/**
 * Country API Route.
 * Supports:
 * - Listing all countries (with pagination)
 * - Fetching a single country by slug
 * - Filtering by region
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const region = searchParams.get('region');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // FUTURE: Replace this mock logic with a database query (e.g., Prisma/PostgreSQL)
  // Example: prisma.country.findUnique({ where: { slug } })

  if (slug) {
    const country = countries.find((c) => c.slug === slug);
    if (!country) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    return NextResponse.json({ data: country, status: 200 });
  }

  let filteredCountries = [...countries];

  if (region) {
    filteredCountries = filteredCountries.filter(
      (c) => c.region.toLowerCase() === region.toLowerCase()
    );
  }

  const totalItems = filteredCountries.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = filteredCountries.slice(start, end);

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
