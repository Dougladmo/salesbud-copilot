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
  Company,
  CreateCompanyDto,
  Seller,
  CreateSellerDto,
} from '../types';

export interface DocumentRecord {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

export const companies = {
  list: () => request<Company[]>('/companies'),
  get: (id: string) => request<Company>(`/companies/${id}`),
  create: (data: CreateCompanyDto) =>
    request<Company>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateCompanyDto>) =>
    request<Company>(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/companies/${id}`, { method: 'DELETE' }),
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
  create: (data: CreateSellerDto) =>
    request<Seller>('/sellers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateSellerDto>) =>
    request<Seller>(`/sellers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/sellers/${id}`, { method: 'DELETE' }),
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
    request<Seller>(`/sellers/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  getQrCode: (id: string) =>
    request<{ pairingCode?: string; code?: string; base64?: string }>(`/sellers/${id}/qrcode`),
  getConnectionState: (id: string) =>
    request<{ instance: string; state: string }>(`/sellers/${id}/connection-state`),
};
