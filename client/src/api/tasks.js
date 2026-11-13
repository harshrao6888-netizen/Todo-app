const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api/tasks';

async function request(path = '', { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  list: () => request(),
  search: (q, signal) => request(`/search?q=${encodeURIComponent(q)}`, { signal }),
  get: (id) => request(`/${id}`),
  create: (task) => request('', { method: 'POST', body: task }),
  update: (id, patch) => request(`/${id}`, { method: 'PATCH', body: patch }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' }),
};
