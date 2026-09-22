import csv
import io
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr

from database import db, now_iso
from auth import get_current_admin
from emailer import ALERT_TYPES, get_alert_recipient

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])

CSV_FIELDS = ["id", "created_at", "type", "name", "email", "company", "job_title", "phone", "interest", "role", "resource", "message", "source", "source_page"]


def _query(type: Optional[str], q: Optional[str]) -> dict:
    query: dict = {}
    if type and type != "all":
        query["type"] = type
    if q:
        rx = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [{"name": rx}, {"email": rx}, {"company": rx}, {"message": rx}, {"interest": rx}, {"role": rx}, {"resource": rx}]
    return query


@router.get("/stats")
async def stats():
    total = await db.submissions.count_documents({})
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    last_7 = await db.submissions.count_documents({"created_at": {"$gte": week_ago}})
    pipeline = [{"$group": {"_id": "$type", "count": {"$sum": 1}}}]
    by_type = {r["_id"]: r["count"] async for r in db.submissions.aggregate(pipeline)}
    chat_leads = await db.submissions.count_documents({"source": "chat"})
    alerts_sent = await db.notifications.count_documents({"status": "sent"})
    return {"total": total, "last_7_days": last_7, "by_type": by_type, "chat_leads": chat_leads, "alerts_sent": alerts_sent}


@router.get("/submissions")
async def list_submissions(type: Optional[str] = None, q: Optional[str] = None, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200)):
    query = _query(type, q)
    total = await db.submissions.count_documents(query)
    cursor = db.submissions.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    items = await cursor.to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/submissions/export")
async def export_submissions(type: Optional[str] = None, q: Optional[str] = None):
    docs = await db.submissions.find(_query(type, q), {"_id": 0}).sort("created_at", -1).to_list(10000)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for d in docs:
        writer.writerow({k: d.get(k, "") for k in CSV_FIELDS})
    buf.seek(0)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="solix-leads-{stamp}.csv"'})


@router.delete("/submissions/{submission_id}", status_code=204)
async def delete_submission(submission_id: str):
    res = await db.submissions.delete_one({"id": submission_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return None


class AlertSettings(BaseModel):
    alert_email: Optional[EmailStr] = None


@router.get("/settings")
async def get_settings():
    return {"alert_email": await get_alert_recipient(), "alert_types": sorted(ALERT_TYPES)}


@router.put("/settings")
async def update_settings(body: AlertSettings):
    await db.settings.update_one({"key": "alerts"}, {"$set": {"alert_email": body.alert_email, "updated_at": now_iso()}}, upsert=True)
    return {"alert_email": await get_alert_recipient(), "alert_types": sorted(ALERT_TYPES)}


@router.get("/notifications")
async def list_notifications(limit: int = Query(20, le=100)) -> List[dict]:
    return await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
