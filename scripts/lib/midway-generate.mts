export interface MidwayGenerationOptions {
  apiKey: string;
  model: string;
  prompt: string;
  timeoutMs: number;
  fetch?: typeof globalThis.fetch;
}

/** Calls the user-selected Midway service; never includes credentials in errors. */
export async function generateMidwayJson(options: MidwayGenerationOptions): Promise<unknown[]> {
  const url = new URL(`https://mediocre-new-api.midway.run/v1beta/models/${encodeURIComponent(options.model)}:generateContent`);
  url.searchParams.set('key', options.apiKey);
  let response: Response;
  try {
    response = await (options.fetch ?? globalThis.fetch)(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 16384, ...(options.model === 'gemini-3.5-flash' ? {thinkingConfig:{thinkingLevel:'MINIMAL'}} : {}) },
      }),
      signal: AbortSignal.timeout(options.timeoutMs),
      redirect: 'error',
    });
  } catch {
    throw new Error('Midway request failed or timed out');
  }
  if (!response.ok) {
    // Only status/code are retained. Proxy bodies may echo authenticated URLs.
    const body = await response.json().catch(() => ({})) as { error?: { code?: unknown } };
    const code = typeof body.error?.code === 'string' && !body.error.code.includes(options.apiKey) && /^[a-zA-Z0-9_-]{1,60}$/.test(body.error.code) ? body.error.code : 'request_failed';
    throw new Error(`Midway HTTP ${response.status}: ${code}`);
  }
  const data = await response.json() as {
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  };
  const candidate = data.candidates?.[0];
  if (!candidate || candidate.finishReason !== 'STOP') throw new Error('Midway returned incomplete or blocked content');
  const output = candidate.content?.parts?.filter(part => !part.thought).map(part => part.text ?? '').join('') ?? '';
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch { throw new Error('Midway returned invalid JSON'); }
  if (!Array.isArray(parsed)) throw new Error('Midway returned a non-array JSON value');
  return parsed;
}
