// Client component — renders the student data table with search and inline Comments editing
'use client';

import { useState } from 'react';

const DISPLAY_COLUMNS = [
  { key: 'District', label: 'District' },
  { key: 'Student_Name', label: 'Student Name' },
  { key: 'Father_Name', label: 'Father Name' },
  { key: 'Mobile', label: 'Mobile' },
  { key: 'Group', label: 'Group' },
  { key: 'College_Name', label: 'College' },
  { key: 'Remarks', label: 'Remarks' },
  { key: 'Date_time', label: 'Date/Time' },
];

export default function StudentTable({ students, onCommentSave }) {
  const [search, setSearch] = useState('');
  const [comments, setComments] = useState(
    () => Object.fromEntries(students.map((s) => [s._rowIndex, s.Comments]))
  );
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [errors, setErrors] = useState({});

  const filtered = students.filter((s) =>
    Object.values(s).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  async function handleSave(rowIndex) {
    setSaving((prev) => ({ ...prev, [rowIndex]: true }));
    setErrors((prev) => ({ ...prev, [rowIndex]: null }));
    try {
      await onCommentSave(rowIndex, comments[rowIndex] ?? '');
      setSaved((prev) => ({ ...prev, [rowIndex]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [rowIndex]: false })), 2000);
    } catch {
      setErrors((prev) => ({ ...prev, [rowIndex]: 'Save failed. Try again.' }));
    } finally {
      setSaving((prev) => ({ ...prev, [rowIndex]: false }));
    }
  }

  if (students.length === 0) {
    return <p className="text-center text-gray-500 py-12">No student records found.</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search across all fields…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <p className="text-xs text-gray-500 mt-1">
            {filtered.length} of {students.length} records
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No records match your search.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-3 py-3 text-left font-medium">#</th>
                {DISPLAY_COLUMNS.map((col) => (
                  <th key={col.key} className="px-3 py-3 text-left font-medium whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-left font-medium">Comments</th>
                <th className="px-3 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((student, idx) => (
                <tr key={student._rowIndex} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-400">{idx + 1}</td>
                  {DISPLAY_COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-3 text-gray-700 whitespace-nowrap max-w-[180px] truncate">
                      {student[col.key] || <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="px-3 py-3 min-w-[200px]">
                    <input
                      type="text"
                      value={comments[student._rowIndex] ?? ''}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [student._rowIndex]: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Add comment…"
                    />
                    {errors[student._rowIndex] && (
                      <p className="text-red-500 text-xs mt-1">{errors[student._rowIndex]}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleSave(student._rowIndex)}
                      disabled={saving[student._rowIndex]}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        saved[student._rowIndex]
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {saving[student._rowIndex]
                        ? 'Saving…'
                        : saved[student._rowIndex]
                        ? 'Saved!'
                        : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
