import { useCallback, useEffect, useMemo, useState } from "react";
import { getStats } from "../api/client";
import type { StatsResponse } from "../types";

interface ChartEntry {
  status: string;
  count: number;
}

interface UseStatsResult {
  data: StatsResponse | null;
  chartData: ChartEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useStats(tick: number): UseStatsResult {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getStats(controller.signal);
        setData(result);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [tick, refreshTick]);

  const chartData = useMemo<ChartEntry[]>(
    () =>
      data?.by_status.map((s) => ({
        status: s.status,
        count: s.count,
      })) ?? [],
    [data]
  );

  return { data, chartData, loading, error, refresh };
}
