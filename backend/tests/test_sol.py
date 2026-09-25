"""Offline tests for Sol: retrieval, provider failover, streamed tool calls, chat endpoint."""
import asyncio
import json
import os

import httpx
import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "solix_test")

import llm  # noqa: E402
import sol_search  # noqa: E402


def run_sync(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def collect(agen):
    async def go():
        return [e async for e in agen]
    return run_sync(go())


def sse_body(*chunks):
    return "".join(f"data: {json.dumps(c)}\n\n" for c in chunks) + "data: [DONE]\n\n"


def text_chunk(t):
    return {"choices": [{"delta": {"content": t}}]}


# ---------- retrieval ----------
def test_knowledge_is_generated_and_loaded():
    assert len(sol_search.index().chunks) > 50
    urls = {c["url"] for c in sol_search.index().chunks}
    assert "/products/application-retirement" in urls and "/careers" in urls


def test_search_finds_the_right_pages():
    assert sol_search.search("Can you retire SAP ECC and keep the data?", 3)[0]["url"] == "/products/sap-archiving"
    assert sol_search.search("are you hiring engineers?", 1)[0]["url"] == "/careers"
    assert sol_search.search("GDPR DSAR automation", 1)[0]["id"].startswith(("product:consumer-data-privacy", "resource:consumer-data-privacy"))


def test_small_talk_retrieves_nothing():
    assert sol_search.search("hi there", 5) == []


def test_format_context_respects_budget():
    ctx = sol_search.format_context(sol_search.search("archiving cost reduction", 10), max_chars=1500)
    assert 0 < len(ctx) <= 1500 + 20 and "(page: /" in ctx


# ---------- provider failover ----------
def provider(name, models=("m",)):
    return llm.Provider(name, f"https://{name}.test/v1", "k", list(models))


def test_failover_skips_rate_limited_provider_and_cools_it_down():
    llm._cooldown.clear()
    seen = []

    def handler(request):
        seen.append(request.url.host)
        if request.url.host == "a.test":
            return httpx.Response(429, text="rate limited")
        return httpx.Response(200, text=sse_body(text_chunk("Hello "), text_chunk("there")))

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    events = collect(llm.stream_completion([{"role": "user", "content": "hi"}], providers=[provider("a"), provider("b")], client=client))
    assert "".join(e["text"] for e in events if e["type"] == "text") == "Hello there"
    assert events[-1] == {"type": "meta", "provider": "b", "model": "m"}
    assert not llm._available(("a", "m"))

    # Next turn goes straight to the healthy provider.
    seen.clear()
    collect(llm.stream_completion([{"role": "user", "content": "hi"}], providers=[provider("a"), provider("b")], client=client))
    assert seen == ["b.test"]
    llm._cooldown.clear()


def test_all_providers_failing_raises():
    llm._cooldown.clear()
    client = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(503, text="down")))
    with pytest.raises(llm.ProviderError):
        collect(llm.stream_completion([{"role": "user", "content": "hi"}], providers=[provider("a"), provider("b")], client=client))
    llm._cooldown.clear()


def test_no_provider_configured_raises():
    with pytest.raises(llm.ProviderError):
        collect(llm.stream_completion([], providers=[]))


def test_streamed_tool_call_fragments_are_assembled():
    llm._cooldown.clear()
    body = sse_body(
        {"choices": [{"delta": {"tool_calls": [{"index": 0, "id": "c1", "function": {"name": "search_site", "arguments": '{"que'}}]}}]},
        {"choices": [{"delta": {"tool_calls": [{"index": 0, "function": {"arguments": 'ry": "SAP"}'}}]}}]},
    )
    client = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(200, text=body)))
    events = collect(llm.stream_completion([], tools=[{}], providers=[provider("a")], client=client))
    assert events[0] == {"type": "tool_calls", "calls": [{"id": "c1", "name": "search_site", "arguments": {"query": "SAP"}}]}


def test_tool_calls_without_index_are_kept_apart():
    llm._cooldown.clear()
    body = sse_body({"choices": [{"delta": {"tool_calls": [
        {"id": "x", "function": {"name": "search_site", "arguments": '{"query": "a"}'}},
        {"id": "y", "function": {"name": "search_site", "arguments": '{"query": "b"}'}},
    ]}}]})
    client = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(200, text=body)))
    calls = collect(llm.stream_completion([], tools=[{}], providers=[provider("a")], client=client))[0]["calls"]
    assert [c["arguments"]["query"] for c in calls] == ["a", "b"]


def test_configured_providers_order_and_openrouter_model_fallback(monkeypatch):
    for k in ("GEMINI_API_KEY", "GROQ_API_KEY", "MISTRAL_API_KEY", "OPENROUTER_API_KEY", "SOL_CUSTOM_BASE_URL", "SOL_PROVIDER_ORDER", "SOL_OPENROUTER_MODELS"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    monkeypatch.setenv("OPENROUTER_MODELS", "a:free,b:free")
    monkeypatch.setenv("GROQ_API_KEY", "y")
    ps = llm.configured_providers()
    assert [p.name for p in ps] == ["groq", "openrouter"]
    assert ps[1].models == ["a:free", "b:free"]
    monkeypatch.setenv("SOL_PROVIDER_ORDER", "openrouter,groq")
    assert [p.name for p in llm.configured_providers()] == ["openrouter", "groq"]


# ---------- chat endpoint ----------
@pytest.fixture
def chat_app(monkeypatch):
    mongomock_motor = pytest.importorskip("mongomock_motor")
    from fastapi import FastAPI
    import chat

    fake_db = mongomock_motor.AsyncMongoMockClient()["t"]
    monkeypatch.setattr(chat, "db", fake_db)
    monkeypatch.setattr(chat, "notify_lead", lambda doc: asyncio.sleep(0))
    monkeypatch.setattr(chat, "configured_providers", lambda: [provider("a")])
    chat._hits.clear()
    app = FastAPI()
    app.include_router(chat.router)
    return chat, app, fake_db


def parse_sse(text):
    return [json.loads(line[5:]) for line in text.split("\n") if line.startswith("data:")]


def test_chat_books_demo_through_tool_and_streams_answer(chat_app, monkeypatch):
    from fastapi.testclient import TestClient
    chat, app, fake_db = chat_app
    seen_messages = []

    async def fake_stream(messages, tools=None, **kw):
        seen_messages.append([dict(m) for m in messages])
        if len(seen_messages) == 1:
            yield {"type": "tool_calls", "calls": [{"id": "t1", "name": "create_demo_request", "arguments": {"name": "Ada Lovelace", "email": "ada@acme.com", "company": "Acme"}}]}
        else:
            yield {"type": "text", "text": "Thanks Ada, "}
            yield {"type": "text", "text": "you're booked."}
        yield {"type": "meta", "provider": "a", "model": "m"}

    monkeypatch.setattr(chat, "stream_completion", fake_stream)
    r = TestClient(app).post("/api/chat/stream", json={"session_id": "sess-123", "message": "Yes please book the SAP archiving demo", "language": "fr", "page": "/products/sap-archiving"})
    events = parse_sse(r.text)
    assert any(e.get("event") == "demo_booked" and e["company"] == "Acme" for e in events)
    assert "".join(e.get("delta", "") for e in events) == "Thanks Ada, you're booked."
    assert events[-1] == {"done": True}

    system = seen_messages[0][0]["content"]
    assert "Reply in French" in system and "/products/sap-archiving" in system and "Site knowledge" in system
    # Round two carries the tool result back to the model.
    assert seen_messages[1][-1]["role"] == "tool" and json.loads(seen_messages[1][-1]["content"])["ok"] is True

    async def check():
        sub = await fake_db.submissions.find_one({"source": "chat"})
        msgs = await fake_db.chat_messages.find({"session_id": "sess-123"}).to_list(10)
        return sub, msgs
    sub, msgs = run_sync(check())
    assert sub["type"] == "demo" and sub["email"] == "ada@acme.com"
    assert [m["role"] for m in msgs] == ["user", "assistant"] and msgs[1]["provider"] == "a"


def test_chat_rejects_invalid_email_without_saving(chat_app):
    chat, _, fake_db = chat_app
    out = run_sync(chat.create_demo_request("s", {"name": "Bo", "email": "not-an-email", "company": "Acme"}))
    assert out["ok"] is False
    assert run_sync(fake_db.submissions.count_documents({})) == 0


def test_chat_reports_error_when_every_provider_fails(chat_app, monkeypatch):
    from fastapi.testclient import TestClient
    chat, app, _ = chat_app

    async def failing(messages, tools=None, **kw):
        raise llm.ProviderError("all down")
        yield  # pragma: no cover

    monkeypatch.setattr(chat, "stream_completion", failing)
    events = parse_sse(TestClient(app).post("/api/chat/stream", json={"session_id": "sess-err", "message": "hello"}).text)
    assert events == [{"error": "The concierge is temporarily unavailable. Please try again."}]


def test_chat_rate_limits_a_session(chat_app, monkeypatch):
    from fastapi.testclient import TestClient
    chat, app, _ = chat_app
    monkeypatch.setitem(chat.LIMITS, "session", (2, 300))

    async def quick(messages, tools=None, **kw):
        yield {"type": "text", "text": "ok"}

    monkeypatch.setattr(chat, "stream_completion", quick)
    client = TestClient(app)
    codes = [client.post("/api/chat/stream", json={"session_id": "sess-rl", "message": "hi"}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_chat_503_without_providers(chat_app, monkeypatch):
    from fastapi.testclient import TestClient
    chat, app, _ = chat_app
    monkeypatch.setattr(chat, "configured_providers", lambda: [])
    assert TestClient(app).post("/api/chat/stream", json={"session_id": "sess-none", "message": "hi"}).status_code == 503


def test_admin_lists_conversations_with_leads(monkeypatch):
    mongomock_motor = pytest.importorskip("mongomock_motor")
    import admin

    fake_db = mongomock_motor.AsyncMongoMockClient()["t"]
    monkeypatch.setattr(admin, "db", fake_db)

    async def seed_and_list():
        await fake_db.chat_messages.insert_many([
            {"session_id": "s1", "role": "user", "content": "Retire SAP?", "created_at": "2026-09-01T10:00:00", "page": "/products"},
            {"session_id": "s1", "role": "assistant", "content": "Yes.", "created_at": "2026-09-01T10:00:05", "model": "gemini-2.5-flash"},
            {"session_id": "s2", "role": "user", "content": "Jobs?", "created_at": "2026-09-02T10:00:00"},
        ])
        await fake_db.submissions.insert_one({"source": "chat", "source_page": "chat:s1", "type": "demo"})
        return await admin.list_chats(page=1, page_size=25, q=None), await admin.get_chat("s1")

    listing, transcript = run_sync(seed_and_list())
    assert listing["total"] == 2
    assert [i["session_id"] for i in listing["items"]] == ["s2", "s1"]
    s1 = listing["items"][1]
    assert s1["first_question"] == "Retire SAP?" and s1["lead"] == "demo" and s1["models"] == ["gemini-2.5-flash"] and s1["messages"] == 2
    assert [m["role"] for m in transcript] == ["user", "assistant"]
