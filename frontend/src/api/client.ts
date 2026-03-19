const API_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

// Companies
import type {
  Company,
  CreateCompanyDto,
  Seller,
  CreateSellerDto,
} from '../types';

export const companies = {
  list: () => request<Company[]>('/companies'),
  get: (id: string) => request<Company>(`/companies/${id}`),
  create: (data: CreateCompanyDto) =>
    request<Company>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateCompanyDto>) =>
    request<Company>(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/companies/${id}`, { method: 'DELETE' }),
  uploadDocument: (companyId: string, text: string, metadata?: Record<string, unknown>) =>
    request<{ id: string; namespace: string; status: string }>(
      `/companies/${companyId}/documents`,
      { method: 'POST', body: JSON.stringify({ text, metadata }) },
    ),
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
  uploadDocument: (sellerId: string, text: string, metadata?: Record<string, unknown>) =>
    request<{ id: string; namespace: string; status: string }>(
      `/sellers/${sellerId}/documents`,
      { method: 'POST', body: JSON.stringify({ text, metadata }) },
    ),
};

