from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
from knowledge import CONCIERGE_SYSTEM_PROMPT

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
CHAT_MODEL = ("openai", "gpt-5.4-mini")
HISTORY_LIMIT = 24

app = FastAPI(title="Solix Technologies API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("solix")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


SubmissionType = Literal["demo", "contact", "newsletter", "career", "partner", "download"]


class SubmissionCreate(BaseModel):
    type: SubmissionType
    email: EmailStr
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    interest: Optional[str] = None
    message: Optional[str] = None
    role: Optional[str] = None
    resource: Optional[str] = None
    source_page: Optional[str] = None


class Submission(SubmissionCreate):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=6, max_length=80)
    message: str = Field(min_length=1, max_length=2000)


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    session_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: str


@api_router.get("/")
async def root():
    return {"service": "solix-api", "status": "ok"}


@api_router.post("/submissions", response_model=Submission, status_code=201)
async def create_submission(payload: SubmissionCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await db.submissions.insert_one(dict(doc))
    logger.info("submission %s from %s", doc["type"], doc["email"])
    return Submission(**doc)


@api_router.get("/submissions", response_model=List[Submission])
async def list_submissions(type: Optional[SubmissionType] = Query(default=None), limit: int = Query(default=100, le=500)):
    query = {"type": type} if type else {}
    docs = await db.submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [Submission(**d) for d in docs]


@api_router.get("/chat/{session_id}", response_model=List[ChatMessage])
async def get_chat_history(session_id: str):
    docs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return [ChatMessage(**d) for d in docs]


@api_router.delete("/chat/{session_id}", status_code=204)
async def clear_chat_history(session_id: str):
    await db.chat_messages.delete_many({"session_id": session_id})
    return None


async def save_message(session_id: str, role: str, content: str) -> None:
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": role,
        "content": content,
        "created_at": now_iso(),
    })


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@api_router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    if not LLM_KEY:
        raise HTTPException(status_code=503, detail="AI concierge is not configured")

    history = await db.chat_messages.find(
        {"session_id": req.session_id}, {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", 1).to_list(HISTORY_LIMIT)

    initial = [{"role": "system", "content": CONCIERGE_SYSTEM_PROMPT}] + [
        {"role": m["role"], "content": m["content"]} for m in history
    ]

    chat = LlmChat(
        api_key=LLM_KEY,
        session_id=req.session_id,
        system_message=CONCIERGE_SYSTEM_PROMPT,
        initial_messages=initial,
    ).with_model(*CHAT_MODEL)

    async def generate():
        await save_message(req.session_id, "user", req.message)
        full = ""
        try:
            async for event in chat.stream_message(UserMessage(text=req.message)):
                if isinstance(event, TextDelta):
                    full += event.content
                    yield sse({"delta": event.content})
                elif isinstance(event, StreamDone):
                    break
        except Exception as exc:
            logger.exception("chat stream failed")
            yield sse({"error": "The concierge is temporarily unavailable. Please try again."})
            return
        if full:
            await save_message(req.session_id, "assistant", full)
        yield sse({"done": True})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def ensure_indexes():
    await db.submissions.create_index("created_at")
    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
