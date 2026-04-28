import asyncio
import random
import aiosqlite
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "telemetry.db"

DEVICES = ["anafi", "bebop", "disco", "skycontroller"]
VALID_STATUSES = ["flying", "landing", "idle", "takeoff"]

# Intentional traps for validation testing
TRAP_EVENTS = [
    {
        "device": "anafi",
        "status": "unknown",
        "battery": 78,
        "timestamp": "2026-01-01T09:00:00+00:00",
    },
    {
        "device": "bebop",
        "status": "idle",
        "battery": -5,
        "timestamp": "2026-01-03T08:00:00+00:00",
    },
    # Intentionally out-of-order timestamp (earlier than some already inserted)
    {
        "device": "anafi",
        "status": "flying",
        "battery": 100,
        "timestamp": "2025-12-31T23:59:00+00:00",
    },
]

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    device    TEXT    NOT NULL,
    status    TEXT    NOT NULL,
    battery   INTEGER NOT NULL,
    timestamp TEXT    NOT NULL
);
"""

CREATE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_device ON events (device);",
    "CREATE INDEX IF NOT EXISTS idx_status ON events (status);",
    "CREATE INDEX IF NOT EXISTS idx_timestamp ON events (timestamp);",
    "CREATE INDEX IF NOT EXISTS idx_device_status ON events (device, status);",
]


def _generate_seed(n: int = 10_000) -> list[dict]:
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    rows = []
    for i in range(n):
        offset_minutes = random.randint(0, 60 * 24 * 90)  # 90 days spread
        ts = base + timedelta(minutes=offset_minutes)
        rows.append(
            {
                "device": random.choice(DEVICES),
                "status": random.choice(VALID_STATUSES),
                "battery": random.randint(0, 100),
                "timestamp": ts.isoformat(),
            }
        )
    return rows


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_TABLE)
        for idx_sql in CREATE_INDEXES:
            await db.execute(idx_sql)

        cursor = await db.execute("SELECT COUNT(*) FROM events")
        (count,) = await cursor.fetchone()
        if count == 0:
            seed_rows = _generate_seed(10_000) + TRAP_EVENTS
            await db.executemany(
                "INSERT INTO events (device, status, battery, timestamp) VALUES (:device, :status, :battery, :timestamp)",
                seed_rows,
            )
        await db.commit()


def get_db_path() -> Path:
    return DB_PATH
