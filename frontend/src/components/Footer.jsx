import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-[#1e3a5f] text-blue-200 mt-12 py-6">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm">
          Built with ❤️ for researchers · Citation Generator · APA 7th Edition
        </p>
        <p className="text-xs mt-1 text-blue-300">
          Powered by CrossRef API · React + Vite + FastAPI
        </p>
        <a
          href="https://github.com/nobhonil123/Citation"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-300 hover:text-white mt-1 inline-block underline"
        >
          GitHub Repository
        </a>
      </div>
    </footer>
  )
}
