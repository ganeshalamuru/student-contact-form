// API route: GET /api/students, POST /api/students, PATCH /api/students
import { NextResponse } from 'next/server';
import { queryStudents, insertStudent, appendComment } from '@/lib/mongodb';

const EMPTY_RESPONSE = {
  data: [],
  pagination: { total: 0, page: 1, limit: 25, totalPages: 0 },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const district = searchParams.get('district') ?? '';
    const college  = searchParams.get('college')  ?? '';
    const state    = searchParams.get('state')    ?? '';

    // Enforce filter-required rule — never scan the full collection
    if (!district && !college && !state) {
      return NextResponse.json(EMPTY_RESPONSE);
    }

    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
    const search = searchParams.get('search') ?? '';
    const sort   = searchParams.get('sort')   ?? '';
    const order  = searchParams.get('order')  === 'desc' ? 'desc' : 'asc';

    const result = await queryStudents({ page, limit, search, district, college, state, sort, order });
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/students error:', err);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const phoneDigits = String(data.phone ?? '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: 'phone must have at least 10 digits' }, { status: 400 });
    }

    await insertStudent(data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err.message?.includes('already exists')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('POST /api/students error:', err);
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, comment } = await request.json();

    if (!id || !comment?.trim()) {
      return NextResponse.json({ error: 'id and non-empty comment are required' }, { status: 400 });
    }

    const comments = await appendComment(id, comment.trim());
    return NextResponse.json({ success: true, comments });
  } catch (err) {
    console.error('PATCH /api/students error:', err);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
