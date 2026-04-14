import re
from typing import Optional

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

REF_SECTION_RE = re.compile(
    r"(?:^|\n)\s*(?:References|Bibliography|Works\s+Cited|Literature\s+Cited|Sources)\s*\n",
    re.IGNORECASE,
)

NUMBERED_RE = re.compile(r"^\s*[\[\(]?\d+[\]\)\.]\s+")
AUTHOR_YEAR_RE = re.compile(
    r"^[A-Z][a-z]+(?:,\s+[A-Z]\.)?\s*[\(\[]\d{4}[\)\]]"
)
DOI_RE = re.compile(r"\b(10\.\d{4,9}/[^\s\"'<>]+)", re.IGNORECASE)
YEAR_RE = re.compile(r"[\(\[](\d{4})[\)\]]")


class ReferenceParser:
    """Extract and parse reference entries from academic PDFs."""

    def _get_full_text(self, pdf_path: str) -> str:
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

    def _find_references_section(self, full_text: str) -> Optional[str]:
        match = REF_SECTION_RE.search(full_text)
        if match:
            return full_text[match.end():]
        return None

    def _split_entries(self, ref_text: str) -> list[str]:
        lines = ref_text.split("\n")
        entries: list[str] = []
        current: list[str] = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            is_new = bool(NUMBERED_RE.match(stripped)) or bool(AUTHOR_YEAR_RE.match(stripped))
            if is_new and current:
                combined = " ".join(current).strip()
                if len(combined) > 20:
                    entries.append(combined)
                current = [re.sub(r"^\s*[\[\(]?\d+[\]\)\.]\s+", "", stripped)]
            else:
                current.append(stripped)

        if current:
            combined = " ".join(current).strip()
            if len(combined) > 20:
                entries.append(combined)

        return entries

    def _parse_entry(self, entry: str) -> dict:
        doi_match = DOI_RE.search(entry)
        doi = doi_match.group(1).rstrip(".,;)") if doi_match else None

        year_match = YEAR_RE.search(entry)
        year = year_match.group(1) if year_match else None

        # Try to extract title: text between first period after authors and journal info
        title: Optional[str] = None
        title_match = re.search(r"\.\s+([A-Z][^.]{10,150})\.", entry)
        if title_match:
            candidate = title_match.group(1).strip()
            if not re.search(r"\b(vol|pp?|no)\b", candidate, re.IGNORECASE):
                title = candidate

        # Try to extract authors: text before first year
        authors: list[str] = []
        if year_match:
            before_year = entry[: year_match.start()].strip().rstrip(".,")
            raw_authors = re.split(r",\s*&\s*|\s+and\s+|;\s*", before_year)
            authors = [a.strip().rstrip(".,") for a in raw_authors if a.strip()]

        return {
            "raw": entry,
            "title": title,
            "authors": authors[:20] if authors else [],
            "year": year,
            "doi": doi,
            "journal": None,
            "volume": None,
            "issue": None,
            "pages": None,
            "publisher": None,
            "source_type": "journal",
        }

    def parse_references(self, pdf_path: str) -> list[dict]:
        full_text = self._get_full_text(pdf_path)
        if not full_text:
            return []

        ref_section = self._find_references_section(full_text)
        if not ref_section:
            return []

        entries = self._split_entries(ref_section)
        return [self._parse_entry(e) for e in entries[:100]]
