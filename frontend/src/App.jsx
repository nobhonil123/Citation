import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { generateCitation } from './services/api'
import Header from './components/Header'
import Footer from './components/Footer'
import FileUpload from './components/FileUpload'
import MetadataCard from './components/MetadataCard'
import CitationCard from './components/CitationCard'
import MetadataForm from './components/MetadataForm'
import ReferenceList from './components/ReferenceList'
import ManualEntry from './components/ManualEntry'
import DOILookup from './components/DOILookup'

export default function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [uploadResult, setUploadResult] = useState(null)
  const [editingMetadata, setEditingMetadata] = useState(false)
  const [currentCitation, setCurrentCitation] = useState(null)
  const [currentBibtex, setCurrentBibtex] = useState(null)

  const handleUploadResult = (data) => {
    setUploadResult(data)
    setCurrentCitation(data.apa_citation)
    setCurrentBibtex(data.bibtex)
    setEditingMetadata(false)
  }

  const handleMetadataSubmit = async (updatedMetadata) => {
    try {
      const resp = await generateCitation(updatedMetadata)
      setCurrentCitation(resp.data.apa_citation)
      setCurrentBibtex(resp.data.bibtex)
      setUploadResult((prev) => ({ ...prev, metadata: updatedMetadata }))
      setEditingMetadata(false)
      toast.success('Citation regenerated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to regenerate citation.')
    }
  }

  const handleReset = () => {
    setUploadResult(null)
    setCurrentCitation(null)
    setCurrentBibtex(null)
    setEditingMetadata(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* ── Upload Tab ──────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {!uploadResult ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
                    Generate APA Citations Instantly
                  </h2>
                  <p className="text-gray-500">
                    Upload a research paper PDF and get an APA 7th edition citation in seconds.
                  </p>
                </div>
                <FileUpload onResult={handleUploadResult} />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1e3a5f]">Results</h2>
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg"
                  >
                    ← Upload Another
                  </button>
                </div>

                <MetadataCard metadata={uploadResult.metadata} />

                {editingMetadata ? (
                  <MetadataForm
                    metadata={uploadResult.metadata}
                    onSubmit={handleMetadataSubmit}
                    onCancel={() => setEditingMetadata(false)}
                  />
                ) : (
                  <CitationCard
                    citation={currentCitation}
                    bibtex={currentBibtex}
                    metadata={uploadResult.metadata}
                    onEditMetadata={() => setEditingMetadata(true)}
                  />
                )}

                <ReferenceList filename={uploadResult.filename} />
              </>
            )}
          </div>
        )}

        {/* ── Manual Entry Tab ────────────────────────────── */}
        {activeTab === 'manual' && <ManualEntry />}

        {/* ── DOI Lookup Tab ──────────────────────────────── */}
        {activeTab === 'doi' && <DOILookup />}
      </main>

      <Footer />
    </div>
  )
}
