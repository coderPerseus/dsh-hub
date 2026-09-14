/** Exit code 2 is reserved for unavailable Spark quota/model, not invalid generated data. */
export const SPARK_UNAVAILABLE_EXIT = 2;

export function isSparkUnavailable(log: string): boolean {
  return /hit your usage limit|usage_limit_reached|insufficient_quota|model_not_found|unsupported_model|model[^\n]*(?:not supported|not available)/i.test(log);
}

export async function enrichWithFallback(run: (provider: 'codex' | 'midway') => Promise<number>): Promise<number> {
  const status = await run('codex');
  return status === SPARK_UNAVAILABLE_EXIT ? run('midway') : status;
}
