import type { FiltersState } from "../types";

const DEVICES = ["", "anafi", "bebop", "disco", "skycontroller"];
const STATUSES = ["", "flying", "landing", "idle", "takeoff"];

interface Props {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
}

export function EventFilters({ filters, onChange }: Props) {
  return (
    <div className="filters">
      <label>
        Device
        <select
          value={filters.device}
          onChange={(e) => onChange({ ...filters, device: e.target.value })}
        >
          {DEVICES.map((d) => (
            <option key={d} value={d}>
              {d || "All"}
            </option>
          ))}
        </select>
      </label>

      <label>
        Status
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "All"}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
