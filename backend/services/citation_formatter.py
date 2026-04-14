"""
Citation Formatter Service
Formats metadata into APA 7th Edition citations and BibTeX format.
"""

import re
from typing import Optional


def format_apa(metadata: dict) -> str:
    """
    Format metadata into an APA 7th Edition citation string.
    Handles journal articles, books, conference papers, book chapters, and web sources.
    """
    source_type = metadata.get("source_type", "journal_article")

    formatters = {
        "journal_article": _format_journal_article,
        "book": _format_book,
        "book_chapter": _format_book_chapter,
        "conference_paper": _format_conference_paper,
        "web": _format_web_source,
        "report": _format_report,
    }

    formatter = formatters.get(source_type, _format_journal_article)
    return formatter(metadata)


def format_bibtex(metadata: dict) -> str:
    """
    Generate BibTeX format from metadata.
    """
    source_type = metadata.get("source_type", "journal_article")

    bibtex_types = {
        "journal_article": "article",
        "book": "book",
        "book_chapter": "incollection",
        "conference_paper": "inproceedings",
        "web": "misc",
        "report": "techreport",
    }

    entry_type = bibtex_types.get(source_type, "article")

    # Generate a key: first author's last name + year
    authors = metadata.get("authors", [])
    year = metadata.get("year", "n.d.")
    first_author_last = ""
    if authors:
        first_author_last = re.split(r",", authors[0])[0].strip().replace(" ", "")
    key = f"{first_author_last}{year}"

    lines = [f"@{entry_type}{{{key},"]

    title = metadata.get("title")
    if title:
        lines.append(f"  title     = {{{title}}},")

    if authors:
        author_str = " and ".join(authors)
        lines.append(f"  author    = {{{author_str}}},")

    if year:
        lines.append(f"  year      = {{{year}}},")

    journal = metadata.get("journal")
    if journal:
        if source_type in ("journal_article",):
            lines.append(f"  journal   = {{{journal}}},")
        elif source_type == "conference_paper":
            lines.append(f"  booktitle = {{{journal}}},")

    volume = metadata.get("volume")
    if volume:
        lines.append(f"  volume    = {{{volume}}},")

    issue = metadata.get("issue")
    if issue:
        lines.append(f"  number    = {{{issue}}},")

    pages = metadata.get("pages")
    if pages:
        lines.append(f"  pages     = {{{pages}}},")

    publisher = metadata.get("publisher")
    if publisher:
        lines.append(f"  publisher = {{{publisher}}},")

    doi = metadata.get("doi")
    if doi:
        lines.append(f"  doi       = {{{doi}}},")
        lines.append(f"  url       = {{https://doi.org/{doi}}},")

    lines.append("}")
    return "\n".join(lines)


# ─── APA Formatting Helpers ────────────────────────────────────────────────────


def _format_author_list(authors: list) -> str:
    """
    Format an author list according to APA 7th Edition rules:
    - 1 author: Author, A. A.
    - 2 authors: Author, A. A., & Author, B. B.
    - 3-20 authors: list all, last preceded by &
    - 21+ authors: first 19, ..., last author
    """
    if not authors:
        return ""

    formatted = []
    for author in authors:
        formatted.append(_format_single_author(author))

    n = len(formatted)

    if n == 1:
        return formatted[0]
    elif n == 2:
        return f"{formatted[0]}, & {formatted[1]}"
    elif n <= 20:
        return ", ".join(formatted[:-1]) + f", & {formatted[-1]}"
    else:
        # 21+ authors: first 19, ..., last
        first_19 = ", ".join(formatted[:19])
        return f"{first_19}, . . . {formatted[-1]}"


def _format_single_author(author: str) -> str:
    """
    Convert an author name to APA format: Last, F. M.
    Handles 'Last, First Middle', 'First Last', 'Last, First' forms.
    """
    author = author.strip()
    if not author:
        return ""

    # Already in "Last, First" format
    if "," in author:
        parts = [p.strip() for p in author.split(",", 1)]
        last = parts[0]
        first_rest = parts[1] if len(parts) > 1 else ""
        initials = _get_initials(first_rest)
        return f"{last}, {initials}".rstrip(", ")

    # "First Last" format
    name_parts = author.split()
    if len(name_parts) == 1:
        return author
    last = name_parts[-1]
    first_rest = " ".join(name_parts[:-1])
    initials = _get_initials(first_rest)
    return f"{last}, {initials}".rstrip(", ")


def _get_initials(name: str) -> str:
    """Convert first/middle name(s) to initials: 'John Michael' -> 'J. M.'"""
    parts = name.split()
    initials = []
    for part in parts:
        part = part.strip(".")
        if part:
            initials.append(f"{part[0].upper()}.")
    return " ".join(initials)


def _format_journal_article(metadata: dict) -> str:
    """
    APA 7th edition journal article:
    Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, volume(issue), pages. https://doi.org/xxxx
    """
    parts = []

    authors = metadata.get("authors", [])
    author_str = _format_author_list(authors)
    if author_str:
        parts.append(author_str)

    year = metadata.get("year", "n.d.")
    parts.append(f"({year}).")

    title = metadata.get("title", "")
    if title:
        parts.append(f"{_sentence_case(title)}.")

    journal = metadata.get("journal", "")
    volume = metadata.get("volume")
    issue = metadata.get("issue")

    source_str = ""
    if journal:
        if volume:
            if issue:
                source_str = f"{journal}, {volume}({issue})"
            else:
                source_str = f"{journal}, {volume}"
        else:
            source_str = journal

    pages = metadata.get("pages")
    if source_str and pages:
        source_str += f", {pages}."
    elif source_str:
        source_str += "."

    if source_str:
        parts.append(source_str)

    doi = metadata.get("doi")
    if doi:
        parts.append(f"https://doi.org/{doi}")

    return " ".join(parts)


def _format_book(metadata: dict) -> str:
    """
    APA 7th edition book:
    Author, A. A. (Year). Title of work: Subtitle. Publisher. https://doi.org/xxxx
    """
    parts = []

    authors = metadata.get("authors", [])
    author_str = _format_author_list(authors)
    if author_str:
        parts.append(author_str)

    year = metadata.get("year", "n.d.")
    parts.append(f"({year}).")

    title = metadata.get("title", "")
    if title:
        parts.append(f"{_title_to_apa_book(title)}.")

    publisher = metadata.get("publisher", "")
    if publisher:
        parts.append(f"{publisher}.")

    doi = metadata.get("doi")
    if doi:
        parts.append(f"https://doi.org/{doi}")

    return " ".join(parts)


def _format_book_chapter(metadata: dict) -> str:
    """
    APA 7th edition book chapter:
    Author, A. A. (Year). Title of chapter. In E. Editor (Ed.), Title of book (pp. xx–xx). Publisher.
    """
    parts = []

    authors = metadata.get("authors", [])
    author_str = _format_author_list(authors)
    if author_str:
        parts.append(author_str)

    year = metadata.get("year", "n.d.")
    parts.append(f"({year}).")

    title = metadata.get("title", "")
    if title:
        parts.append(f"{_sentence_case(title)}.")

    journal = metadata.get("journal", "")
    pages = metadata.get("pages")
    editor_info = f"In {journal}" if journal else "In"
    if pages:
        editor_info += f" (pp. {pages})."
    else:
        editor_info += "."
    parts.append(editor_info)

    publisher = metadata.get("publisher", "")
    if publisher:
        parts.append(f"{publisher}.")

    doi = metadata.get("doi")
    if doi:
        parts.append(f"https://doi.org/{doi}")

    return " ".join(parts)


def _format_conference_paper(metadata: dict) -> str:
    """
    APA 7th edition conference paper:
    Author, A. A. (Year, Month Day). Title of paper. Name of Conference, Location.
    """
    parts = []

    authors = metadata.get("authors", [])
    author_str = _format_author_list(authors)
    if author_str:
        parts.append(author_str)

    year = metadata.get("year", "n.d.")
    parts.append(f"({year}).")

    title = metadata.get("title", "")
    if title:
        parts.append(f"{_sentence_case(title)}.")

    conference = metadata.get("journal", "")
    if conference:
        parts.append(f"{conference}.")

    doi = metadata.get("doi")
    if doi:
        parts.append(f"https://doi.org/{doi}")

    return " ".join(parts)


def _format_web_source(metadata: dict) -> str:
    """
    APA 7th edition web source:
    Author, A. A. (Year, Month Day). Title. Site Name. URL
    """
    parts = []

    authors = metadata.get("authors", [])
    author_str = _format_author_list(authors)
    if author_str:
        parts.append(author_str)

    year = metadata.get("year", "n.d.")
    parts.append(f"({year}).")

    title = metadata.get("title", "")
    if title:
        parts.append(f"{_sentence_case(title)}.")

    publisher = metadata.get("publisher", "") or metadata.get("journal", "")
    if publisher:
        parts.append(f"{publisher}.")

    doi = metadata.get("doi")
    if doi:
        parts.append(f"https://doi.org/{doi}")
    elif metadata.get("url"):
        parts.append(metadata["url"])

    return " ".join(parts)


def _format_report(metadata: dict) -> str:
    """
    APA 7th edition report.
    """
    return _format_book(metadata)


def _sentence_case(title: str) -> str:
    """
    Convert a title to sentence case (capitalize first word and proper nouns only).
    APA uses sentence case for article/chapter titles.
    """
    if not title:
        return title
    # Simple approach: lowercase everything, then capitalize first word
    title = title.strip()
    if len(title) <= 1:
        return title.upper()
    # Find first alphabetic character and capitalize it
    result = list(title.lower())
    for i, ch in enumerate(result):
        if ch.isalpha():
            result[i] = ch.upper()
            break
    # Also capitalize after a colon (subtitle)
    for i, ch in enumerate(result[:-1]):
        if ch == ":" and i + 1 < len(result):
            j = i + 1
            while j < len(result) and result[j] == " ":
                j += 1
            if j < len(result) and result[j].isalpha():
                result[j] = result[j].upper()
    return "".join(result)


def _title_to_apa_book(title: str) -> str:
    """
    Book titles are italicized in APA; here we just return the title
    with sentence case applied (rendering italics is handled by the frontend).
    """
    return _sentence_case(title)
