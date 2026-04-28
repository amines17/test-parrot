import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartEntry {
  status: string;
  count: number;
}

interface Props {
  data: ChartEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  flying: "#3b82f6",
  landing: "#f59e0b",
  idle: "#10b981",
  takeoff: "#8b5cf6",
};

function getColor(status: string): string {
  return STATUS_COLORS[status] ?? "#6b7280";
}

export function BatteryChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="chart-empty">Aucune donnée</div>;
  }

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">Événements par status</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
            }}
            formatter={(value) => [Number(value).toLocaleString(), "événements"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={getColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
