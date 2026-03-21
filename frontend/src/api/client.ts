const API_URL = import.meta.env.VITE_API_URL || '/api';

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = tokenGetter ? await tokenGetter() : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

import type {
  Seller,
  Lead,
} from '../types';

export interface DocumentRecord {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

export const companies = {
  listDocuments: (companyId: string) =>
    request<DocumentRecord[]>(`/companies/${companyId}/documents`),
  uploadDocument: (companyId: string, text: string, metadata?: Record<string, unknown>) =>
    request<{ id: string; namespace: string; status: string }>(
      `/companies/${companyId}/documents`,
      { method: 'POST', body: JSON.stringify({ text, metadata }) },
    ),
  deleteDocument: (companyId: string, documentId: string) =>
    request<void>(`/companies/${companyId}/documents/${documentId}`, { method: 'DELETE' }),
};

export const auth = {
  me: () => request<Seller>('/me'),
};

export interface ChatMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string };
    audioMessage?: Record<string, unknown>;
    videoMessage?: Record<string, unknown>;
    documentMessage?: { fileName?: string };
    interactiveMessage?: { body?: { text?: string } };
  };
  messageTimestamp: number;
  pushName?: string;
  messageType?: string;
}

export interface ChatLastMessage {
  key: { fromMe: boolean; remoteJid: string };
  messageType: string;
  message?: ChatMessage['message'];
  messageTimestamp?: number;
}

export interface EvolutionChat {
  id: string;
  remoteJid: string;
  pushName?: string | null;
  profilePicUrl?: string | null;
  updatedAt?: string;
  lastMessage?: ChatLastMessage | null;
  unreadCount?: number;
}

export interface MessagesResponse {
  records: ChatMessage[];
  total: number;
  pages: number;
}

export const chat = {
  findChats: () => request<EvolutionChat[]>('/chat/chats'),
  findMessages: (remoteJid: string, page = 1, limit = 50) =>
    request<MessagesResponse>(
      `/chat/messages/${encodeURIComponent(remoteJid)}?page=${page}&limit=${limit}`,
    ),
  sendMessage: (remoteJid: string, text: string) =>
    request<{ status: string }>(`/chat/messages/${encodeURIComponent(remoteJid)}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};

export const sellers = {
  list: () => request<Seller[]>('/sellers'),
  get: (id: string) => request<Seller>(`/sellers/${id}`),
  update: (id: string, data: Partial<Seller>) =>
    request<Seller>(`/sellers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  listDocuments: (sellerId: string) =>
    request<DocumentRecord[]>(`/sellers/${sellerId}/documents`),
  uploadDocument: (sellerId: string, text: string, metadata?: Record<string, unknown>) =>
    request<{ id: string; namespace: string; status: string }>(
      `/sellers/${sellerId}/documents`,
      { method: 'POST', body: JSON.stringify({ text, metadata }) },
    ),
  deleteDocument: (sellerId: string, documentId: string) =>
    request<void>(`/sellers/${sellerId}/documents/${documentId}`, { method: 'DELETE' }),
  toggleActive: (id: string, isActive: boolean) =>
    request<Seller>(`/sellers/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
};

export const leads = {
  findByJid: (sellerId: string, remoteJid: string) =>
    request<Lead | null>(`/sellers/${sellerId}/leads/by-jid/${encodeURIComponent(remoteJid)}`),
  update: (id: string, data: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
