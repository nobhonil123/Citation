"""
PDF Parser Service
Extracts text and metadata from uploaded PDF files using pdfplumber.
"""

import re
import io
from typing import Optional
import pdfplumber


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract full text from a PDF file."""
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_metadata_from_pdf(file_bytes: bytes) -> dict:
    """
    Extract metadata from a PDF file.
    Uses heuristics on the first page to identify title, authors, year, journal, etc.
    """
    full_text = extract_text_from_pdf(file_bytes)
    lines = [line.strip() for line in full_text.split("\n") if line.strip()]

    metadata = {
        "title": None,
        "authors": [],
        "year": None,
        "journal": None,
        "volume": None,
        "issue": None,
        "pages": None,
        "doi": None,
        "abstract": None,
        "publisher": None,
        "source_type": "journal_article",
    }

    # Also try pdfplumber's built-in metadata
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        pdf_meta = pdf.metadata or {}

    # --- DOI extraction ---
    doi_pattern = re.compile(
        r"(?:doi[:\s]*|https?://doi\.org/)(10\.\d{4,9}/[^\s\"'<>]+)",
        re.IGNORECASE,
    )
    doi_match = doi_pattern.search(full_text)
    if doi_match:
        metadata["doi"] = doi_match.group(1).rstrip(".,;)")

    # --- Year extraction ---
    year_pattern = re.compile(r"\b(19[5-9]\d|20[0-2]\d)\b")
    year_matches = year_pattern.findall(full_text[:3000])
    if year_matches:
        metadata["year"] = year_matches[0]

    # --- Title extraction ---
    # Try PDF metadata first
    if pdf_meta.get("Title"):
        metadata["title"] = pdf_meta["Title"].strip()
    else:
        # Heuristic: title is often the longest line in the first ~10 lines
        first_lines = lines[:15]
        candidate = ""
        for line in first_lines:
            # Skip lines that look like authors, emails, affiliations, or short labels
            if re.search(r"@|university|institute|department|abstract|introduction", line, re.I):
                continue
            if len(line) > len(candidate) and len(line) > 20:
                candidate = line
        if candidate:
            metadata["title"] = candidate

    # --- Authors extraction ---
    if pdf_meta.get("Author"):
        raw_authors = pdf_meta["Author"]
        authors = _parse_author_string(raw_authors)
        metadata["authors"] = authors
    else:
        # Look for author-like lines (Name patterns) in first 20 lines
        author_pattern = re.compile(
            r"^([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:,\s*[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)*)"
        )
        for line in lines[1:20]:
            if re.search(r"@|university|abstract|introduction|keywords", line, re.I):
                continue
            m = author_pattern.match(line)
            if m:
                authors = _parse_author_string(m.group(1))
                if authors:
                    metadata["authors"] = authors
                    break

    # --- Abstract extraction ---
    abstract_match = re.search(
        r"abstract[:\s—-]*(.*?)(?=\n\s*(?:1\.?\s*introduction|keywords|index terms|\Z))",
        full_text,
        re.IGNORECASE | re.DOTALL,
    )
    if abstract_match:
        abstract_text = abstract_match.group(1).strip()
        # Clean up whitespace
        abstract_text = re.sub(r"\s+", " ", abstract_text)
        metadata["abstract"] = abstract_text[:1500]

    # --- Journal / Conference extraction ---
    journal_patterns = [
        re.compile(r"(?:published in|journal of|proceedings of|in proceedings|conference on)\s+([^\n,]+)", re.I),
        re.compile(r"(?:IEEE|ACM|Springer|Elsevier|Nature|Science)\s+[A-Za-z ]+", re.I),
    ]
    for pattern in journal_patterns:
        m = pattern.search(full_text[:5000])
        if m:
            metadata["journal"] = m.group(0).strip()
            break

    # Detect conference papers
    if re.search(r"proceedings|conference|workshop|symposium", full_text[:3000], re.I):
        metadata["source_type"] = "conference_paper"

    # --- Volume, Issue, Pages ---
    vol_issue_pages = re.search(
        r"vol(?:ume)?\.?\s*(\d+),?\s*(?:no|issue|num)?\.?\s*(\d+)?,?\s*(?:pp?\.?\s*([\d–-]+))?",
        full_text[:5000],
        re.I,
    )
    if vol_issue_pages:
        metadata["volume"] = vol_issue_pages.group(1)
        if vol_issue_pages.group(2):
            metadata["issue"] = vol_issue_pages.group(2)
        if vol_issue_pages.group(3):
            metadata["pages"] = vol_issue_pages.group(3)

    pages_match = re.search(r"pp?\.?\s*([\d]+\s*[–\-]\s*[\d]+)", full_text[:5000], re.I)
    if pages_match and not metadata["pages"]:
        metadata["pages"] = pages_match.group(1).replace(" ", "")

    # --- Publisher ---
    publisher_patterns = [
        re.compile(r"(?:published by|publisher[:\s]+)([^\n,]+)", re.I),
        re.compile(r"(Springer|Elsevier|Wiley|MIT Press|Oxford University Press|Cambridge University Press|IEEE|ACM)", re.I),
    ]
    for pattern in publisher_patterns:
        m = pattern.search(full_text[:5000])
        if m:
            metadata["publisher"] = m.group(1).strip()
            break

    return metadata


def _parse_author_string(author_str: str) -> list:
    """Parse an author string into a list of author names."""
    # Split by common delimiters
    parts = re.split(r",\s*(?:and\s+)?|\band\b|&", author_str)
    authors = []
    for part in parts:
        part = part.strip().strip(".")
        if part and len(part) > 2:
            authors.append(part)
    return authors


def extract_references_section(text: str) -> Optional[str]:
    """
    Find and return the references/bibliography section from the paper text.
    """
    patterns = [
        re.compile(r"(?:^|\n)\s*(?:references|bibliography|works cited|reference list)\s*\n", re.I),
    ]

    for pattern in patterns:
        match = pattern.search(text)
        if match:
            return text[match.start():]

    # Fallback: look for numbered references near the end
    # Try last 30% of the text
    last_part = text[int(len(text) * 0.7):]
    numbered_ref = re.search(r"\[1\]|\b1\.\s+[A-Z]", last_part)
    if numbered_ref:
        start = int(len(text) * 0.7) + numbered_ref.start()
        return text[start:]

    return None
