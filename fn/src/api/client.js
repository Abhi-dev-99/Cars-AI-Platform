const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listCars: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    return request(`/api/cars${qs.toString() ? `?${qs}` : ''}`);
  },
  getCar: (id) => request(`/api/cars/${id}`),
  getFilters: () => request('/api/cars/filters'),
  buyCar: (id, payload) => request(`/api/cars/${id}/buy`, { method: 'POST', body: JSON.stringify(payload) }),
  chat: (message, history = []) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  recommend: (prefs) => request('/api/ai/recommend', { method: 'POST', body: JSON.stringify(prefs) }),
  vision: ({ image_base64, image_url, prompt }) => request('/api/ai/vision', {
    method: 'POST',
    body: JSON.stringify({ image_base64, image_url, prompt }),
  }),
};

export const formatINR = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};
