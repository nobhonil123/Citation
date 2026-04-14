# 📖 Citation Generator — Intelligent Academic Citation Tool

An AI-powered citation generator for academic writing that extracts metadata from PDFs, looks up DOIs via CrossRef, and formats citations in **APA 7th Edition** style. Supports export as plain text and BibTeX.

---

## ✨ Features

- **PDF Upload** — Drag-and-drop PDF parsing with automatic metadata extraction (title, authors, year, journal, DOI)
- **DOI Lookup** — Fetch complete metadata from [CrossRef API](https://api.crossref.org/) using a DOI
- **Manual Entry** — Enter metadata by hand for Journal Articles, Books, Conference Papers, and Websites
- **APA 7th Edition** — Fully compliant citations including italic formatting, author count rules, and DOI links
- **BibTeX Export** — Download or copy BibTeX entries for LaTeX workflows
- **Reference Parsing** — Extract and format the reference list from an uploaded PDF
- **Copy to Clipboard** — One-click copy for citations and BibTeX

---

## 🛠 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 (Vite) + Tailwind CSS          |
| Backend   | Python FastAPI + Uvicorn                |
| PDF Parse | pdfplumber + PyPDF2                     |
| Metadata  | CrossRef REST API                       |
| Export    | Plain text, BibTeX, Clipboard API       |
| Container | Docker + docker-compose                 |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- (Optional) Docker & docker-compose

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Docker (all-in-one)

```bash
docker-compose up --build
```

Backend → http://localhost:8000 · Frontend → http://localhost:80

---

## 📡 API Reference

| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/api/health`                     | Health check                             |
| POST   | `/api/upload`                     | Upload PDF; returns metadata + citation  |
| POST   | `/api/generate-citation`          | Generate citation from metadata fields   |
| POST   | `/api/parse-references/{filename}`| Extract reference list from uploaded PDF |
| POST   | `/api/lookup-doi`                 | Look up DOI via CrossRef; return citation|

### Example: Generate Citation

```json
POST /api/generate-citation
{
  "title": "Attention Is All You Need",
  "authors": ["Vaswani, A.", "Shazeer, N."],
  "year": "2017",
  "journal": "Advances in Neural Information Processing Systems",
  "volume": "30",
  "doi": "10.48550/arXiv.1706.03762",
  "source_type": "journal"
}
```

---

## 📐 APA 7th Edition Rules Implemented

| Scenario           | Format |
|--------------------|--------|
| 1 author           | `Author, A. A. (Year). Title. *Journal*, *vol*(issue), pages. https://doi.org/…` |
| 2 authors          | `Author, A., & Author, B. (Year). …` |
| 3–20 authors       | All listed, `&` before last |
| 21+ authors        | First 19, `. . .`, last author |
| No author          | `Anonymous` |
| No date            | `(n.d.)` |
| Book               | `Author (Year). *Title*. Publisher.` |
| Conference         | `Author (Year). *Title*. Conference Name, Location.` |
| Website            | `Author (Year). Title. Site. Retrieved date, from URL` |

---

## 🗂 Project Structure

```
Citation/
├── backend/
│   ├── main.py                     # FastAPI application
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── uploads/                    # Uploaded PDFs (auto-created)
│   └── services/
│       ├── __init__.py
│       ├── pdf_parser.py           # PDF text + metadata extraction
│       ├── metadata_extractor.py   # CrossRef API enrichment
│       ├── citation_formatter.py   # APA 7th + BibTeX formatting
│       └── reference_parser.py     # Reference list extraction
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── services/
│       │   └── api.js              # Axios API service
│       └── components/
│           ├── Header.jsx
│           ├── Footer.jsx
│           ├── FileUpload.jsx      # Drag-and-drop upload
│           ├── CitationCard.jsx    # Citation display + export
│           ├── MetadataForm.jsx    # Editable metadata form
│           ├── ReferenceList.jsx   # Extracted references list
│           ├── ManualEntry.jsx     # Manual citation entry
│           └── DOILookup.jsx       # DOI search
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

---

## 📄 License

MIT © 2024 [nobhonil123](https://github.com/nobhonil123)
