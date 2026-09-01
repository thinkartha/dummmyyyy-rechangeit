/**
 * The signed-in account, painted onto the page.
 *
 * The theme's settings screen shipped a person who does not exist — a name, a handle,
 * follower counts. This replaces those with what the session actually knows, and
 * reveals the two things only the person who created the organization may do: invite
 * someone into it, and hand it over.
 *
 * Ownership is decided by the API, never by a role: org_admin is a role several people
 * can hold, `owner_email` is one address. /admin/my-organization returns that address
 * for the caller's own org, and the comparison fails closed — a request that errors
 * leaves the owner-only block hidden.
 */

import { api } from './api-client.js';

/** Title-case a role slug for display: org_admin -> Org admin. */
function roleLabel(roles = []) {
  const role = roles[0] || 'user';
  const words = String(role).replace(/[_-]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function paint(fields) {
  for (const el of document.querySelectorAll('[data-lhb-account]')) {
    const value = fields[el.dataset.lhbAccount];
    if (value) el.textContent = value;
  }
}

export async function init() {
  const slots = document.querySelectorAll('[data-lhb-account]');
  const ownerOnly = document.querySelectorAll('[data-lhb-owner-only]');
  if (!slots.length && !ownerOnly.length) return;

  const session = api.auth.session() || {};
  const email = session.email || session.sub || '';
  /* The session is enough for the personal half; only the organization needs a call. */
  paint({
    name: session.name || email || 'Not signed in',
    email,
    role: roleLabel(session.roles),
  });
  if (!email) return;

  const org = await api.admin.myOrganization().catch(() => null);
  if (!org) return;
  paint({
    orgName: org.name || org.slug || org.org_id || '',
    orgOwner: org.owner_email || '',
    orgPlan: org.plan || '',
  });

  const owner = (org.owner_email || '').toLowerCase();
  if (!owner || owner !== email.toLowerCase()) return;
  for (const el of ownerOnly) el.hidden = false;
}
