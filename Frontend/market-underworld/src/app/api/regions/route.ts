import { NextResponse } from 'next/server';
    import { REGIONS } from '@/data/mockData';

    export async function GET() {
      return NextResponse.json(REGIONS);
    }
