import React, { useState } from 'react'

const FIELD_CONFIG = [
  { key: 'title', label: 'Title', type: 'text', full: true },
  { key: 'authors', label: 'Authors (one per line)', type: 'textarea', full: true },
  { key: 'year', label: 'Year', type: 'text' },
  { key: 'journal', label: 'Journal / Conference', type: 'text' },
  { key: 'volume', label: 'Volume', type: 'text' },
  { key: 'issue', label: 'Issue', type: 'text' },
  { key: 'pages', label: 'Pages', type: 'text' },
  { key: 'doi', label: 'DOI', type: 'text' },
  { key: 'publisher', label: 'Publisher', type: 'text' },
  {
    key: 'source_type',
    label: 'Source Type',
    type: 'select',
    options: [
      { value: 'journal_article', label: 'Journal Article' },
      { value: 'book', label: 'Book' },
      { value: 'book_chapter', label: 'Book Chapter' },
      { value: 'conference_paper', label: 'Conference Paper' },
      { value: 'web', label: 'Website' },
    ],
  },
]

export default function MetadataForm({ metadata, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...metadata,
    authors: Array.isArray(metadata?.authors)
      ? metadata.authors.join('\n')
      : metadata?.authors || '',
  }))

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const output = { ...form }
    // Convert authors back to array
    output.authors = output.authors
      ? output.authors.split('\n').map((a) => a.trim()).filter(Boolean)
      : []
    onSubmit(output)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2">
        <span>✏️</span>
        <h3 className="font-semibold text-amber-800 text-sm">Edit Metadata & Regenerate</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELD_CONFIG.map(({ key, label, type, full, options }) => (
            <div key={key} className={full ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  value={form[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              ) : type === 'select' ? (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2a5298] transition-colors"
          >
            🔄 Regenerate Citation
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
