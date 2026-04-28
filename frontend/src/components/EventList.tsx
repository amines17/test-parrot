import type { EventListResponse } from "../types";

interface Props {
  data: EventListResponse | null;
  loading: boolean;
  error: string | null;
  page: number;
  sort: "asc" | "desc";
  onPageChange: (p: number) => void;
  onSortToggle: () => void;
}

function BatteryBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct > 60 ? "var(--green)" : pct > 30 ? "var(--yellow)" : "var(--red)";
  return (
    <div className="battery-bar-wrapper" title={`${value}%`}>
      <div
        className="battery-bar-fill"
        style={{ width: `${pct}%`, background: color }}
      />
      <span className="battery-bar-label">{value}%</span>
    </div>
  );
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return ts;
  }
}

export function EventList({
  data,
  loading,
  error,
  page,
  sort,
  onPageChange,
  onSortToggle,
}: Props) {
  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  if (error) {
    return <div className="error-banner">Erreur : {error}</div>;
  }

  return (
    <section className="event-list">
      <div className="event-list-header">
        <span className="result-count">
          {data ? `${data.total.toLocaleString()} événements` : "—"}
          {data && data.anomaly_count > 0 && (
            <span className="anomaly-badge">
              {data.anomaly_count} anomalie{data.anomaly_count > 1 ? "s" : ""}
            </span>
          )}
        </span>
        {loading && <span className="spinner" aria-label="Chargement..." />}
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Device</th>
            <th>Status</th>
            <th>Batterie</th>
            <th>
              <button className="sort-btn" onClick={onSortToggle}>
                Timestamp {sort === "desc" ? "↓" : "↑"}
              </button>
            </th>
            <th>Anomalie</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((event) => (
            <tr
              key={event.id}
              className={event.is_anomaly ? "row-anomaly" : ""}
            >
              <td>{event.id}</td>
              <td>
                <span className="chip chip-device">{event.device}</span>
              </td>
              <td>
                <span className={`chip chip-status chip-${event.status}`}>
                  {event.status}
                </span>
              </td>
              <td>
                <BatteryBar value={event.battery} />
              </td>
              <td className="ts">{formatTimestamp(event.timestamp)}</td>
              <td>
                {event.is_anomaly && (
                  <span
                    className="anomaly-icon"
                    title={event.anomaly_reason ?? ""}
                  >
                    ⚠
                  </span>
                )}
              </td>
            </tr>
          ))}
          {data?.items.length === 0 && !loading && (
            <tr>
              <td colSpan={6} className="empty-state">
                Aucun événement correspondant
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={page === 0 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          ← Précédent
        </button>
        <span>
          Page {page + 1} / {Math.max(1, totalPages)}
        </span>
        <button
          disabled={page + 1 >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant →
        </button>
      </div>
    </section>
  );
}
