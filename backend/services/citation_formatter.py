import re
from typing import Optional


class CitationFormatter:
    """Format metadata into APA 7th Edition citations and BibTeX."""

    def _clean(self, text: str) -> str:
        return re.sub(r"\s+", " ", str(text)).strip() if text else ""

    def _format_authors_apa(self, authors: list) -> str:
        if not authors:
            return "Anonymous"

        cleaned = [self._clean(a) for a in authors if a and self._clean(a)]
        if not cleaned:
            return "Anonymous"

        n = len(cleaned)
        if n == 1:
            return cleaned[0]
        elif n == 2:
            return f"{cleaned[0]}, & {cleaned[1]}"
        elif n <= 20:
            return ", ".join(cleaned[:-1]) + f", & {cleaned[-1]}"
        else:
            # APA 7: first 19, ellipsis, last author
            first_19 = ", ".join(cleaned[:19])
            return f"{first_19}, . . . {cleaned[-1]}"

    def _title_case_journal(self, title: str) -> str:
        return self._clean(title)

    def _sentence_case_title(self, title: str) -> str:
        """Convert to sentence case: capitalize first word and proper nouns only."""
        if not title:
            return title
        t = self._clean(title)
        if not t:
            return t
        return t[0].upper() + t[1:].lower() if len(t) > 1 else t.upper()

    def format_apa(self, metadata: dict) -> str:
        source_type = (metadata.get("source_type") or "journal").lower()

        if source_type == "book":
            return self._format_book(metadata)
        elif source_type == "conference":
            return self._format_conference(metadata)
        elif source_type == "website":
            return self._format_website(metadata)
        else:
            return self._format_journal(metadata)

    def _format_journal(self, m: dict) -> str:
        authors_raw = m.get("authors") or []
        if isinstance(authors_raw, str):
            authors_raw = [a.strip() for a in authors_raw.split(",") if a.strip()]
        author_str = self._format_authors_apa(authors_raw)

        year = self._clean(m.get("year") or "n.d.")
        title = self._clean(m.get("title") or "Untitled")
        journal = self._clean(m.get("journal") or "")
        volume = self._clean(m.get("volume") or "")
        issue = self._clean(m.get("issue") or "")
        pages = self._clean(m.get("pages") or "")
        doi = self._clean(m.get("doi") or "")

        citation = f"{author_str} ({year}). {title}."

        if journal:
            journal_vol = f" *{journal}*"
            if volume:
                journal_vol += f", *{volume}*"
                if issue:
                    journal_vol += f"({issue})"
            if pages:
                journal_vol += f", {pages}"
            journal_vol += "."
            citation += journal_vol

        if doi:
            clean_doi = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", doi)
            citation += f" https://doi.org/{clean_doi}"

        return citation

    def _format_book(self, m: dict) -> str:
        authors_raw = m.get("authors") or []
        if isinstance(authors_raw, str):
            authors_raw = [a.strip() for a in authors_raw.split(",") if a.strip()]
        author_str = self._format_authors_apa(authors_raw)

        year = self._clean(m.get("year") or "n.d.")
        title = self._clean(m.get("title") or "Untitled")
        publisher = self._clean(m.get("publisher") or "")
        doi = self._clean(m.get("doi") or "")

        citation = f"{author_str} ({year}). *{title}*."
        if publisher:
            citation += f" {publisher}."
        if doi:
            clean_doi = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", doi)
            citation += f" https://doi.org/{clean_doi}"

        return citation

    def _format_conference(self, m: dict) -> str:
        authors_raw = m.get("authors") or []
        if isinstance(authors_raw, str):
            authors_raw = [a.strip() for a in authors_raw.split(",") if a.strip()]
        author_str = self._format_authors_apa(authors_raw)

        year = self._clean(m.get("year") or "n.d.")
        title = self._clean(m.get("title") or "Untitled")
        conference = self._clean(m.get("conference") or m.get("journal") or "")
        location = self._clean(m.get("location") or "")
        doi = self._clean(m.get("doi") or "")

        citation = f"{author_str} ({year}). *{title}*."
        if conference:
            citation += f" {conference}"
            if location:
                citation += f", {location}"
            citation += "."
        if doi:
            clean_doi = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", doi)
            citation += f" https://doi.org/{clean_doi}"

        return citation

    def _format_website(self, m: dict) -> str:
        authors_raw = m.get("authors") or []
        if isinstance(authors_raw, str):
            authors_raw = [a.strip() for a in authors_raw.split(",") if a.strip()]
        author_str = self._format_authors_apa(authors_raw) if authors_raw else "Anonymous"

        year = self._clean(m.get("year") or "n.d.")
        title = self._clean(m.get("title") or "Untitled")
        url = self._clean(m.get("url") or m.get("doi") or "")
        accessed = self._clean(m.get("accessed_date") or "")
        publisher = self._clean(m.get("publisher") or "")

        citation = f"{author_str} ({year}). {title}."
        if publisher:
            citation += f" {publisher}."
        if accessed and url:
            citation += f" Retrieved {accessed}, from {url}"
        elif url:
            citation += f" {url}"

        return citation

    def _bibtex_key(self, m: dict) -> str:
        authors_raw = m.get("authors") or []
        if isinstance(authors_raw, str):
            authors_raw = [a.strip() for a in authors_raw.split(",") if a.strip()]
        first_author = authors_raw[0] if authors_raw else "unknown"
        family = first_author.split(",")[0].strip().lower().replace(" ", "")
        family = re.sub(r"[^a-z0-9]", "", family)
        year = re.sub(r"\D", "", m.get("year") or "0000")[:4]
        title = m.get("title") or "untitled"
        first_word = re.sub(r"[^a-zA-Z]", "", title.split()[0]).lower() if title.split() else "untitled"
        return f"{family}{year}{first_word}"

    def format_bibtex(self, metadata: dict) -> str:
        source_type = (metadata.get("source_type") or "journal").lower()
        entry_types = {
            "journal": "article",
            "book": "book",
            "conference": "inproceedings",
            "website": "misc",
        }
        btype = entry_types.get(source_type, "article")
        key = self._bibtex_key(metadata)

        authors_raw = metadata.get("authors") or []
        if isinstance(authors_raw, str):
            authors_raw = [a.strip() for a in authors_raw.split(",") if a.strip()]
        author_str = " and ".join(authors_raw) if authors_raw else "Anonymous"

        fields = [
            ("author", author_str),
            ("title", metadata.get("title") or ""),
            ("year", metadata.get("year") or ""),
            ("journal", metadata.get("journal") or ""),
            ("volume", metadata.get("volume") or ""),
            ("number", metadata.get("issue") or ""),
            ("pages", metadata.get("pages") or ""),
            ("doi", metadata.get("doi") or ""),
            ("publisher", metadata.get("publisher") or ""),
        ]

        lines = [f"@{btype}{{{key},"]
        for name, value in fields:
            v = self._clean(str(value)) if value else ""
            if v:
                lines.append(f"  {name} = {{{v}}},")
        lines.append("}")
        return "\n".join(lines)
