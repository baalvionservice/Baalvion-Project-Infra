
import { NextResponse } from 'next/server';
import { ALL_CATEGORIES, COUNTRY_MARKETPLACE_CONFIGS, MARKETPLACE_MODULES } from '@/data/mockData';

export async function GET(request: Request, { params }: { params: Promise<{ country: string }> }) {
  const resolvedParams = await params;
  const countryKey = resolvedParams.country.toLowerCase();
  
  // Get config for this country from our modular unified registry
  const config = COUNTRY_MARKETPLACE_CONFIGS[countryKey];
  
  if (!config) {
    return NextResponse.json({
      success: false,
      error: "Hub Node not found in global registry"
    }, { status: 404 });
  }
  
  // Dynamically map module IDs to full module objects
  const modules = MARKETPLACE_MODULES.filter(mod => 
    config.modules.includes(mod.id) && mod.status !== 'disabled'
  );

  return NextResponse.json({
    success: true,
    data: {
      name: config.country,
      modules: modules,
      nodeStatus: config.status,
      payoutKey: config.payoutKey
    }
  });
}
