const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('noteflow_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export const authApi = {
  register: (email: string, password: string, fullName: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<UserInfo>('/auth/me'),
};

export interface NoteFromServer {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isVoiceNote: boolean;
  voiceDuration: number | null;
  audioUrl: string | null;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; isAI: boolean }[];
}

export const notesApi = {
  list: () => request<NoteFromServer[]>('/notes'),
  create: (data: Partial<NoteFromServer>) =>
    request<NoteFromServer>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<NoteFromServer>) =>
    request<NoteFromServer>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/notes/${id}`, { method: 'DELETE' }),
};

export async function chatStream(
  messages: { role: string; content: string }[],
  conversationId?: string | null,
): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, conversationId: conversationId || null }),
  });
  return res;
}

export interface ChatConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const chatApi = {
  listConversations: () => request<ChatConversationSummary[]>('/chat/conversations'),
  getConversation: (id: string) =>
    request<{ conversation: ChatConversationSummary; messages: ChatMessageRecord[] }>(
      `/chat/conversations/${id}`,
    ),
  deleteConversation: (id: string) =>
    request<{ success: boolean }>(`/chat/conversations/${id}`, { method: 'DELETE' }),
};

export const aiApi = {
  autoTag: (data: { title?: string; content?: string; existingTags?: string[] }) =>
    request<{ tags: string[] }>('/ai/auto-tag', { method: 'POST', body: JSON.stringify(data) }),
  summarize: (data: { title?: string; content?: string }) =>
    request<{ summary: string }>('/ai/summarize', { method: 'POST', body: JSON.stringify(data) }),
  enhance: (data: { content: string }) =>
    request<{ content: string }>('/ai/enhance', { method: 'POST', body: JSON.stringify(data) }),
  search: (query: string) =>
    request<{ noteIds: string[]; explanation: string }>('/ai/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  transcribe: (audioBase64: string, mimeType: string) =>
    request<{ transcript: string }>('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64, mimeType }),
    }),
  translate: (content: string, targetLanguage: string) =>
    request<{ translated: string }>('/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ content, targetLanguage }),
    }),
};
