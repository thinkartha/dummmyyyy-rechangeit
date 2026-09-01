"""Whether a member's organization survives the trip from Cognito to the UI.

tejas@rootvyana.com was a member of "Jundago" and the app showed no organization at all.
The membership was never lost — the token stopped carrying it:

  * template.yaml wires LambdaConfig.PreTokenGeneration, which is the V1_0 trigger, and
    V1_0 can only add claims to the *ID* token. /auth/login hands the browser the
    **access** token, and an access token carries no custom attributes — so
    `custom:org_id` is absent on every request and the caller reads as org-less.
  * an org-less caller then falls off the end of tenancy.get_tenant_id, which used to
    answer "acme" — a real tenant — instead of failing.
  * and a solo sign-up was stamped with the literal org id "solo", which is a tenant key
    downstream: every solo account on the platform shared one tenant's data.

    python3 backend/handlers/routers/test_org_membership.py
"""

import os
import sys
from types import SimpleNamespace

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

import pytest  # noqa: E402
from fastapi import Depends, FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import handlers.routers.auth as auth  # noqa: E402
import handlers.routers.tenant as tenant  # noqa: E402
from shared.core import cognito, tenancy, users  # noqa: E402

JUNDAGO = {"org_id": "org-jundago01", "name": "Jundago", "slug": "jundago", "plan": "free"}
MEMBER = {"email": "tejas@rootvyana.com", "org_id": "org-jundago01", "roles": ["user"],
          "status": "active"}

# A Cognito access token, in the shape Cognito actually issues one: sub, username, groups,
# client_id — and no custom attributes, whatever the pre-token-generation trigger does.
ACCESS_TOKEN_CLAIMS = {
    "sub": "cognito-sub-1",
    "username": "tejas@rootvyana.com",
    "token_use": "access",
    "client_id": "client-1",
    "cognito:groups": ["User"],
}


class _Jwt:
    """Stand-in for PyJWT: verifying Cognito's signature is not what is under test."""

    def __init__(self, claims):
        self._claims = claims

    def get_unverified_header(self, _token):
        return {"kid": "kid-1"}

    def decode(self, _token, _key=None, **_kwargs):
        return self._claims


class _Orgs:
    def __init__(self, *orgs):
        self.orgs = {o["org_id"]: o for o in orgs}

    def list_orgs(self):
        return list(self.orgs.values())

    def get_org(self, org_id):
        return self.orgs.get(org_id)


class _Request:
    headers = {"Host": "app.loveheartbeat.com"}


@pytest.fixture
def access_token(monkeypatch):
    """A verified Cognito access token for the Jundago member, with the org row in place."""
    monkeypatch.setattr(cognito, "USER_POOL_ID", "us-east-1_pool")
    monkeypatch.setattr(cognito, "APP_CLIENT_ID", "client-1")
    monkeypatch.setattr(cognito, "jwt", _Jwt(ACCESS_TOKEN_CLAIMS))
    monkeypatch.setattr(cognito, "_public_key", lambda _kid: SimpleNamespace(key="public-key"))
    monkeypatch.setattr(users, "get_user", lambda email: MEMBER if email == MEMBER["email"] else None)
    monkeypatch.setattr(tenant, "orgs", _Orgs(JUNDAGO))
    return "the.access.token"


def test_access_token_without_an_org_claim_still_finds_the_membership(access_token):
    principal = cognito.decode_cognito_token(access_token)
    assert principal is not None
    assert principal.org_id == "org-jundago01"


def test_the_organization_reaches_the_ui(access_token):
    """Both endpoints the org screens call answer "Jundago" rather than nothing."""
    principal = cognito.decode_cognito_token(access_token)
    context = tenant.tenant_context(request=_Request(), principal=principal)
    assert context["tenant"]["name"] == "Jundago"
    listed = tenant.list_organizations(principal=principal)["organizations"]
    assert [o["name"] for o in listed] == ["Jundago"]


def test_an_unresolved_tenant_is_an_error_not_someone_elses_data():
    """No principal, no slug, no header: 400, not a silent read of tenant "acme"."""
    app = FastAPI()

    @app.get("/probe")
    def probe(tenant_id: str = Depends(tenancy.get_tenant_id)) -> dict:
        return {"tenant_id": tenant_id}

    response = TestClient(app).get("/probe")
    assert response.status_code == 400, response.json()


def test_solo_signup_does_not_stamp_a_shared_org_id(monkeypatch):
    """"solo" is a tenant key, not a label — writing it puts every solo user in one tenant."""
    captured: dict = {}

    class _Client:
        exceptions = SimpleNamespace(
            UsernameExistsException=type("UsernameExistsException", (Exception,), {})
        )

        def sign_up(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr(auth, "cognito_client", lambda: _Client())
    auth._cognito_sign_up("solo@x.test", "pw", "", "user")
    assert [a for a in captured["UserAttributes"] if a["Name"] == "custom:org_id"] == []


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))
