from typing import Literal
from app.models.event import EventListResponse, EventRaw, StatsOut, ByStatusEntry
from app.repositories import event_repo


async def search_events(
    device: str | None,
    status: str | None,
    limit: int,
    offset: int,
    sort: Literal["asc", "desc"],
) -> EventListResponse:
    rows, total = await event_repo.fetch_events(
        device=device,
        status=status,
        limit=limit,
        offset=offset,
        sort=sort,
    )

    parsed = [EventRaw.model_validate(r).to_out() for r in rows]
    anomaly_count = sum(1 for e in parsed if e.is_anomaly)

    return EventListResponse(
        items=parsed,
        total=total,
        limit=limit,
        offset=offset,
        anomaly_count=anomaly_count,
    )


async def get_stats() -> StatsOut:
    raw = await event_repo.fetch_stats()
    return StatsOut(
        total=raw["total"],
        avg_battery=round(raw["avg_battery"], 2),
        by_status=[ByStatusEntry(**entry) for entry in raw["by_status"]],
    )
