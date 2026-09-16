export interface MidwayGenerationOptions {
  apiKey: string;
  model: string;
  prompt: string;
  timeoutMs: number;
  fetch?: typeof globalThis.fetch;
}

/** Calls the user-selected Midway service; never includes credentials in errors. */
export async function generateMidwayJson(options: MidwayGenerationOptions): Promise<unknown[]> {
  const deepseek = options.model.startsWith('deepseek-');
  const url = new URL(deepseek
    ? 'https://mediocre-new-api.midway.run/v1/chat/completions'
    : `https://mediocre-new-api.midway.run/v1beta/models/${encodeURIComponent(options.model)}:generateContent`);
  if (!deepseek) url.searchParams.set('key', options.apiKey);
  let response: Response;
  try {
    response = await (options.fetch ?? globalThis.fetch)(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(deepseek ? {Authorization: `Bearer ${options.apiKey}`} : {}) },
      body: JSON.stringify(deepseek ? {
        model: options.model,
        messages: [{role:'user', content:options.prompt}],
        temperature: 0.2,
        max_tokens: 8192,
        thinking: {type: 'disabled'},
      } : {
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
    choices?: Array<{finish_reason?: string; message?: {content?: string}}>;
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  };
  const candidate = data.candidates?.[0];
  const choice = data.choices?.[0];
  if (deepseek ? choice?.finish_reason !== 'stop' : candidate?.finishReason !== 'STOP') {
    throw new Error('Midway returned incomplete or blocked content');
  }
  const output = deepseek ? choice?.message?.content ?? ''
    : candidate?.content?.parts?.filter(part => !part.thought).map(part => part.text ?? '').join('') ?? '';
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch { throw new Error('Midway returned invalid JSON'); }
  if (!Array.isArray(parsed)) throw new Error('Midway returned a non-array JSON value');
  return parsed;
}
