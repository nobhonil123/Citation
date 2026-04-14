"""
Metadata Extractor Service
Enriches metadata using the CrossRef API and normalizes author names, dates, DOIs.
"""

import re
import requests
from typing import Optional


CROSSREF_API = "https://api.crossref.org/works"
TIMEOUT = 10  # seconds


def lookup_by_doi(doi: str) -> Optional[dict]:
    """
    Look up metadata from CrossRef using a DOI.
    Returns normalized metadata dict or None on failure.
    """
    doi = _clean_doi(doi)
    if not doi:
        return None

    try:
        url = f"{CROSSREF_API}/{doi}"
        resp = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": "CitationGenerator/1.0"})
        if resp.status_code == 200:
            data = resp.json().get("message", {})
            return _normalize_crossref_data(data)
    except Exception:
        pass

    return None


def search_by_title(title: str) -> Optional[dict]:
    """
    Search CrossRef by title and return the best-matching metadata.
    Returns normalized metadata dict or None on failure.
    """
    if not title:
        return None

    try:
        params = {
            "query.title": title,
            "rows": 1,
            "select": "DOI,title,author,issued,container-title,volume,issue,page,publisher,type,abstract",
        }
        resp = requests.get(
            CROSSREF_API,
            params=params,
            timeout=TIMEOUT,
            headers={"User-Agent": "CitationGenerator/1.0"},
        )
        if resp.status_code == 200:
            items = resp.json().get("message", {}).get("items", [])
            if items:
                return _normalize_crossref_data(items[0])
    except Exception:
        pass

    return None


def enrich_metadata(pdf_metadata: dict) -> dict:
    """
    Enrich PDF-extracted metadata with CrossRef data.
    Falls back to original PDF metadata if CrossRef lookup fails.
    """
    crossref_data = None

    # Try DOI lookup first (most precise)
    if pdf_metadata.get("doi"):
        crossref_data = lookup_by_doi(pdf_metadata["doi"])

    # Fall back to title search
    if crossref_data is None and pdf_metadata.get("title"):
        crossref_data = search_by_title(pdf_metadata["title"])

    if crossref_data is None:
        return pdf_metadata

    # Merge: CrossRef data takes priority, but fall back to PDF data for missing fields
    merged = dict(pdf_metadata)
    for key, value in crossref_data.items():
        if value:
            merged[key] = value

    return merged


def _normalize_crossref_data(data: dict) -> dict:
    """Convert a CrossRef API response item into our standard metadata format."""
    metadata = {}

    # Title
    titles = data.get("title", [])
    if titles:
        metadata["title"] = titles[0]

    # Authors
    authors_raw = data.get("author", [])
    authors = []
    for a in authors_raw:
        family = a.get("family", "")
        given = a.get("given", "")
        if family and given:
            authors.append(f"{family}, {given}")
        elif family:
            authors.append(family)
    metadata["authors"] = authors

    # Year
    issued = data.get("issued", {})
    date_parts = issued.get("date-parts", [[]])
    if date_parts and date_parts[0]:
        metadata["year"] = str(date_parts[0][0])

    # Journal / Container title
    container = data.get("container-title", [])
    if container:
        metadata["journal"] = container[0]

    # Volume, Issue, Pages
    metadata["volume"] = data.get("volume")
    metadata["issue"] = data.get("issue")
    metadata["pages"] = data.get("page")

    # DOI
    doi = data.get("DOI")
    if doi:
        metadata["doi"] = _clean_doi(doi)

    # Publisher
    metadata["publisher"] = data.get("publisher")

    # Abstract
    abstract = data.get("abstract", "")
    if abstract:
        # Strip JATS XML tags if present
        abstract = re.sub(r"<[^>]+>", "", abstract).strip()
        metadata["abstract"] = abstract[:1500]

    # Source type mapping
    crossref_type = data.get("type", "")
    metadata["source_type"] = _map_type(crossref_type)

    return {k: v for k, v in metadata.items() if v is not None}


def _map_type(crossref_type: str) -> str:
    """Map CrossRef type to our internal type."""
    mapping = {
        "journal-article": "journal_article",
        "proceedings-article": "conference_paper",
        "book": "book",
        "book-chapter": "book_chapter",
        "posted-content": "web",
        "report": "report",
        "dataset": "dataset",
    }
    return mapping.get(crossref_type, "journal_article")


def _clean_doi(doi: str) -> str:
    """Clean and normalize a DOI string."""
    if not doi:
        return ""
    # Remove URL prefix
    doi = re.sub(r"^https?://doi\.org/", "", doi, flags=re.I)
    doi = re.sub(r"^doi:\s*", "", doi, flags=re.I)
    return doi.strip().rstrip(".,;)")
