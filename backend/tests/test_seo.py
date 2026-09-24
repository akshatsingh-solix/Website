"""Offline unit tests for seo.py: Semrush parsing, topic scoring, AI mention detection."""
import asyncio
import os
from datetime import datetime, timedelta, timezone

import httpx
import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "solix_test")

import seo  # noqa: E402


def test_parse_semrush_csv_maps_by_position():
    rows = seo.parse_semrush_csv("Keyword;Position;Search Volume\ndata archiving;3;1900\n", ["Ph", "Po", "Nq"])
    assert rows == [{"Ph": "data archiving", "Po": "3", "Nq": "1900"}]


def test_parse_semrush_csv_nothing_found_is_empty():
    assert seo.parse_semrush_csv("ERROR 50 :: NOTHING FOUND", ["Ph"]) == []


def test_parse_semrush_csv_raises_on_units():
    with pytest.raises(seo.SemrushError):
        seo.parse_semrush_csv("ERROR 132 :: API UNITS BALANCE IS ZERO", ["Ph"])
    assert seo.semrush_http_error(seo.SemrushError("ERROR 132 :: API UNITS BALANCE IS ZERO")).status_code == 402


def test_keyword_normalises_traffic_and_features():
    kw = seo._keyword({"Ph": "x", "Po": "2", "Pp": "5", "Nq": "100", "Tr": "12.5", "Td": "0.1,1.00", "Fk": "11,21", "Fp": "11", "In": "1"}, 1000)
    assert kw["traffic"] == 125 and kw["prev_position"] == 5
    assert kw["serp"] == [11, 21] and kw["owned"] == [11] and kw["trend"] == [0.1, 1.0]


def test_history_sorted_and_dated():
    h = seo._history([{"Dt": "20260815", "Ot": "10", "Or": "5"}, {"Dt": "20260715", "Ot": "8", "Or": "4"}])
    assert [x["date"] for x in h] == ["2026-07-15", "2026-08-15"]


def test_mentions_ranked_by_first_appearance():
    found = seo._mentions("Consider Informatica, then Solix. Solix handles SAP.", {"solix.com": "Solix", "informatica.com": "Informatica", "veritas.com": "Veritas"})
    assert [(f["brand"], f["rank"], f["count"]) for f in found] == [("Informatica", 1, 1), ("Solix", 2, 2)]


def test_root_domain():
    assert seo._root("https://www.solix.com/products") == "solix.com"
    assert seo._root("https://news.bbc.co.uk/x") == "bbc.co.uk"


def test_clean_domain():
    assert seo._clean_domain("https://WWW.Solix.com/path") == "solix.com"


def test_gather_topic_scores_momentum_with_mocked_sources():
    now = datetime.now(timezone.utc)
    recent = int((now - timedelta(days=1)).timestamp())
    old = int((now - timedelta(days=15)).timestamp())
    rss = f"""<rss><channel>
      <item><title>EU AI Act enforcement starts for general purpose models</title><link>https://n/1</link><pubDate>{(now - timedelta(days=2)).strftime('%a, %d %b %Y %H:%M:%S GMT')}</pubDate><source>Reuters</source></item>
      <item><title>EU AI Act guidance published</title><link>https://n/2</link><pubDate>{(now - timedelta(days=20)).strftime('%a, %d %b %Y %H:%M:%S GMT')}</pubDate><source>FT</source></item>
    </channel></rss>"""

    def handler(req: httpx.Request):
        host = req.url.host
        if host == "news.google.com":
            return httpx.Response(200, content=rss.encode())
        if host == "hn.algolia.com":
            return httpx.Response(200, json={"hits": [
                {"objectID": "1", "title": "AI Act enforcement and open models", "created_at_i": recent, "points": 120, "num_comments": 40},
                {"objectID": "2", "title": "Older thread", "created_at_i": old, "points": 5, "num_comments": 1},
            ]})
        return httpx.Response(429)

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
            return await seo.gather_topic(c, "AI Act")

    t = asyncio.run(run())
    assert t["mentions_30d"] == 4 and t["mentions_7d"] == 2
    assert t["voices"] == {"news": 2, "practitioners": 2}
    assert t["failed_sources"] == []  # reddit non-200 degrades to empty, not a failure
    assert "enforcement" in t["rising_terms"]
    assert t["top"][0]["source"] == "Hacker News"
