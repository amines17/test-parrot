from datetime import datetime
from pydantic import BaseModel, ConfigDict

KNOWN_STATUSES = {"flying", "landing", "idle", "takeoff"}


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device: str
    status: str
    battery: int
    timestamp: datetime
    is_anomaly: bool = False
    anomaly_reason: str | None = None


class EventRaw(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device: str
    status: str
    battery: int
    timestamp: datetime

    def to_out(self) -> EventOut:
        reasons: list[str] = []
        if self.battery < 0 or self.battery > 100:
            reasons.append(f"battery out of range ({self.battery})")
        if self.status not in KNOWN_STATUSES:
            reasons.append(f"unknown status '{self.status}'")
        return EventOut(
            id=self.id,
            device=self.device,
            status=self.status,
            battery=self.battery,
            timestamp=self.timestamp,
            is_anomaly=bool(reasons),
            anomaly_reason="; ".join(reasons) if reasons else None,
        )


class EventListResponse(BaseModel):
    items: list[EventOut]
    total: int
    limit: int
    offset: int
    anomaly_count: int = 0


class ByStatusEntry(BaseModel):
    status: str
    count: int


class StatsOut(BaseModel):
    total: int
    avg_battery: float
    by_status: list[ByStatusEntry]
