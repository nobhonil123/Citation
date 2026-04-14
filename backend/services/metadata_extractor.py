import re
from typing import Optional
import requests


CROSSREF_API = "https://api.crossref.org/works"
HEADERS = {"User-Agent": "CitationGenerator/1.0 (mailto:citations@example.com)"}


class MetadataExtractor:
    """Enrich metadata using CrossRef API with PDF-extracted fallback."""

    def _normalize_author(self, given: str, family: str) -> str:
        given = given.strip()
        family = family.strip()
        if not given:
            return family
        initials = " ".join(f"{p[0]}." for p in given.split() if p)
        return f"{family}, {initials}"

    def _parse_crossref_item(self, item: dict) -> dict:
        title_list = item.get("title", [])
        title = title_list[0] if title_list else None

        authors = []
        for a in item.get("author", []):
            family = a.get("family", "")
            given = a.get("given", "")
            if family:
                authors.append(self._normalize_author(given, family))

        date_parts = item.get("published", item.get("published-print", item.get("issued", {})))
        dp = date_parts.get("date-parts", [[None]])
        year = str(dp[0][0]) if dp and dp[0] and dp[0][0] else None

        container = item.get("container-title", [])
        journal = container[0] if container else None

        publisher = item.get("publisher")
        volume = item.get("volume")
        issue = item.get("issue")
        pages = item.get("page")
        doi = item.get("DOI")

        ref_type = item.get("type", "journal-article")
        if ref_type in ("journal-article", "article-journal"):
            source_type = "journal"
        elif ref_type in ("book", "monograph", "book-chapter"):
            source_type = "book"
        elif ref_type in ("proceedings-article",):
            source_type = "conference"
        else:
            source_type = "journal"

        return {
            "title": title,
            "authors": authors,
            "year": year,
            "journal": journal,
            "volume": volume,
            "issue": issue,
            "pages": pages,
            "doi": doi,
            "publisher": publisher,
            "source_type": source_type,
        }

    def lookup_by_doi(self, doi: str) -> Optional[dict]:
        clean_doi = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", doi.strip())
        try:
            resp = requests.get(
                f"{CROSSREF_API}/{clean_doi}", headers=HEADERS, timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                item = data.get("message", {})
                return self._parse_crossref_item(item)
        except requests.RequestException:
            pass
        return None

    def _search_by_title(self, title: str) -> Optional[dict]:
        try:
            resp = requests.get(
                CROSSREF_API,
                params={"query": title, "rows": 1},
                headers=HEADERS,
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("message", {}).get("items", [])
                if items:
                    return self._parse_crossref_item(items[0])
        except requests.RequestException:
            pass
        return None

    def _merge(self, base: dict, override: dict) -> dict:
        result = dict(base)
        for k, v in override.items():
            if v is not None and v != [] and v != "":
                result[k] = v
        return result

    def enrich_metadata(self, pdf_metadata: dict) -> dict:
        crossref_meta = None

        doi = pdf_metadata.get("doi")
        if doi:
            crossref_meta = self.lookup_by_doi(doi)

        if not crossref_meta:
            title = pdf_metadata.get("title")
            if title and len(title) > 10:
                crossref_meta = self._search_by_title(title)

        if crossref_meta:
            return self._merge(pdf_metadata, crossref_meta)

        return pdf_metadata
