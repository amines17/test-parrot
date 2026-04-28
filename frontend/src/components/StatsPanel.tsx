import type { StatsResponse } from "../types";

interface Props {
  data: StatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function StatsPanel({ data, loading, error }: Props) {
  if (error) return <div className="error-banner">Stats indisponibles : {error}</div>;

  return (
    <div className="stats-panel">
      <div className="stat-card">
        <span className="stat-label">Événements total</span>
        <span className="stat-value">
          {loading ? "…" : (data?.total.toLocaleString() ?? "—")}
        </span>
      </div>

      <div className="stat-card">
        <span className="stat-label">Batterie moyenne</span>
        <span className="stat-value">
          {loading ? "…" : data ? `${data.avg_battery}%` : "—"}
        </span>
      </div>

      <div className="stat-card stat-breakdown">
        <span className="stat-label">Répartition par status</span>
        {loading && <span>…</span>}
        {!loading && data && (
          <ul className="breakdown-list">
            {data.by_status.map((s) => (
              <li key={s.status}>
                <span className={`chip chip-status chip-${s.status}`}>
                  {s.status}
                </span>
                <span className="breakdown-count">{s.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
