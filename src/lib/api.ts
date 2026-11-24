import type {
  AdminStats,
  AuditLogEntry,
  CampusAnalytics,
  CampusLocationItem,
  CategoryItem,
  ClaimRequest,
  ItemInquiry,
  ItemStatus,
  NotificationRecord,
  PublicItemReport,
  ReportType,
  UserProfile,
} from '../types';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || data.message || `Request failed (${response.status})`) as Error & {
      status?: number;
      payload?: unknown;
    };
    err.status = response.status;
    err.payload = data;
    throw err;
  }
  return data as T;
}

export const api = {
  getMetadata: () =>
    requestJson<{ categories: CategoryItem[]; locations: CampusLocationItem[] }>('/api/metadata'),

  getAnalytics: () => requestJson<CampusAnalytics>('/api/analytics'),

  getItems: (params?: { q?: string; type?: string; category?: string; location?: string; status?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.location) query.set('location', params.location);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return requestJson<{
      items: PublicItemReport[];
      summary: { totalActive: number; potentialMatches: number; claimsInReview: number; returnedCount: number };
    }>(`/api/items${qs ? `?${qs}` : ''}`);
  },

  getItemDetail: (id: string) =>
    requestJson<{ item: PublicItemReport; suggestedMatches: PublicItemReport[]; inquiries: ItemInquiry[] }>(
      `/api/items/${encodeURIComponent(id)}`
    ),

  postInquiry: (itemId: string, message: string) =>
    requestJson<{ inquiry: ItemInquiry }>(`/api/items/${encodeURIComponent(itemId)}/inquiries`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  createItem: (body: {
    type: ReportType;
    title: string;
    category: string;
    location: string;
    date: string;
    description: string;
    imageUrl?: string;
    confirmDuplicate?: boolean;
  }) =>
    requestJson<{ item: PublicItemReport; potentialMatches: PublicItemReport[] }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: {
    name: string;
    email: string;
    studentId: string;
    department: string;
    phone?: string;
    password: string;
  }) =>
    requestJson<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    requestJson<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  recoverPassword: (body: { email: string; studentId: string; newPassword: string }) =>
    requestJson<{ message: string }>('/api/auth/recover', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAdminStatus: () =>
    requestJson<{ adminConfigured: boolean; envConfigured: boolean }>('/api/auth/admin-status'),

  claimAdmin: (body: { name: string; email: string; password: string }) =>
    requestJson<{ token: string; user: UserProfile }>('/api/auth/admin-claim', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  loginAdmin: (body: { email?: string; password: string }) =>
    requestJson<{ token: string; user: UserProfile }>('/api/auth/login-admin', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMyItems: () => requestJson<{ items: PublicItemReport[] }>('/api/items/mine'),
  getMyClaims: () => requestJson<{ claims: ClaimRequest[] }>('/api/claims/mine'),

  submitClaim: (body: {
    itemId: string;
    identifyingDetails: string;
    proofReference?: string;
    claimantPhone?: string;
  }) =>
    requestJson<{ claim: ClaimRequest }>('/api/claims', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getNotifications: () => requestJson<{ notifications: NotificationRecord[] }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    requestJson<{ notification: NotificationRecord }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    requestJson<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  getAdminOverview: (params?: { from?: string; to?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return requestJson<{
      stats: AdminStats;
      items: PublicItemReport[];
      claims: ClaimRequest[];
      users: UserProfile[];
      auditLogs: AuditLogEntry[];
      categories: CategoryItem[];
      locations: CampusLocationItem[];
    }>(`/api/admin/overview${qs ? `?${qs}` : ''}`);
  },

  decideClaim: (
    id: string,
    body: { decision: 'approve' | 'reject' | 'handover'; remarks?: string; confirmHandover?: boolean; pickupCode?: string }
  ) =>
    requestJson<{ claim: ClaimRequest }>(`/api/admin/claims/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  updateAdminItem: (
    id: string,
    body: { status?: ItemStatus; note?: string; confirmReturned?: boolean; clearDuplicate?: boolean }
  ) =>
    requestJson<{ item: PublicItemReport }>(`/api/admin/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deactivateAdminItem: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/admin/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  addCategory: (name: string) =>
    requestJson<{ category: CategoryItem }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  toggleCategory: (id: string, active: boolean) =>
    requestJson<{ category: CategoryItem }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  addLocation: (name: string, zone: string) =>
    requestJson<{ location: CampusLocationItem }>('/api/admin/locations', {
      method: 'POST',
      body: JSON.stringify({ name, zone }),
    }),

  toggleLocation: (id: string, active: boolean) =>
    requestJson<{ location: CampusLocationItem }>(`/api/admin/locations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  toggleUserActive: (id: string, active: boolean) =>
    requestJson<{ user: UserProfile }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
};
