/**
 * API client for Area Book backend
 * Sends X-User-Id header when userId is set
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

function headers(userId?: string | null): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) h['X-User-Id'] = userId;
  return h;
}

async function request<T>(path: string, options?: RequestInit & { userId?: string | null }): Promise<T> {
  const { userId, ...opts } = options || {};
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...headers(userId), ...(opts.headers as Record<string, string>) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  users: {
    getAll: () => request(`/api/users`),
    create: (body: object) => request(`/api/users`, { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/api/users/${id}`, { method: 'DELETE' }),
    verifyPin: (id: string, pin: string) => request(`/api/users/${id}/verify-pin`, { method: 'POST', body: JSON.stringify({ pin }) }),
  },
  userSettings: {
    get: (userId: string) => request(`/api/user-settings/${userId}`),
    update: (userId: string, body: object) => request(`/api/user-settings/${userId}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  connections: {
    getAll: (userId: string) => request(`/api/connections`, { userId }),
    create: (userId: string, body: object) => request(`/api/connections`, { method: 'POST', body: JSON.stringify(body), userId }),
    update: (userId: string, id: string, body: object) => request(`/api/connections/${id}`, { method: 'PUT', body: JSON.stringify(body), userId }),
    delete: (userId: string, id: string) => request(`/api/connections/${id}`, { method: 'DELETE', userId }),
  },
  events: {
    getAll: (userId: string) => request(`/api/events`, { userId }),
    create: (userId: string, body: object) => request(`/api/events`, { method: 'POST', body: JSON.stringify(body), userId }),
    update: (userId: string, id: string, body: object) => request(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(body), userId }),
    delete: (userId: string, id: string) => request(`/api/events/${id}`, { method: 'DELETE', userId }),
  },
  rizzbot: {
    generate: (userId: string, body: { connection: object; objective: string; userMessage: string; context: object }) =>
      request<{ text: string }>(`/api/rizzbot`, { method: 'POST', body: JSON.stringify(body), userId }),
  },
  goals: {
    getAll: (userId: string) => request(`/api/goals`, { userId }),
    create: (userId: string, body: object) => request(`/api/goals`, { method: 'POST', body: JSON.stringify(body), userId }),
    update: (userId: string, id: string, body: object) => request(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(body), userId }),
    delete: (userId: string, id: string) => request(`/api/goals/${id}`, { method: 'DELETE', userId }),
  },
};
