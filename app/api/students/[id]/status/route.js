import { NextResponse } from 'next/server';
import { updateStudentStatus } from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const newStatus = await updateStudentStatus(id, status);
    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    if (err.message?.includes('Manual status must be')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.message === 'Student not found') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('PATCH /api/students/[id]/status error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
