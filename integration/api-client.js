/**
 * Frontend ↔ backend integration layer.
 * Point API_BASE_URL at API Gateway once Lambda is deployed.
 */

const API_BASE_URL =
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  'http://localhost:3000'; // replace with API Gateway URL

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail || response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const api = {
  health: () => request('/health'),
  list: (resource) => request(`/${resource}`),
  get: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, body) =>
    request(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
};

export { API_BASE_URL, request };
