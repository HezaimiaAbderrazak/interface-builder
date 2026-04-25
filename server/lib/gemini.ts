const GEMINI_MODEL = 'gemini-2.0-flash';

export class GeminiError extends Error {
  status: number;
  upstreamStatus?: number;
  constructor(message: string, status: number, upstreamStatus?: number) {
    super(message);
    this.status = status;
    this.upstreamStatus = upstreamStatus;
  }
}

function mapStatus(status: number): { code: number; message: string } {
  if (status === 400) return { code: 400, message: 'Invalid request to AI service.' };
  if (status === 401 || status === 403) return { code: 503, message: 'AI authentication failed. Check the GOOGLE_API_KEY.' };
  if (status === 404) return { code: 503, message: `AI model "${GEMINI_MODEL}" is not available for this API key.` };
  if (status === 429) return { code: 429, message: 'AI rate limit reached. Please retry in a moment.' };
  if (status >= 500) return { code: 502, message: 'Upstream AI service is temporarily unavailable.' };
  return { code: 500, message: 'AI service error.' };
}

interface GeminiOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'text/plain' | 'application/json';
  signal?: AbortSignal;
}

export function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new GeminiError('AI service not configured. Add a GOOGLE_API_KEY secret.', 503);
  }
  return key;
}

export async function geminiGenerate(
  prompt: string,
  opts: GeminiOptions = {},
): Promise<string> {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.maxOutputTokens ?? 512,
    },
  };
  if (opts.systemInstruction) {
    body.system_instruction = { parts: [{ text: opts.systemInstruction }] };
  }
  if (opts.responseMimeType) {
    body.generationConfig.responseMimeType = opts.responseMimeType;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Gemini error', response.status, text);
    const { code, message } = mapStatus(response.status);
    throw new GeminiError(message, code, response.status);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  return text.trim();
}

export async function geminiGenerateJSON<T = unknown>(
  prompt: string,
  opts: Omit<GeminiOptions, 'responseMimeType'> = {},
): Promise<T> {
  const raw = await geminiGenerate(prompt, { ...opts, responseMimeType: 'application/json' });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error('Gemini JSON parse failed:', cleaned);
    throw new GeminiError('AI returned malformed JSON.', 502);
  }
}

export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function geminiStream(
  messages: GeminiMessage[],
  opts: GeminiOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

  const contents = messages
    .filter((m) => typeof m.content === 'string' && m.content.length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
    },
  };
  if (opts.systemInstruction) {
    body.system_instruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    console.error('Gemini stream error', response.status, text);
    const { code, message } = mapStatus(response.status);
    throw new GeminiError(message, code, response.status);
  }

  return response.body;
}

export { GEMINI_MODEL };
