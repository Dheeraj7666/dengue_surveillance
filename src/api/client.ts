import { clearSession, getToken } from '@/lib/auth';

const API_BASE_URL = 'http://localhost:8000/api';

function authHeaders(): Headers {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

async function saveResponseAsFile(response: Response, filename: string) {
  if (response.status === 401) {
    clearSession();
    window.location.replace('/admin/login');
    throw new Error('Your session has expired. Please sign in again.');
  }
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && !path.startsWith('/auth/')) {
    clearSession();
    if (!window.location.pathname.startsWith('/admin/login')) {
      window.location.replace('/admin/login');
    }
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  // Auth
  async login(username: string, password: string) {
    return request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  },

  // Submissions
  async submitData(formData: FormData) {
    return request<any>('/submissions', { method: 'POST', body: formData });
  },

  async getMySubmissions() {
    return request<any[]>('/submissions/my');
  },

  async getMySubmissionPreview(id: string) {
    return request<any>(`/submissions/${id}/preview`);
  },

  getMySubmissionFileUrl(id: string) {
    return `${API_BASE_URL}/submissions/${id}/file`;
  },

  // Admin - submissions
  async getAllSubmissions() {
    return request<any[]>('/admin/submissions');
  },

  async getSubmissionPreview(id: string) {
    return request<any>(`/admin/submissions/${id}/preview`);
  },

  async downloadSubmissionFile(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/submissions/${id}/file`, {
      headers: authHeaders(),
    });
    await saveResponseAsFile(response, `submission-${id}.csv`);
  },

  async approveSubmission(id: string) {
    return request<any>(`/admin/submissions/${id}/approve`, { method: 'POST' });
  },

  async rejectSubmission(id: string, reason: string) {
    return request<any>(
      `/admin/submissions/${id}/reject?reason=${encodeURIComponent(reason)}`,
      { method: 'POST' }
    );
  },

  // Admin - analytics
  async getDashboardStats() {
    return request<any>('/admin/dashboard');
  },

  async getForecast() {
    return request<any>('/admin/forecast');
  },

  async getHotspots() {
    return request<any>('/admin/hotspots');
  },

  async getWeather() {
    return request<any>('/admin/weather');
  },

  async getModelPerformance() {
    return request<any>('/admin/model-performance');
  },

  async getDataExplorer(params: { search?: string; district?: string; page?: number; pageSize?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.district) query.set('district', params.district);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<any>(`/admin/data-explorer${suffix}`);
  },

  async downloadDataExport() {
    const response = await fetch(`${API_BASE_URL}/admin/data-explorer/export`, {
      headers: authHeaders(),
    });
    await saveResponseAsFile(response, 'denguecare-data-export.csv');
  },

  async getAuditLog(search?: string) {
    const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<any[]>(`/admin/audit-log${suffix}`);
  },
};
