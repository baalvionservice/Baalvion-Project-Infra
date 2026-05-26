import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3015/v1';
export const TOKEN_KEY = 'baalvion_law_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// Public client — no auth, for public content (articles, categories, etc.)
export const publicClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Authenticated client — attaches JWT from localStorage
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || err.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

// Legacy compat — components that called initBackendAuth can still call this safely
export async function initBackendAuth(): Promise<void> {}

export const authLawApi = {
  login: (email: string, password: string) =>
    publicClient.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role?: string) =>
    publicClient.post('/auth/register', { email, password, name, role }),
  me: () => apiClient.get('/auth/me'),
};

export const articlesPublicApi = {
  list: (params?: Record<string, unknown>) => publicClient.get('/articles', { params }),
  get: (slugOrId: string) => publicClient.get(`/articles/${slugOrId}`),
};

export const categoriesPublicApi = {
  list: () => publicClient.get('/categories'),
  get: (slugOrId: string) => publicClient.get(`/categories/${slugOrId}`),
};

export const subcategoriesPublicApi = {
  list: (params?: Record<string, unknown>) => publicClient.get('/subcategories', { params }),
};

export const lawyerApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/lawyers', { params }),
  get: (id: string) => apiClient.get(`/lawyers/${id}`),
  search: (q: string, filters?: Record<string, unknown>) =>
    publicClient.get('/lawyers/search', { params: { q, ...filters } }),
  updateProfile: (id: string, data: unknown) => apiClient.patch(`/lawyers/${id}`, data),
};

export const bookingApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/bookings', { params }),
  get: (id: string) => apiClient.get(`/bookings/${id}`),
  create: (data: unknown) => apiClient.post('/bookings', data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/bookings/${id}/status`, { status }),
  cancel: (id: string) => apiClient.patch(`/bookings/${id}/status`, { status: 'cancelled' }),
};

export const caseApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/cases', { params }),
  get: (id: string) => apiClient.get(`/cases/${id}`),
  create: (data: unknown) => apiClient.post('/cases', data),
  update: (id: string, data: unknown) => apiClient.put(`/cases/${id}`, data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/cases/${id}/status`, { status }),
};

export const messageApi = {
  list: (params: Record<string, unknown>) => apiClient.get('/messages', { params }),
  send: (data: unknown) => apiClient.post('/messages', data),
};

export const documentApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/documents', { params }),
  upload: (data: unknown) => apiClient.post('/documents', data),
  delete: (id: string) => apiClient.delete(`/documents/${id}`),
};

export const paymentApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/payments', { params }),
  create: (data: unknown) => apiClient.post('/payments', data),
};

export const subscriptionApi = {
  get: () => apiClient.get('/subscriptions/me'),
  create: (data: unknown) => apiClient.post('/subscriptions', data),
  cancel: () => apiClient.delete('/subscriptions/me'),
};

export const reviewApi = {
  list: (lawyerId: string) => apiClient.get('/reviews', { params: { lawyerId } }),
  create: (data: unknown) => apiClient.post('/reviews', data),
};

export const articleApi = {
  list: (params?: Record<string, unknown>) => publicClient.get('/articles', { params }),
  get: (slug: string) => publicClient.get(`/articles/${slug}`),
};

export const notificationApi = {
  list: () => apiClient.get('/notifications'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read'),
};

export const referralApi = {
  getMyCode: () => apiClient.get('/referrals/me'),
  stats: () => apiClient.get('/referrals/stats'),
};

export const adminApi = {
  dashboard: () => apiClient.get('/admin/dashboard'),
  analytics: (params?: Record<string, unknown>) => apiClient.get('/admin/analytics', { params }),
  listUsers: (params?: Record<string, unknown>) => apiClient.get('/admin/users', { params }),
};
