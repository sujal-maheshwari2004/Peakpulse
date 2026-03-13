from fastapi import APIRouter, HTTPException
import asyncio

from app.models.schemas import QueryRequest, QueryResponse, BulkQueryRequest, BulkQueryResponse
from app.agents.graph import run_pipeline

router = APIRouter()


@router.get("/ping")
def ping():
    return {"status": "alive"}


@router.post("/analyze", response_model=QueryResponse)
async def analyze_query(request: QueryRequest):
    try:
        return await run_pipeline(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/bulk", response_model=BulkQueryResponse)
async def analyze_bulk(request: BulkQueryRequest):
    if len(request.queries) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 queries per bulk request")
    try:
        results = await asyncio.gather(*[run_pipeline(q) for q in request.queries])
        return BulkQueryResponse(results=list(results), total=len(results))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))