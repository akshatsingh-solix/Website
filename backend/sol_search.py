"""Retrieval over the site's own content for Sol.

sol_knowledge.json is generated from the frontend's data files by
frontend/scripts/sol-knowledge.js. It is ranked with BM25 (the keyword ranking
behind most search engines), in-process: no embedding API to pay for or rate
limit, no vector database, and it fits easily in a free instance's memory.
"""
import json
import math
import re
from collections import Counter
from pathlib import Path
from typing import List, Optional

KNOWLEDGE_FILE = Path(__file__).parent / "sol_knowledge.json"

STOP = set(
    "a an and are as at be but by can do does for from has have how i if in into is it its me my of on or our so that the their them then there these "
    "they this to us was we what when where which who why will with you your about any all also more most not only other some such than too very "
    "would could should tell show give get want need know like just solix sol please hi hello hey".split()
)
# Words visitors use for things the site names differently.
SYNONYMS = {
    "price": "pricing cost", "pricing": "cost", "cost": "savings", "costs": "savings", "cheap": "cost",
    "decommission": "retirement retire", "sunset": "retirement retire", "legacy": "retirement",
    "gdpr": "privacy", "ccpa": "privacy", "dsar": "privacy", "pii": "privacy",
    "llm": "ai", "genai": "ai", "copilot": "ai agents", "chatbot": "ai",
    "job": "careers roles", "jobs": "careers roles", "hiring": "careers roles", "career": "careers roles",
    "office": "offices", "address": "offices headquarters", "phone": "offices contact",
    "partner": "partners", "reseller": "partners distribution", "press": "media",
    "demo": "contact", "trial": "free trial", "ecc": "sap", "s4": "s/4hana", "hana": "s/4hana",
}


def tokenize(text: str) -> List[str]:
    out = []
    for w in re.findall(r"[a-z0-9][a-z0-9/+.-]*[a-z0-9]|[a-z0-9]", text.lower()):
        if w in STOP:
            continue
        # Light stemming so "archives"/"archiving"/"archived" meet.
        for suf in ("ing", "ed", "es", "s"):
            if len(w) > 4 + len(suf) - 1 and w.endswith(suf):
                w = w[: -len(suf)]
                break
        out.append(w)
    return out


class Index:
    def __init__(self, chunks: List[dict], k1: float = 1.4, b: float = 0.7):
        self.chunks = chunks
        self.k1, self.b = k1, b
        # Titles count twice: a chunk titled "Application Retirement" is about it.
        self.docs = [Counter(tokenize(f"{c['title']} {c['title']} {c['text']}")) for c in chunks]
        self.lens = [sum(d.values()) for d in self.docs]
        self.avg = (sum(self.lens) / len(self.lens)) if self.lens else 1
        df = Counter(t for d in self.docs for t in d)
        n = len(chunks)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def _expand(self, query: str) -> List[str]:
        terms = tokenize(query)
        extra = [s for w in query.lower().split() for s in tokenize(SYNONYMS.get(w.strip("?.,!"), ""))]
        return terms + extra

    def search(self, query: str, k: int = 5, kinds: Optional[List[str]] = None) -> List[dict]:
        terms = self._expand(query)
        if not terms:
            return []
        scored = []
        for i, d in enumerate(self.docs):
            if kinds and self.chunks[i]["kind"] not in kinds:
                continue
            s = 0.0
            for t in terms:
                f = d.get(t)
                if f:
                    s += self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * self.lens[i] / self.avg))
            if s > 0:
                scored.append((s, i))
        scored.sort(reverse=True)
        return [{**self.chunks[i], "score": round(s, 2)} for s, i in scored[:k]]


_index: Optional[Index] = None


def index() -> Index:
    global _index
    if _index is None:
        try:
            chunks = json.loads(KNOWLEDGE_FILE.read_text())["chunks"]
        except (OSError, ValueError, KeyError):
            chunks = []
        _index = Index(chunks)
    return _index


def search(query: str, k: int = 5) -> List[dict]:
    return index().search(query, k)


def format_context(hits: List[dict], max_chars: int = 6000) -> str:
    """Retrieved chunks as a compact, citable block for the prompt."""
    parts, used = [], 0
    for h in hits:
        block = f"[{h['title']}] (page: {h['url']})\n{h['text']}"
        if used + len(block) > max_chars:
            block = block[: max(0, max_chars - used)]
        if not block:
            break
        parts.append(block)
        used += len(block)
    return "\n\n---\n\n".join(parts)
