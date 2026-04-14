"""
Intelligent Citation Generator — FastAPI Backend
"""

import os
import uuid
import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from services.pdf_parser import extract_text_from_pdf, extract_metadata_from_pdf
from services.metadata_extractor import enrich_metadata, lookup_by_doi
from services.citation_formatter import format_apa, format_bibtex
from services.reference_parser import parse_references

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Citation Generator API",
    description="Intelligent APA-style citation generator for academic papers.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# ─── Models ────────────────────────────────────────────────────────────────────


class MetadataInput(BaseModel):
    title: Optional[str] = None
    authors: Optional[List[str]] = []
    year: Optional[str] = None
    journal: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    doi: Optional[str] = None
    publisher: Optional[str] = None
    abstract: Optional[str] = None
    source_type: Optional[str] = "journal_article"
    url: Optional[str] = None


class DOIRequest(BaseModel):
    doi: str


# ─── Endpoints ─────────────────────────────────────────────────────────────────


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Citation Generator API"}


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF, extract metadata, and generate an APA citation.
    Returns extracted metadata, APA citation, and BibTeX.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20MB limit.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Save to disk for later reference parsing
    filename = f"{uuid.uuid4().hex}.pdf"
    filepath = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(file_bytes)

    # Extract and enrich metadata
    try:
        raw_metadata = extract_metadata_from_pdf(file_bytes)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {exc}")

    try:
        metadata = enrich_metadata(raw_metadata)
    except Exception:
        metadata = raw_metadata  # fall back to raw

    apa_citation = format_apa(metadata)
    bibtex = format_bibtex(metadata)

    return {
        "filename": filename,
        "metadata": metadata,
        "apa_citation": apa_citation,
        "bibtex": bibtex,
    }


@app.post("/api/generate-citation")
async def generate_citation(metadata_input: MetadataInput):
    """
    Accept manually entered metadata and return an APA citation + BibTeX.
    """
    metadata = metadata_input.model_dump(exclude_none=True)
    if not metadata.get("title") and not metadata.get("authors"):
        raise HTTPException(
            status_code=400, detail="At least a title or authors must be provided."
        )

    apa_citation = format_apa(metadata)
    bibtex = format_bibtex(metadata)

    return {
        "metadata": metadata,
        "apa_citation": apa_citation,
        "bibtex": bibtex,
    }


@app.post("/api/parse-references/{filename}")
async def parse_paper_references(filename: str):
    """
    Parse the references/bibliography section from a previously uploaded PDF.
    Returns a list of parsed references with APA citations.
    """
    # Sanitize filename
    if not filename.replace("-", "").replace("_", "").replace(".", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid filename.")

    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found. Please upload again.")

    async with aiofiles.open(filepath, "rb") as f:
        file_bytes = await f.read()

    try:
        full_text = extract_text_from_pdf(file_bytes)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to extract text: {exc}")

    references = parse_references(full_text, enrich=False)

    results = []
    for ref in references:
        # Build metadata for citation formatting
        ref_meta = {
            "title": ref.get("title"),
            "authors": ref.get("authors", []),
            "year": ref.get("year"),
            "journal": ref.get("source"),
            "doi": ref.get("doi"),
            "source_type": ref.get("source_type", "journal_article"),
        }
        apa = format_apa(ref_meta)
        results.append({
            "raw": ref.get("raw", ""),
            "metadata": ref_meta,
            "apa_citation": apa,
        })

    return {"references": results, "count": len(results)}


@app.post("/api/lookup-doi")
async def lookup_doi_endpoint(request: DOIRequest):
    """
    Look up metadata from CrossRef by DOI and return an APA citation.
    """
    doi = request.doi.strip()
    if not doi:
        raise HTTPException(status_code=400, detail="DOI must not be empty.")

    metadata = lookup_by_doi(doi)
    if not metadata:
        raise HTTPException(
            status_code=404,
            detail="Could not find metadata for the provided DOI. Please check and try again.",
        )

    apa_citation = format_apa(metadata)
    bibtex = format_bibtex(metadata)

    return {
        "doi": doi,
        "metadata": metadata,
        "apa_citation": apa_citation,
        "bibtex": bibtex,
    }
