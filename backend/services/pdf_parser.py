import re
from pathlib import Path
from typing import Optional

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None


class PDFParser:
    """Extract text and metadata from PDF files using pdfplumber with PyPDF2 fallback."""

    DOI_RE = re.compile(r"\b(10\.\d{4,9}/[^\s\"'<>]+)", re.IGNORECASE)
    YEAR_RE = re.compile(r"\b(19[5-9]\d|20[0-2]\d)\b")
    VOLUME_RE = re.compile(
        r"\bvol(?:ume)?\.?\s*(\d+)", re.IGNORECASE
    )
    ISSUE_RE = re.compile(
        r"\b(?:no\.?|issue|number)\.?\s*(\d+)", re.IGNORECASE
    )
    PAGES_RE = re.compile(
        r"\bpp?\.?\s*(\d+\s*[-–]\s*\d+)", re.IGNORECASE
    )

    def _extract_text(self, pdf_path: str) -> list[str]:
        """Return list of page texts (first 5 pages)."""
        pages: list[str] = []

        if pdfplumber:
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages[:5]:
                        text = page.extract_text() or ""
                        pages.append(text)
                if any(p.strip() for p in pages):
                    return pages
            except Exception:
                pass

        if PdfReader:
            try:
                reader = PdfReader(pdf_path)
                for page in reader.pages[:5]:
                    text = page.extract_text() or ""
                    pages.append(text)
            except Exception:
                pass

        return pages

    def _extract_full_text(self, pdf_path: str) -> str:
        """Return full document text (all pages)."""
        if pdfplumber:
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    texts = [p.extract_text() or "" for p in pdf.pages]
                text = "\n".join(texts)
                if text.strip():
                    return text
            except Exception:
                pass

        if PdfReader:
            try:
                reader = PdfReader(pdf_path)
                texts = [p.extract_text() or "" for p in reader.pages]
                return "\n".join(texts)
            except Exception:
                pass

        return ""

    def _clean(self, text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    def _find_title(self, pages: list[str]) -> Optional[str]:
        if not pages:
            return None
        first = pages[0]
        lines = [l.strip() for l in first.split("\n") if l.strip()]
        # Skip very short lines or lines that look like headers/footers
        for line in lines[:8]:
            if 10 < len(line) < 250 and not re.match(r"^\d+$", line):
                return self._clean(line)
        return None

    def _find_authors(self, text: str) -> list[str]:
        authors: list[str] = []
        # Pattern: "Author, A. B., & Author, C. D." or "Author A, Author B"
        patterns = [
            r"([A-Z][a-z]+(?:\s[A-Z]\.)+(?:\s[A-Z][a-z]+)?)",
            r"([A-Z][a-z]+,\s+[A-Z]\.(?:\s[A-Z]\.)?)",
        ]
        for pat in patterns:
            matches = re.findall(pat, text[:2000])
            if matches:
                authors = [self._clean(m) for m in matches[:10]]
                break
        return authors

    def _find_abstract(self, text: str) -> Optional[str]:
        match = re.search(
            r"\bAbstract[:\s]+(.{100,1500}?)(?:\n\n|\bKeywords?\b|\bIntroduction\b)",
            text,
            re.DOTALL | re.IGNORECASE,
        )
        if match:
            return self._clean(match.group(1))
        return None

    def _find_journal(self, text: str) -> Optional[str]:
        patterns = [
            r"(?:Published in|Journal of|Proceedings of)\s+([A-Z][^\n]{5,80})",
            r"^\s*([A-Z][a-z]+(?: [A-Z]?[a-z]+){1,6})\s*$",
        ]
        for pat in patterns:
            m = re.search(pat, text, re.MULTILINE | re.IGNORECASE)
            if m:
                candidate = self._clean(m.group(1))
                if len(candidate) > 5:
                    return candidate
        return None

    def extract_metadata(self, pdf_path: str) -> dict:
        pages = self._extract_text(pdf_path)
        first_pages_text = "\n".join(pages[:2])
        full_text = self._extract_full_text(pdf_path)

        doi_match = self.DOI_RE.search(first_pages_text) or self.DOI_RE.search(full_text)
        doi = doi_match.group(1).rstrip(".,;)") if doi_match else None

        year_match = self.YEAR_RE.search(first_pages_text)
        year = year_match.group(1) if year_match else None

        volume_match = self.VOLUME_RE.search(first_pages_text)
        volume = volume_match.group(1) if volume_match else None

        issue_match = self.ISSUE_RE.search(first_pages_text)
        issue = issue_match.group(1) if issue_match else None

        pages_match = self.PAGES_RE.search(first_pages_text)
        pages_str = self._clean(pages_match.group(1)) if pages_match else None

        return {
            "title": self._find_title(pages),
            "authors": self._find_authors(first_pages_text),
            "year": year,
            "journal": self._find_journal(first_pages_text),
            "volume": volume,
            "issue": issue,
            "pages": pages_str,
            "doi": doi,
            "abstract": self._find_abstract(full_text),
            "publisher": None,
            "source_type": "journal",
        }

    def extract_full_text(self, pdf_path: str) -> str:
        return self._extract_full_text(pdf_path)
