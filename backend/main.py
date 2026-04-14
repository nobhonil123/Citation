import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.pdf_parser import PDFParser
from services.metadata_extractor import MetadataExtractor
from services.citation_formatter import CitationFormatter
from services.reference_parser import ReferenceParser

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Citation Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pdf_parser = PDFParser()
metadata_extractor = MetadataExtractor()
citation_formatter = CitationFormatter()
reference_parser = ReferenceParser()


class MetadataRequest(BaseModel):
    title: Optional[str] = None
    authors: Optional[list[str]] = None
    year: Optional[str] = None
    journal: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    doi: Optional[str] = None
    publisher: Optional[str] = None
    source_type: Optional[str] = "journal"
    conference: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    accessed_date: Optional[str] = None


class DOIRequest(BaseModel):
    doi: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Citation Generator API is running"}


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 20MB limit")

    safe_name = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    file_path = UPLOAD_DIR / safe_name

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        raw_metadata = pdf_parser.extract_metadata(str(file_path))
        enriched_metadata = metadata_extractor.enrich_metadata(raw_metadata)
        citation = citation_formatter.format_apa(enriched_metadata)
        bibtex = citation_formatter.format_bibtex(enriched_metadata)

        return {
            "filename": safe_name,
            "original_filename": file.filename,
            "metadata": enriched_metadata,
            "citation": citation,
            "bibtex": bibtex,
        }
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")


@app.post("/api/generate-citation")
async def generate_citation(request: MetadataRequest):
    try:
        metadata = request.model_dump(exclude_none=False)
        citation = citation_formatter.format_apa(metadata)
        bibtex = citation_formatter.format_bibtex(metadata)
        return {"citation": citation, "bibtex": bibtex, "metadata": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate citation: {str(e)}")


@app.post("/api/parse-references/{filename}")
async def parse_references(filename: str):
    # Prevent path traversal by resolving and confirming the path stays within UPLOAD_DIR
    safe_filename = Path(filename).name
    file_path = (UPLOAD_DIR / safe_filename).resolve()
    upload_dir_resolved = UPLOAD_DIR.resolve()
    if not str(file_path).startswith(str(upload_dir_resolved) + "/"):
        raise HTTPException(status_code=400, detail="Invalid filename")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        references = reference_parser.parse_references(str(file_path))
        enriched = []
        for ref in references:
            meta = metadata_extractor.enrich_metadata(ref)
            citation = citation_formatter.format_apa(meta)
            enriched.append({"raw": ref.get("raw", ""), "metadata": meta, "citation": citation})
        return {"references": enriched, "count": len(enriched)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse references: {str(e)}")


@app.post("/api/lookup-doi")
async def lookup_doi(request: DOIRequest):
    if not request.doi or not request.doi.strip():
        raise HTTPException(status_code=400, detail="DOI is required")
    try:
        metadata = metadata_extractor.lookup_by_doi(request.doi.strip())
        if not metadata:
            raise HTTPException(status_code=404, detail="No metadata found for this DOI")
        citation = citation_formatter.format_apa(metadata)
        bibtex = citation_formatter.format_bibtex(metadata)
        return {"metadata": metadata, "citation": citation, "bibtex": bibtex}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOI lookup failed: {str(e)}")
