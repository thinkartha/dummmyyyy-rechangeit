/**
 * Frontend ↔ backend integration (multi-tenant SaaS).
 *
 * Tenant resolution:
 *   production → https://<slug>.loveheartbeat.com (Host header)
 *   local/dev  → set window.__TENANT_SLUG__ or X-Tenant-Slug
 */

const API_BASE_URL =
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  'http://localhost:3000';

const TENANT_BASE_DOMAIN =
  (typeof window !== 'undefined' && window.__TENANT_BASE_DOMAIN__) ||
  'loveheartbeat.com';

function slugFromHostname(hostname = '') {
  const host = hostname.toLowerCase().split(':')[0];
  const suffix = `.${TENANT_BASE_DOMAIN}`;
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);
    return slug.includes('.') ? null : slug;
  }
  if (host.endsWith('.localhost')) {
    return host.slice(0, -'.localhost'.length);
  }
  return null;
}

function currentTenantSlug() {
  if (typeof window === 'undefined') return null;
  return (
    window.__TENANT_SLUG__ ||
    slugFromHostname(window.location.hostname) ||
    localStorage.getItem('lhb_tenant_slug') ||
    'rootvyana'
  );
}

function tenantUrl(slug) {
  return `https://${slug}.${TENANT_BASE_DOMAIN}`;
}

async function request(path, options = {}) {
  const slug = currentTenantSlug();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(slug ? { 'X-Tenant-Slug': slug } : {}),
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
  tenant: () => request('/tenant'),
  organizations: () => request('/organizations'),
  list: (resource) => request(`/${resource}`),
  get: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, body) =>
    request(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
};

export {
  API_BASE_URL,
  TENANT_BASE_DOMAIN,
  currentTenantSlug,
  tenantUrl,
  request
};
