"""Who sees which organizations.

The directory used to be a public route returning a hardcoded demo registry, so every
signed-in user — and every anonymous one — saw every tenant on the platform, and an
organization someone actually created never appeared in it at all. The rules now:

  * anonymous callers get nothing;
  * a platform admin gets the whole directory;
  * everyone else, org admins included, gets exactly the org they belong to;
  * an org created through the store shows up.

    python3 backend/handlers/routers/test_org_scoping.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402

import handlers.routers.tenant as tenant  # noqa: E402
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal  # noqa: E402


class _Orgs:
    def __init__(self, *orgs):
        self.orgs = {o["org_id"]: o for o in orgs}

    def list_orgs(self):
        return list(self.orgs.values())

    def get_org(self, org_id):
        return self.orgs.get(org_id)


ACME = {"org_id": "org-1", "name": "Acme", "slug": "acme", "plan": "business"}
BETA = {"org_id": "org-2", "name": "Beta", "slug": "beta", "plan": "free"}


@pytest.fixture(autouse=True)
def _store(monkeypatch):
    monkeypatch.setattr(tenant, "orgs", _Orgs(ACME, BETA))


def _names(result):
    return sorted(o["name"] for o in result["organizations"])


def test_anonymous_sees_nothing():
    with pytest.raises(HTTPException) as err:
        tenant.list_organizations(principal=None)
    assert err.value.status_code == 401


def test_org_admin_sees_only_their_own():
    principal = Principal(sub="a@acme.test", roles=[ROLE_ORG_ADMIN], org_id="org-1")
    assert _names(tenant.list_organizations(principal=principal)) == ["Acme"]


def test_platform_admin_sees_the_directory():
    principal = Principal(sub="root", roles=[ROLE_PLATFORM_ADMIN], org_id="")
    assert _names(tenant.list_organizations(principal=principal)) == ["Acme", "Beta"]


def test_solo_account_sees_nothing():
    principal = Principal(sub="solo@x.test", roles=["user"], org_id="")
    assert tenant.list_organizations(principal=principal)["organizations"] == []


def test_tenant_context_follows_the_token_not_the_host():
    """A member of Acme pointing at beta.loveheartbeat.com still gets Acme."""

    class _Request:
        headers = {"Host": "beta.loveheartbeat.com"}

    principal = Principal(sub="a@acme.test", roles=[ROLE_ORG_ADMIN], org_id="org-1")
    result = tenant.tenant_context(request=_Request(), principal=principal)
    assert result["tenant"]["org_id"] == "org-1"
    assert result["url"] == "https://acme.loveheartbeat.com"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))
