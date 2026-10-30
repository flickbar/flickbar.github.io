#!/usr/bin/env python3
"""Builds the site's pages, one per language, from src/page.html and src/strings/<lang>.json.

Run after changing either: python3 build.py. Stops without writing anything if a string is missing,
or if the Persian breaks its rules (Persian letters only, no hamza or Arabic diacritics, and no
paragraph that starts with a Latin word, which would lay it out left to right).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent
LANGS = {"en": ("index.html", "EN", "English"), "fr": ("fr/index.html", "FR", "Français"), "fa": ("fa/index.html", "فا", "فارسی")}
# Keys that hold settings rather than text people read.
SETTINGS = {"lang", "dir", "url", "home", "ogLocale", "font", "title"}
# Arabic-only letters, hamza in any form, Arabic diacritics (including tanvin) and Arabic-Indic digits.
NOT_PERSIAN = set("يكةءأإؤئٔ") | {chr(c) for c in range(0x064B, 0x0656)} | {chr(c) for c in range(0x0660, 0x066A)}


def texts(value):
    """Every string inside a strings value, which may be a nested object or list."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for v in value.values():
            yield from texts(v)
    elif isinstance(value, list):
        for v in value:
            yield from texts(v)


def first_strong_direction(text):
    plain = re.sub(r"<[^>]+>", "", text)
    for ch in plain:
        kind = unicodedata.bidirectional(ch)
        if kind in ("L", "R", "AL"):
            return kind
    return None


def check_persian(strings):
    problems = []
    for key, value in strings.items():
        if key in SETTINGS:
            continue
        for text in texts(value):
            bad = sorted({f"U+{ord(c):04X} {unicodedata.name(c, '?')}" for c in text if c in NOT_PERSIAN})
            if bad:
                problems.append(f"{key}: not Persian: {', '.join(bad)}")
            if first_strong_direction(text) == "L":
                problems.append(f"{key}: starts with a Latin word, so it would read left to right: {text[:40]!r}")
            # "می" before a verb needs a zero-width non-joiner, not a space (می‌کند, not می کند).
            if re.search(r"(^|\s)(ن?می) (?=\S)", text):
                problems.append(f"{key}: 'می' followed by a space instead of a zero-width non-joiner")
    return problems


def lang_links(current, short):
    links = []
    for code, (path, abbr, name) in LANGS.items():
        href = "/" + path.removesuffix("index.html")
        label = abbr if short else name
        here = ' aria-current="page"' if code == current else ""
        links.append(f'<a href="{href}" hreflang="{code}" lang="{code}"{here}>{label}</a>')
    return "".join(links)


def main():
    template = (ROOT / "src/page.html").read_text()
    used = set(re.findall(r"{{(\w+)}}", template))
    generated = {"langLinksShort", "langLinksLong", "i18n"}
    all_strings = {code: json.loads((ROOT / f"src/strings/{code}.json").read_text()) for code in LANGS}

    problems = []
    reference = set(all_strings["en"])
    for code, strings in all_strings.items():
        if set(strings) != reference:
            problems.append(f"{code}: keys differ from en: {sorted(set(strings) ^ reference)}")
        missing = used - generated - set(strings)
        if missing:
            problems.append(f"{code}: missing {sorted(missing)}")
    problems += [f"fa {p}" for p in check_persian(all_strings["fa"])]
    if problems:
        sys.exit("Not built:\n  " + "\n  ".join(problems))

    for code, strings in all_strings.items():
        values = dict(strings)
        values["langLinksShort"] = lang_links(code, short=True)
        values["langLinksLong"] = lang_links(code, short=False)
        # Inside <script>, a "</" would end the element early.
        values["i18n"] = json.dumps(strings["i18n"], ensure_ascii=False).replace("</", "<\\/")
        page = re.sub(r"{{(\w+)}}", lambda m: values[m.group(1)], template)
        out = ROOT / LANGS[code][0]
        out.parent.mkdir(exist_ok=True)
        out.write_text(page)
        print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
