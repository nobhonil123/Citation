import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { uploadPDF } from '../services/api'

export default function FileUpload({ onResult }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (!file) return

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Only PDF files are supported.')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File exceeds 20MB limit.')
        return
      }

      setUploading(true)
      setProgress(0)

      try {
        const resp = await uploadPDF(file, (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded * 100) / evt.total))
          }
        })
        toast.success('PDF processed successfully!')
        onResult(resp.data)
      } catch (err) {
        const msg =
          err.response?.data?.detail || 'Failed to process PDF. Please try again.'
        toast.error(msg)
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [onResult]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'}
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <span className="text-6xl">{uploading ? '⏳' : isDragActive ? '📂' : '📄'}</span>
          {uploading ? (
            <div className="w-full max-w-xs">
              <p className="text-gray-600 mb-2 text-sm">Processing your PDF…</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {isDragActive ? 'Drop your PDF here' : 'Drag & drop your research paper here'}
                </p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </div>
              <button
                type="button"
                className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2a5298] transition-colors"
              >
                Upload Research Paper
              </button>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>📋 PDF only</span>
                <span>📦 Max 20MB</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
