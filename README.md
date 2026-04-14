# 📚 Intelligent Citation Generator for Academic Writing

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![React](https://img.shields.io/badge/react-18-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)

A **production-ready full-stack web application** that allows researchers to upload a PDF research paper and automatically generates **APA 7th Edition citations** — enriched with CrossRef metadata, with BibTeX export and manual entry support.

---

## ✨ Features

- 📄 **PDF Upload & Parsing** — Drag-and-drop or click to upload research papers (up to 20MB)
- 🔍 **Intelligent Metadata Extraction** — Automatically extracts title, authors, year, journal, DOI, abstract, volume, issue, pages
- 🌐 **CrossRef API Integration** — Enriches metadata via live DOI/title lookup
- 📝 **APA 7th Edition Formatting** — Properly formatted citations for journal articles, books, conference papers, websites
- 📚 **Reference List Parsing** — Extracts and formats all references from the bibliography section
- ✏️ **Manual Entry Mode** — Enter citation details manually for any source type
- 🔗 **DOI Lookup** — Paste a DOI to instantly generate a citation
- 📋 **Copy to Clipboard** — One-click copy with toast notifications
- 📥 **BibTeX Export** — Download `.bib` files for reference managers
- ✏️ **Editable Metadata** — Correct extracted fields and regenerate citations
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🐳 **Docker Support** — One-command deployment with Docker Compose

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS 4 |
| **Backend** | Python 3.11 + FastAPI |
| **PDF Parsing** | pdfplumber + PyPDF2 |
| **External APIs** | CrossRef API (free, no auth required) |
| **Citation Style** | APA 7th Edition |
| **Export Formats** | Plain text, BibTeX (.bib), Copy to clipboard |
| **Deployment** | Docker + Docker Compose |

---

## 📂 Project Structure

```
Citation/
├── README.md
├── LICENSE
├── .gitignore
├── docker-compose.yml
│
├── backend/
│   ├── Dockerfile
│   ├── main.py                    # FastAPI app + all API endpoints
│   ├── requirements.txt
│   └── services/
│       ├── __init__.py
│       ├── pdf_parser.py          # PDF text & metadata extraction
│       ├── metadata_extractor.py  # CrossRef API integration
│       ├── citation_formatter.py  # APA 7th Edition + BibTeX
│       └── reference_parser.py   # Bibliography section parser
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx                # Main app with tab navigation
        ├── main.jsx               # React entry point
        ├── index.css              # Tailwind + global styles
        ├── services/
        │   └── api.js             # Axios API service
        └── components/
            ├── Header.jsx
            ├── Footer.jsx
            ├── FileUpload.jsx     # Drag-and-drop PDF upload
            ├── CitationCard.jsx   # Citation display + copy/export
            ├── MetadataCard.jsx   # Extracted metadata display
            ├── MetadataForm.jsx   # Editable metadata fields
            ├── ReferenceList.jsx  # Parsed references list
            ├── ManualEntry.jsx    # Manual citation form
            └── DOILookup.jsx      # DOI lookup & generate
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **npm** or **yarn**

### Option A — Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/nobhonil123/Citation.git
cd Citation

# Start both services
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option B — Run Locally

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
The Vite dev server proxies `/api/*` requests to `http://localhost:8000`.

---

## 📡 API Documentation

Interactive docs available at: `http://localhost:8000/docs`

### Endpoints

#### `GET /api/health`
Health check.

**Response:**
```json
{ "status": "ok", "service": "Citation Generator API" }
```

#### `POST /api/upload`
Upload a PDF and get metadata + APA citation.

**Request:** `multipart/form-data` with field `file` (PDF)

#### `POST /api/generate-citation`
Generate a citation from manually entered metadata.

#### `POST /api/parse-references/{filename}`
Parse the bibliography section of an uploaded PDF.

#### `POST /api/lookup-doi`
Look up a DOI and generate a citation.

---

## 📝 APA 7th Edition Format Rules

| Source Type | Format |
|---|---|
| Journal Article | Author, A. A., & Author, B. B. (Year). Title of article. *Journal Name*, *volume*(issue), pages. https://doi.org/xxxx |
| Book | Author, A. A. (Year). *Title of work: Subtitle*. Publisher. https://doi.org/xxxx |
| Conference Paper | Author, A. A. (Year). Title of paper. *Name of Conference*. |
| Book Chapter | Author, A. A. (Year). Title of chapter. In *Book Title* (pp. xx–xx). Publisher. |
| Website | Author, A. A. (Year). Title. *Site Name*. URL |

**Author rules:**
- 1 author: `Smith, J.`
- 2 authors: `Smith, J., & Jones, A.`
- 3–20 authors: list all, last preceded by `&`
- 21+ authors: first 19, then `. . .`, then last author

---

## 📄 License

MIT © 2024 nobhonil123
