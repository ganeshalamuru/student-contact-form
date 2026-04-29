// Client component — student data table with sorting, filters, search, pagination, and comment-history modal
'use client';

import { useState, useMemo } from 'react';

const PAGE_SIZE = 25;

const COLUMNS = [
  { key: 'District',      label: 'District' },
  { key: 'Student_Name', label: 'Student Name' },
  { key: 'Father_Name',  label: 'Father Name' },
  { key: 'Mobile',       label: 'Mobile' },
  { key: 'Group',        label: 'Group' },
  { key: 'College_Name', label: 'College' },
  { key: 'Remarks',      label: 'Remarks' },
  { key: 'Date_time',    label: 'Date/Time' },
  { key: 'Comments',     label: 'Comments' },
];

function latestComment(comments) {
  if (!comments?.trim()) return '';
  const lines = comments.split('\n').filter((l) => l.trim());
  return lines[lines.length - 1] ?? '';
}

function sortIcon(column, sort) {
  if (sort.column !== column) return ' ↕';
  return sort.direction === 'asc' ? ' ↑' : ' ↓';
}

// Returns page numbers with null as an ellipsis marker
function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const around = new Set([1, 2, current - 1, current, current + 1, total - 1, total]);
  const valid = [...around].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const lines = student.Comments
    ? student.Comments.split('\n').filter((l) => l.trim())
    : [];

  async function handleSave() {
    if (!newComment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(student._rowIndex, newComment.trim());
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
            {student.Student_Name}
            {student.Mobile   ? ` · ${student.Mobile}`   : ''}
            {student.District ? ` · ${student.District}` : ''}
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
export default function StudentTable({ students, onCommentSave }) {
  const [search, setSearch]           = useState('');
  const [districtFilter, setDistrict] = useState('');
  const [collegeFilter, setCollege]   = useState('');
  const [sort, setSort]               = useState({ column: null, direction: 'asc' });
  const [modal, setModal]             = useState(null);
  const [openMenu, setOpenMenu]       = useState(null); // _rowIndex of open kebab menu, or null
  const [page, setPage]               = useState(1);

  const districts = useMemo(
    () => [...new Set(students.map((s) => s.District).filter(Boolean))].sort(),
    [students],
  );
  const colleges = useMemo(
    () => [...new Set(students.map((s) => s.College_Name).filter(Boolean))].sort(),
    [students],
  );

  function toggleSort(column) {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: 'asc' };
    });
    // Sort preserves current page (clamped to totalPages below)
  }

  const processed = useMemo(() => {
    let rows = students;

    if (districtFilter) rows = rows.filter((s) => s.District     === districtFilter);
    if (collegeFilter)  rows = rows.filter((s) => s.College_Name === collegeFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((s) =>
        Object.values(s).some((v) => String(v).toLowerCase().includes(q)),
      );
    }

    if (sort.column) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort.column] ?? '';
        const bv = b[sort.column] ?? '';

        if (sort.column === 'Mobile') {
          const an = parseInt(av.replace(/\D/g, ''), 10);
          const bn = parseInt(bv.replace(/\D/g, ''), 10);
          if (!isNaN(an) && !isNaN(bn))
            return sort.direction === 'asc' ? an - bn : bn - an;
        }

        if (sort.column === 'Date_time') {
          const ad = new Date(av), bd = new Date(bv);
          if (!isNaN(ad) && !isNaN(bd))
            return sort.direction === 'asc' ? ad - bd : bd - ad;
        }

        const cmp = av.localeCompare(bv);
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [students, search, districtFilter, collegeFilter, sort]);

  const totalPages  = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows    = processed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from        = processed.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to          = Math.min(currentPage * PAGE_SIZE, processed.length);

  if (students.length === 0) {
    return <p className="text-center text-gray-500 py-12">No student records found.</p>;
  }

  return (
    <div>
      {/* Transparent overlay — closes the kebab menu when clicking outside it */}
      {openMenu !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search across all fields…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={districtFilter}
          onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={collegeFilter}
          onChange={(e) => { setCollege(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Colleges</option>
          {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <span className="text-xs text-gray-500 whitespace-nowrap">
          {processed.length} of {students.length} records
        </span>
      </div>

      {processed.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No records match your filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">#</th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="px-3 py-3 text-left font-medium whitespace-nowrap cursor-pointer hover:bg-blue-500 select-none"
                    >
                      {col.label}{sortIcon(col.key, sort)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pageRows.map((student, idx) => (
                  <tr key={student._rowIndex} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-400">{from + idx}</td>
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        title={col.key === 'Comments' ? student.Comments : undefined}
                        className="px-3 py-3 text-gray-700 whitespace-nowrap max-w-[200px] truncate"
                      >
                        {col.key === 'Comments'
                          ? latestComment(student.Comments) || <span className="text-gray-300">—</span>
                          : student[col.key]               || <span className="text-gray-300">—</span>}
                      </td>
                    ))}

                    {/* Kebab / three-dot menu */}
                    <td className="px-3 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === student._rowIndex ? null : student._rowIndex);
                        }}
                        aria-label="Row actions"
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl leading-none"
                      >
                        ⋮
                      </button>

                      {openMenu === student._rowIndex && (
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              Showing {from}–{to} of {processed.length} rows
            </span>

            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                «
              </button>

              {/* Previous */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Numbered pages */}
              {buildPageNumbers(currentPage, totalPages).map((p, i) =>
                p === null ? (
                  <span key={`e${i}`} className="px-1 text-sm text-gray-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>

              {/* Last page */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
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
