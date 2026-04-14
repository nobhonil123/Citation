import React from 'react'

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'upload', label: '📄 Upload PDF' },
    { id: 'manual', label: '✏️ Manual Entry' },
    { id: 'doi', label: '🔗 DOI Lookup' },
  ]

  return (
    <header className="bg-[#1e3a5f] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📚</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Citation Generator</h1>
            <p className="text-blue-200 text-xs">APA 7th Edition • Academic Writing Assistant</p>
          </div>
        </div>
        <nav className="flex gap-1 bg-[#152d4a] rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-[#1e3a5f]'
                  : 'text-blue-200 hover:text-white hover:bg-[#1e3a5f]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
