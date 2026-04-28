// Main dashboard page — fetches students and renders table + add-student form
'use client';

import { useState, useEffect, useCallback } from 'react';
import StudentTable from '@/components/StudentTable';
import StudentForm from '@/components/StudentForm';

export default function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to load student records');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleCommentSave(rowIndex, comment) {
    const res = await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowIndex, comment }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Save failed');
    }
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Contact Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${students.length} record${students.length !== 1 ? 's' : ''} from Google Sheets`}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <StudentForm onSuccess={fetchStudents} />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
          <button onClick={fetchStudents} className="ml-3 underline font-medium">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24 text-gray-400">
          <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading students…
        </div>
      ) : !error ? (
        <StudentTable students={students} onCommentSave={handleCommentSave} />
      ) : null}
    </main>
  );
}
