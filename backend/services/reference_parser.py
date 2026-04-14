"""
Reference Parser Service
Identifies and parses the references/bibliography section from a paper's text.
"""

import re
from typing import List, Optional
from .metadata_extractor import lookup_by_doi, search_by_title, _clean_doi


def parse_references(text: str, enrich: bool = False) -> List[dict]:
    """
    Parse individual references from the text.
    Returns a list of dicts with 'raw', 'authors', 'year', 'title', 'source', 'doi'.
    If enrich=True, attempts CrossRef lookup for each reference.
    """
    # Find the references section
    ref_text = _find_references_section(text)
    if not ref_text:
        return []

    # Split into individual references
    raw_refs = _split_references(ref_text)

    parsed = []
    for raw in raw_refs:
        if len(raw.strip()) < 10:
            continue
        ref_data = _parse_single_reference(raw)
        if enrich and ref_data.get("doi"):
            enriched = lookup_by_doi(ref_data["doi"])
            if enriched:
                ref_data.update(enriched)
        elif enrich and ref_data.get("title"):
            enriched = search_by_title(ref_data["title"])
            if enriched:
                ref_data.update({k: v for k, v in enriched.items() if v and not ref_data.get(k)})
        parsed.append(ref_data)

    return parsed


def _find_references_section(text: str) -> Optional[str]:
    """Find the references/bibliography section."""
    pattern = re.compile(
        r"(?:^|\n)\s*(?:references|bibliography|works cited|reference list)\s*\n",
        re.IGNORECASE,
    )
    match = pattern.search(text)
    if match:
        return text[match.end():]

    # Fallback: last 30%
    last_chunk = text[int(len(text) * 0.70):]
    numbered = re.search(r"\[1\]|\b1\.\s+[A-Z]", last_chunk)
    if numbered:
        return last_chunk[numbered.start():]

    return None


def _split_references(ref_text: str) -> List[str]:
    """Split the references text into individual reference strings."""
    # Try IEEE-style: [1] Author...
    ieee_pattern = re.compile(r"\[\d+\]\s+")
    if ieee_pattern.search(ref_text):
        parts = ieee_pattern.split(ref_text)
        return [p.strip() for p in parts if p.strip()]

    # Try numbered: 1. Author...
    numbered_pattern = re.compile(r"(?:^|\n)\s*\d+\.\s+", re.MULTILINE)
    if numbered_pattern.search(ref_text):
        parts = numbered_pattern.split(ref_text)
        return [p.strip() for p in parts if p.strip()]

    # Try APA-style: hanging indent (author starts at margin, continuation indented)
    # Split by blank lines or lines that start with an author pattern
    author_start = re.compile(
        r"\n(?=[A-Z][a-z]+,\s+[A-Z]\.)", re.MULTILINE
    )
    parts = author_start.split(ref_text)
    if len(parts) > 1:
        return [p.strip() for p in parts if p.strip()]

    # Last resort: split by double newline
    parts = re.split(r"\n\s*\n", ref_text)
    return [p.strip() for p in parts if p.strip()]


def _parse_single_reference(raw: str) -> dict:
    """
    Parse a single raw reference string into structured fields.
    Handles common formats: APA, IEEE, numbered.
    """
    # Normalize whitespace
    ref = re.sub(r"\s+", " ", raw).strip()

    result = {
        "raw": ref,
        "authors": [],
        "year": None,
        "title": None,
        "source": None,
        "doi": None,
        "source_type": "journal_article",
    }

    # --- DOI ---
    doi_match = re.search(
        r"(?:doi[:\s]*|https?://doi\.org/)(10\.\d{4,9}/[^\s\"'<>]+)",
        ref,
        re.I,
    )
    if doi_match:
        result["doi"] = _clean_doi(doi_match.group(1))

    # --- Year ---
    year_match = re.search(r"\((\d{4})\)", ref)
    if year_match:
        result["year"] = year_match.group(1)
    else:
        year_match = re.search(r"\b(19[5-9]\d|20[0-2]\d)\b", ref)
        if year_match:
            result["year"] = year_match.group(1)

    # --- Authors ---
    # APA style: "Last, F. M., & Last, F. M. (year)"
    author_section = re.split(r"\(\d{4}\)", ref)[0]
    if author_section:
        # Remove IEEE [1] prefix
        author_section = re.sub(r"^\[\d+\]\s*", "", author_section).strip()
        if len(author_section) > 3:
            raw_authors = re.split(r",\s*&\s*|,\s*and\s+", author_section)
            authors = []
            for a in raw_authors:
                a = a.strip().rstrip(",").strip()
                if a and len(a) > 2:
                    authors.append(a)
            result["authors"] = authors[:20]

    # --- Title ---
    # After authors/year, title is often quoted or follows the year
    title_match = re.search(r'\((\d{4})\)[.,]?\s+"?([^"\.]+)"?', ref)
    if title_match:
        result["title"] = title_match.group(2).strip().strip('"').strip()

    # --- Source/Journal ---
    # Look for italicized text (in many PDFs, journals are in ALL CAPS or follow the title)
    if result["title"]:
        after_title = ref[ref.find(result["title"]) + len(result["title"]):]
        source_match = re.search(r"[.,]\s*([A-Z][^,\d]+?)(?:,|\d|\.|$)", after_title)
        if source_match:
            result["source"] = source_match.group(1).strip()

    # Conference detection
    if re.search(r"proceedings|conference|workshop|symposium", ref, re.I):
        result["source_type"] = "conference_paper"

    return result
