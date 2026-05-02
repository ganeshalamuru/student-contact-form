// API route: GET /api/students/filters — returns distinct values for filter dropdowns
import { NextResponse } from 'next/server';
import { getFilterOptions } from '@/lib/mongodb';

export async function GET() {
  try {
    const options = await getFilterOptions();
    return NextResponse.json(options);
  } catch (err) {
    console.error('GET /api/students/filters error:', err);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
