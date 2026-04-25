const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_WHISPER_MODEL = 'whisper-large-v3';

export class GroqError extends Error {
  status: number;
  upstreamStatus?: number;
  constructor(message: string, status: number, upstreamStatus?: number) {
    super(message);
    this.name = 'GroqError';
    this.status = status;
    this.upstreamStatus = upstreamStatus;
  }
}

function mapStatus(status: number): { code: number; message: string } {
  if (status === 400) return { code: 400, message: 'Invalid request to AI service.' };
  if (status === 401 || status === 403) return { code: 503, message: 'AI authentication failed. Check the GROQ_API_KEY.' };
  if (status === 404) return { code: 503, message: `AI model "${GROQ_MODEL}" is not available for this API key.` };
  if (status === 429) return { code: 429, message: 'AI rate limit reached. Please retry in a moment.' };
  if (status >= 500) return { code: 502, message: 'Upstream AI service is temporarily unavailable.' };
  return { code: 500, message: 'AI service error.' };
}

export function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new GroqError('AI service not configured. Add a GROQ_API_KEY secret.', 503);
  }
  return key;
}

interface GroqOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
}

export async function groqGenerate(
  prompt: string,
  opts: GroqOptions = {},
): Promise<string> {
  const apiKey = getApiKey();

  const messages: { role: string; content: string }[] = [];
  if (opts.systemInstruction) {
    messages.push({ role: 'system', content: opts.systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxOutputTokens ?? 512,
  };

  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Groq error', response.status, text);
    const { code, message } = mapStatus(response.status);
    throw new GroqError(message, code, response.status);
  }

  const data = await response.json();
  return (data?.choices?.[0]?.message?.content ?? '').trim();
}

export async function groqGenerateJSON<T = unknown>(
  prompt: string,
  opts: Omit<GroqOptions, 'jsonMode'> = {},
): Promise<T> {
  const raw = await groqGenerate(prompt, { ...opts, jsonMode: true });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error('Groq JSON parse failed:', cleaned);
    throw new GroqError('AI returned malformed JSON.', 502);
  }
}

export interface GroqMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function groqStream(
  messages: GroqMessage[],
  opts: GroqOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey();

  const apiMessages: { role: string; content: string }[] = [];
  if (opts.systemInstruction) {
    apiMessages.push({ role: 'system', content: opts.systemInstruction });
  }
  for (const m of messages) {
    if (typeof m.content === 'string' && m.content.length > 0) {
      apiMessages.push({ role: m.role, content: m.content });
    }
  }

  const body = {
    model: GROQ_MODEL,
    messages: apiMessages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxOutputTokens ?? 1024,
    stream: true,
  };

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    console.error('Groq stream error', response.status, text);
    const { code, message } = mapStatus(response.status);
    throw new GroqError(message, code, response.status);
  }

  return response.body;
}

export async function groqTranscribe(
  audioBase64: string,
  mimeType: string = 'audio/webm',
): Promise<string> {
  const apiKey = getApiKey();

  const buffer = Buffer.from(audioBase64, 'base64');
  const ext = mimeType.includes('mp4') ? 'm4a'
    : mimeType.includes('ogg') ? 'ogg'
    : mimeType.includes('mp3') ? 'mp3'
    : mimeType.includes('wav') ? 'wav'
    : 'webm';

  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  form.append('file', blob, `audio.${ext}`);
  form.append('model', GROQ_WHISPER_MODEL);
  form.append('response_format', 'text');

  const response = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Groq transcribe error', response.status, text);
    throw new GroqError('Transcription failed.', response.status >= 500 ? 502 : 503, response.status);
  }

  const text = await response.text();
  return text.trim();
}

export { GROQ_MODEL };
