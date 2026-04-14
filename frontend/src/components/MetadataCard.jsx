import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function MetadataCard({ metadata }) {
  const [expanded, setExpanded] = useState(false)
  const abstract = metadata?.abstract || ''
  const truncated = abstract.length > 300 ? abstract.slice(0, 300) + '…' : abstract
  const authors = Array.isArray(metadata?.authors) ? metadata.authors : []

  const fields = [
    { label: 'Title', value: metadata?.title },
    { label: 'Authors', value: authors.join('; ') },
    { label: 'Year', value: metadata?.year },
    { label: 'Journal', value: metadata?.journal },
    { label: 'Volume', value: metadata?.volume },
    { label: 'Issue', value: metadata?.issue },
    { label: 'Pages', value: metadata?.pages },
    { label: 'Publisher', value: metadata?.publisher },
    {
      label: 'DOI',
      value: metadata?.doi
        ? { text: metadata.doi, href: `https://doi.org/${metadata.doi}` }
        : null,
    },
  ].filter((f) => f.value)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-2">
        <span>📋</span>
        <h3 className="font-semibold text-gray-700 text-sm">Extracted Metadata</h3>
      </div>
      <div className="p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(({ label, value }) => (
            <div key={label} className={label === 'Title' ? 'sm:col-span-2' : ''}>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
              <dd className="text-sm text-gray-800 mt-0.5">
                {value && typeof value === 'object' && value.href ? (
                  <a
                    href={value.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {value.text}
                  </a>
                ) : (
                  <span className={label === 'Title' ? 'font-medium' : ''}>{value}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {abstract && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Abstract</dt>
            <dd className="text-sm text-gray-700 leading-relaxed">
              {expanded ? abstract : truncated}
              {abstract.length > 300 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="ml-1 text-blue-600 hover:underline text-xs"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </dd>
          </div>
        )}
      </div>
    </div>
  )
}
