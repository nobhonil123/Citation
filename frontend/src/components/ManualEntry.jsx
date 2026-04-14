import { useState } from 'react'
import toast from 'react-hot-toast'
import { generateCitation } from '../services/api.js'
import CitationCard from './CitationCard.jsx'

const SOURCE_TYPES = [
  { value: 'journal', label: 'Journal Article' },
  { value: 'book', label: 'Book' },
  { value: 'conference', label: 'Conference Paper' },
  { value: 'website', label: 'Website' },
]

const INITIAL_FORM = {
  title: '',
  authors: '',
  year: '',
  journal: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
  publisher: '',
  source_type: 'journal',
  conference: '',
  location: '',
  url: '',
  accessed_date: '',
}

export default function ManualEntry() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (e) => {
    setForm({ ...INITIAL_FORM, source_type: e.target.value })
    setResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        authors: form.authors
          ? form.authors.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
      }
      const { data } = await generateCitation(payload)
      setResult(data)
      toast.success('Citation generated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sourceType = form.source_type

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-primary mb-5">Manual Citation Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source Type *</label>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange({ target: { value: t.value } })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.source_type === t.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Common fields */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required className="input-field" placeholder="Enter the full title" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Authors (comma-separated, Last, F. M. format)
              </label>
              <input
                name="authors"
                value={form.authors}
                onChange={handleChange}
                className="input-field"
                placeholder="Smith, J. A., Jones, B. C., Williams, R."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <input name="year" value={form.year} onChange={handleChange} className="input-field" placeholder="2024" maxLength={4} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">DOI</label>
              <input name="doi" value={form.doi} onChange={handleChange} className="input-field" placeholder="10.xxxx/xxxxx" />
            </div>

            {/* Journal-specific */}
            {sourceType === 'journal' && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Journal Name</label>
                  <input name="journal" value={form.journal} onChange={handleChange} className="input-field" placeholder="Nature, JAMA, etc." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Volume</label>
                  <input name="volume" value={form.volume} onChange={handleChange} className="input-field" placeholder="42" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Issue</label>
                  <input name="issue" value={form.issue} onChange={handleChange} className="input-field" placeholder="3" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pages</label>
                  <input name="pages" value={form.pages} onChange={handleChange} className="input-field" placeholder="100–115" />
                </div>
              </>
            )}

            {/* Book-specific */}
            {sourceType === 'book' && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Publisher</label>
                <input name="publisher" value={form.publisher} onChange={handleChange} className="input-field" placeholder="Oxford University Press" />
              </div>
            )}

            {/* Conference-specific */}
            {sourceType === 'conference' && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Conference Name</label>
                  <input name="conference" value={form.conference} onChange={handleChange} className="input-field" placeholder="Proceedings of the International Conference on…" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="Chicago, IL, USA" />
                </div>
              </>
            )}

            {/* Website-specific */}
            {sourceType === 'website' && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input name="url" value={form.url} onChange={handleChange} className="input-field" placeholder="https://example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Site / Publisher</label>
                  <input name="publisher" value={form.publisher} onChange={handleChange} className="input-field" placeholder="BBC News, CDC, etc." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Retrieved Date</label>
                  <input name="accessed_date" value={form.accessed_date} onChange={handleChange} className="input-field" placeholder="January 15, 2024" />
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? '⏳ Generating…' : '✨ Generate Citation'}
          </button>
        </form>
      </div>

      {result && (
        <CitationCard
          citation={result.citation}
          bibtex={result.bibtex}
          metadata={result.metadata}
        />
      )}
    </div>
  )
}
