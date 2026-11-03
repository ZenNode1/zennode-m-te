export interface LatencySummary {
  samples: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
}

/** Nearest-rank percentile of an ascending list. */
export function percentile(sortedAsc: readonly number[], p: number): number {
  if (sortedAsc.length === 0) {
    throw new Error("Cannot compute a percentile of an empty list");
  }
  if (p <= 0 || p > 100) {
    throw new Error(`Percentile must be in (0, 100], got ${p}`);
  }
  const rank = Math.ceil((p / 100) * sortedAsc.length);
  return sortedAsc[rank - 1] as number;
}

export function summarize(durationsMs: readonly number[]): LatencySummary {
  const sorted = [...durationsMs].sort((a, b) => a - b);
  return {
    samples: sorted.length,
    p50Ms: Math.round(percentile(sorted, 50)),
    p95Ms: Math.round(percentile(sorted, 95)),
    maxMs: Math.round(sorted[sorted.length - 1] as number),
  };
}
