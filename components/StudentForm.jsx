// Client component — form to append a new student row to the sheet
'use client';

import { useState } from 'react';

const FIELDS = [
  { key: 'District', label: 'District' },
  { key: 'Student_Name', label: 'Student Name', required: true },
  { key: 'Father_Name', label: 'Father Name' },
  { key: 'Mobile', label: 'Mobile', required: true },
  { key: 'Group', label: 'Group' },
  { key: 'College_Name', label: 'College Name' },
  { key: 'Remarks', label: 'Remarks' },
  { key: 'Date_time', label: 'Date / Time' },
  { key: 'Comments', label: 'Comments' },
];

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.key, '']));

export default function StudentForm({ onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add student');
      setForm(EMPTY);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {open ? 'Cancel' : '+ Add Student'}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={form[field.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                required={field.required}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          ))}

          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Adding…' : 'Add Student'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
