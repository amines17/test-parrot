import json
import logging
import time

from fastapi import APIRouter, Response
from app.models.event import StatsOut
from app.services import event_service

logger = logging.getLogger("telemetry.stats")
router = APIRouter()


@router.get("/stats", response_model=StatsOut)
async def get_stats(response: Response) -> StatsOut:
    start = time.perf_counter()

    result = await event_service.get_stats()

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Response-Time"] = f"{elapsed_ms}ms"

    logger.info(
        json.dumps(
            {
                "endpoint": "GET /stats",
                "total_events": result.total,
                "avg_battery": result.avg_battery,
                "status_count": len(result.by_status),
                "elapsed_ms": elapsed_ms,
            }
        )
    )

    return result
