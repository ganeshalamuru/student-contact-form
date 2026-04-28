// API route: GET /api/students, POST /api/students, PATCH /api/students
import { NextResponse } from 'next/server';
import { getRows, appendRow, updateComment } from '@/lib/sheets';

export async function GET() {
  try {
    const rows = await getRows();
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/students error:', err);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    const required = ['Student_Name', 'Mobile'];
    for (const field of required) {
      if (!data[field]?.trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const mobileDigits = data.Mobile.replace(/\D/g, '');
    if (mobileDigits.length < 10) {
      return NextResponse.json({ error: 'Mobile must have at least 10 digits' }, { status: 400 });
    }

    // Duplicate mobile check
    const existing = await getRows();
    const duplicate = existing.find(
      (r) => r.Mobile.replace(/\D/g, '') === mobileDigits
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `Mobile ${data.Mobile} already exists (row ${duplicate._rowIndex})` },
        { status: 409 }
      );
    }

    await appendRow(data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('POST /api/students error:', err);
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { rowIndex, comment } = await request.json();

    if (!rowIndex || !comment?.trim()) {
      return NextResponse.json({ error: 'rowIndex and non-empty comment are required' }, { status: 400 });
    }

    const updatedComments = await updateComment(rowIndex, comment.trim());
    return NextResponse.json({ success: true, comments: updatedComments });
  } catch (err) {
    console.error('PATCH /api/students error:', err);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
