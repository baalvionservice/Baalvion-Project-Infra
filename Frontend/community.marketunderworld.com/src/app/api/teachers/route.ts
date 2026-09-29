
import { NextResponse } from 'next/server';

/**
 * @fileOverview Mock Teacher API Route.
 * Prepared for live Firestore integration.
 */

const MOCK_TEACHERS = Array.from({ length: 24 }).map((_, i) => ({
  id: `T-${i}`,
  name: i % 2 === 0 ? "Dr. Priya Sharma" : "Master Yuki Tanaka",
  email: `operator${i}@nexus.io`,
  avatar: `https://picsum.photos/seed/teacher${i}/400/400`,
  regionId: i % 2 === 0 ? "sas" : "eap",
  countryId: i % 2 === 0 ? "in" : "jp",
  state: i % 2 === 0 ? "Maharashtra" : "Tokyo",
  city: i % 2 === 0 ? "Mumbai" : "Shibuya",
  subjects: i % 2 === 0 ? ["Chemistry", "Lab Protocol"] : ["Calculus", "Physics"],
  languages: ["English", "Hindi", "Japanese"],
  rating: 4.9,
  price_per_hour: 25 + (i * 5),
  experienceYears: 8 + (i % 5),
  isLive: i % 3 === 0,
  isVerified: true,
  bio: "Specializing in high-performance learning protocols and competitive exam strategies.",
  createdAt: new Date().toISOString()
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const region = searchParams.get('region');
  const subject = searchParams.get('subject');
  const query = searchParams.get('q');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  let filtered = [...MOCK_TEACHERS];

  if (country && country !== 'all') filtered = filtered.filter(t => t.countryId === country);
  if (region && region !== 'all') filtered = filtered.filter(t => t.regionId === region);
  if (subject && subject !== 'all') filtered = filtered.filter(t => t.subjects.includes(subject));
  
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.subjects.some(s => s.toLowerCase().includes(q)) ||
      t.city.toLowerCase().includes(q) ||
      t.countryId.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      page: 1,
      limit: 24
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Preparation for Teacher Registration
  return NextResponse.json({
    success: true,
    message: "Teacher registry initialized. Manual audit required.",
    nodeId: `T-PENDING-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  });
}
