// Main dashboard page — server-side paginated student table with filter-required data loading
'use client';

import { useState, useEffect, useCallback } from 'react';
import StudentTable from '@/components/StudentTable';
import StudentForm from '@/components/StudentForm';

const DEFAULT_PARAMS = {
  page: 1, limit: 25, search: '', district: '', college: '', state: '', sort: '', order: 'asc',
};

const EMPTY_RESULT = {
  data: [],
  pagination: { total: 0, page: 1, limit: 25, totalPages: 0 },
};

export default function DashboardPage() {
  const [params, setParams]               = useState(DEFAULT_PARAMS);
  const [result, setResult]               = useState(EMPTY_RESULT);
  const [filterOptions, setFilterOptions] = useState({ states: [], districts: [], colleges: [] });
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const hasFilters = !!(params.district || params.college || params.state);

  // Load filter dropdown options once on mount
  useEffect(() => {
    fetch('/api/students/filters')
      .then((r) => r.json())
      .then(setFilterOptions)
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  const fetchData = useCallback(async (p) => {
    if (!p.district && !p.college && !p.state) {
      setResult(EMPTY_RESULT);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page:     String(p.page),
        limit:    String(p.limit),
        search:   p.search,
        district: p.district,
        college:  p.college,
        state:    p.state,
        sort:     p.sort,
        order:    p.order,
      }).toString();
      const res = await fetch(`/api/students?${qs}`);
      if (!res.ok) throw new Error('Failed to load students');
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever params change
  useEffect(() => {
    fetchData(params);
  }, [params, fetchData]);

  function handleParamsChange(changes) {
    setParams((prev) => {
      const next = { ...prev, ...changes };
      // Auto-reset to page 1 when filter or search changes (not on sort or explicit page change)
      const isFilterOrSearch =
        'district' in changes || 'college' in changes ||
        'state' in changes    || 'search'  in changes;
      if (isFilterOrSearch && !('page' in changes)) next.page = 1;
      return next;
    });
  }

  async function handleCommentSave(id, comment) {
    const res = await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, comment }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Save failed');
    // Patch just this student's comments in state — no re-fetch needed
    setResult((prev) => ({
      ...prev,
      data: prev.data.map((s) => (s._id === id ? { ...s, comments: json.comments } : s)),
    }));
  }

  const { total } = result.pagination;

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Contact Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? 'Loading…'
              : hasFilters
              ? `${total} record${total !== 1 ? 's' : ''} found`
              : 'Select filters to view data'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {hasFilters && (
            <button
              onClick={() => fetchData(params)}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
          <StudentForm onSuccess={() => fetchData(params)} />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
          <button onClick={() => fetchData(params)} className="ml-3 underline font-medium">
            Retry
          </button>
        </div>
      )}

      <StudentTable
        data={result.data}
        pagination={result.pagination}
        filterOptions={filterOptions}
        params={params}
        loading={loading}
        hasFilters={hasFilters}
        onParamsChange={handleParamsChange}
        onCommentSave={handleCommentSave}
      />
    </main>
  );
}
