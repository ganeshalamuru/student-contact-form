// Client component — renders server-paginated student table; all data operations are server-side
'use client';

import { useState, useEffect } from 'react';

const COLUMNS = [
  { key: 'State',       label: 'State' },
  { key: 'district',    label: 'District' },
  { key: 'name',        label: 'Name' },
  { key: 'fathername',  label: 'Father Name' },
  { key: 'phone',       label: 'Phone' },
  { key: 'group',       label: 'Group' },
  { key: 'collegename', label: 'College' },
  { key: 'comments',    label: 'Comments' },
];

function formatComment(c) {
  if (!c) return '';
  const ts = c.createdAt
    ? new Date(c.createdAt).toISOString().slice(0, 16).replace('T', ' ')
    : '';
  return ts ? `[${ts}] ${c.text}` : (c.text ?? '');
}

function latestComment(comments) {
  if (!Array.isArray(comments) || comments.length === 0) return '';
  return formatComment(comments[comments.length - 1]);
}

function sortIcon(col, params) {
  if (params.sort !== col) return ' ↕';
  return params.order === 'asc' ? ' ↑' : ' ↓';
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const around = new Set([1, 2, current - 1, current, current + 1, total - 1, total]);
  const valid  = [...around].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < valid.length; i++) {
    if (i > 0 && valid[i] - valid[i - 1] > 1) result.push(null);
    result.push(valid[i]);
  }
  return result;
}

// ── Comment history modal ────────────────────────────────────────────────────
function CommentModal({ student, onClose, onSave }) {
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const lines = Array.isArray(student.comments) ? student.comments.map(formatComment) : [];

  async function handleSave() {
    if (!newComment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(student._id, newComment.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Comment History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {student.name}
            {student.phone    ? ` · ${student.phone}`    : ''}
            {student.district ? ` · ${student.district}` : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2 min-h-[100px]">
          {lines.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet.</p>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="text-sm bg-gray-50 rounded px-3 py-2 text-gray-700 break-words">
                {line}
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-100 space-y-3">
          <textarea
            rows={3}
            placeholder="Add a new comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !newComment.trim()}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main table ───────────────────────────────────────────────────────────────
export default function StudentTable({
  data, pagination, filterOptions, params, loading, hasFilters, onParamsChange, onCommentSave,
}) {
  const [modal, setModal]         = useState(null);
  const [openMenu, setOpenMenu]   = useState(null);
  const [localSearch, setLocalSearch] = useState(params.search);

  // Sync local search input if parent resets it
  useEffect(() => {
    setLocalSearch(params.search);
  }, [params.search]);

  // Debounce search — wait 400ms after the user stops typing before firing API call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== params.search) {
        onParamsChange({ search: localSearch });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSort(col) {
    if (col === 'comments') return; // comments array not sortable server-side simply
    if (params.sort === col) {
      if (params.order === 'asc') {
        onParamsChange({ order: 'desc' });
      } else {
        onParamsChange({ sort: '', order: 'asc' }); // reset to no explicit sort
      }
    } else {
      onParamsChange({ sort: col, order: 'asc' });
    }
  }

  const { total, page: currentPage, totalPages, limit } = pagination;
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to   = Math.min(currentPage * limit, total);

  return (
    <div>
      {/* Transparent overlay — closes kebab menu on outside click */}
      {openMenu !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}

      {/* Filter + search bar — always visible */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name, phone, college…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={params.state}
          onChange={(e) => onParamsChange({ state: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          {filterOptions.states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={params.district}
          onChange={(e) => onParamsChange({ district: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Districts</option>
          {filterOptions.districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={params.college}
          onChange={(e) => onParamsChange({ college: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Colleges</option>
          {filterOptions.colleges.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* States */}
      {!hasFilters ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <p className="text-sm font-medium">Select at least one filter to view students</p>
          <p className="text-xs mt-1">Use State, District, or College above</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center py-24 text-gray-400">
          <svg className="animate-spin h-7 w-7 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading…
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No records match your filters.</p>
      ) : (
        <>
          {/* Row count */}
          <div className="mb-2 text-xs text-gray-500">
            Showing {from}–{to} of {total} rows
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">#</th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-3 py-3 text-left font-medium whitespace-nowrap select-none ${
                        col.key !== 'comments' ? 'cursor-pointer hover:bg-blue-500' : ''
                      }`}
                    >
                      {col.label}{col.key !== 'comments' && sortIcon(col.key, params)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.map((student, idx) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-400">{from + idx}</td>
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        title={col.key === 'comments' ? latestComment(student.comments) : undefined}
                        className="px-3 py-3 text-gray-700 whitespace-nowrap max-w-[200px] truncate"
                      >
                        {col.key === 'comments'
                          ? latestComment(student.comments) || <span className="text-gray-300">—</span>
                          : student[col.key]                || <span className="text-gray-300">—</span>}
                      </td>
                    ))}

                    {/* Three-dot kebab menu */}
                    <td className="px-3 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === student._id ? null : student._id);
                        }}
                        aria-label="Row actions"
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl leading-none"
                      >
                        ⋮
                      </button>

                      {openMenu === student._id && (
                        <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                          <button
                            onClick={() => { setModal(student); setOpenMenu(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            View / Add Comment
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-1">
            <button
              onClick={() => onParamsChange({ page: 1 })}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >«</button>

            <button
              onClick={() => onParamsChange({ page: currentPage - 1 })}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >Previous</button>

            {buildPageNumbers(currentPage, totalPages).map((p, i) =>
              p === null ? (
                <span key={`e${i}`} className="px-1 text-sm text-gray-400 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onParamsChange({ page: p })}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    p === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >{p}</button>
              )
            )}

            <button
              onClick={() => onParamsChange({ page: currentPage + 1 })}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >Next</button>

            <button
              onClick={() => onParamsChange({ page: totalPages })}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >»</button>
          </div>
        </>
      )}

      {modal && (
        <CommentModal
          student={modal}
          onClose={() => setModal(null)}
          onSave={onCommentSave}
        />
      )}
    </div>
  );
}
