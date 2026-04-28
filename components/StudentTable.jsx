// Client component — student data table with sorting, filters, search, and comment-history modal
'use client';

import { useState, useMemo } from 'react';

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
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Comment History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {student.Student_Name}
            {student.Mobile   ? ` · ${student.Mobile}`   : ''}
            {student.District ? ` · ${student.District}` : ''}
          </p>
        </div>

        {/* History */}
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

        {/* Add comment */}
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
  const [search, setSearch]             = useState('');
  const [districtFilter, setDistrict]   = useState('');
  const [collegeFilter, setCollege]     = useState('');
  const [sort, setSort]                 = useState({ column: null, direction: 'asc' });
  const [modal, setModal]               = useState(null);

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
      if (prev.direction === 'asc')  return { column, direction: 'desc' };
      return { column: null, direction: 'asc' };
    });
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

  if (students.length === 0) {
    return <p className="text-center text-gray-500 py-12">No student records found.</p>;
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search across all fields…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={districtFilter}
          onChange={(e) => setDistrict(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={collegeFilter}
          onChange={(e) => setCollege(e.target.value)}
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
              {processed.map((student, idx) => (
                <tr key={student._rowIndex} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-400">{idx + 1}</td>
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
                  <td className="px-3 py-3">
                    <button
                      onClick={() => setModal(student)}
                      className="px-3 py-1 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors whitespace-nowrap"
                    >
                      View / Add Comment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
