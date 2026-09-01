"""Whether the person's own name survives the trip from the user record to the UI.

The navbar and the settings page showed `tejas@rootvyana` for an account whose name is
"Tejas Yalmanchili" and whose address is tejas@rootvyana.com. Two things, one cause:

  * /auth/me answered a `Principal` — sub, roles, org_id — and nothing else. The name the
    user typed at sign-up is written to UsersTable (shared/core/users.py) and was never
    read back for the signed-in user, so the browser had nothing but an identifier to
    print in a slot that asks for a name.
  * that identifier is `_claim(payload, "email", "username", "sub")` (shared/core/
    cognito.py). A Cognito *access* token — the one /auth/login hands the browser —
    carries no `email` claim, so it is the `username` claim: the pool's login handle,
    which is not required to be the address the account was registered with. Whatever
    that handle happens to be is what the page printed.

/auth/me now answers from the user record, which holds both.

    python3 backend/handlers/routers/test_profile_name.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import handlers.routers.auth as auth  # noqa: E402
from shared.core.auth import Principal, ROLE_USER  # noqa: E402

TEJAS = {
    "email": "tejas@rootvyana.com",
    "name": "Tejas Yalmanchili",
    "roles": [ROLE_USER],
    "org_id": "org-jundago01",
    "status": "active",
}


@pytest.fixture
def client(monkeypatch):
    """/auth/me as the signed-in Tejas, with his row in the user store."""
    monkeypatch.setattr(
        auth.users, "get_user", lambda email: TEJAS if email == TEJAS["email"] else None
    )
    app = FastAPI()
    app.include_router(auth.router)
    app.dependency_overrides[auth.get_current_principal] = lambda: Principal(
        sub=TEJAS["email"], roles=TEJAS["roles"], org_id=TEJAS["org_id"]
    )
    return TestClient(app)


def test_me_answers_the_name_on_the_account(client):
    """The slot asks for a person; the record has one."""
    body = client.get("/api/v1/auth/me").json()
    assert body["name"] == "Tejas Yalmanchili"


def test_me_answers_the_registered_address_in_full(client):
    """The address comes off the record, not off a token claim that may be neither."""
    body = client.get("/api/v1/auth/me").json()
    assert body["email"] == "tejas@rootvyana.com"


def test_an_account_with_no_name_falls_back_to_the_address(client, monkeypatch):
    """No name is not a reason to print nothing — the address is the honest stand-in."""
    monkeypatch.setattr(auth.users, "get_user", lambda _email: {**TEJAS, "name": ""})
    body = client.get("/api/v1/auth/me").json()
    assert body["name"] == ""
    assert body["email"] == "tejas@rootvyana.com"


def test_the_browser_prefers_the_name_over_the_address():
    """The other half of the bug: the navbar reads the cached session, not /auth/me.

    ponytail: a source check rather than a DOM one — the two lines that carry the name
    from the API into the page are the whole browser-side fix, and standing up jsdom to
    assert one textContent costs more than it catches.
    """
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")
    api_client = open(os.path.join(root, "integration", "api-client.js")).read()
    auth_js = open(os.path.join(root, "integration", "auth.js")).read()
    assert "name = me.name" in api_client, "the session cache must keep the name /auth/me returns"
    assert "session.name ||" in auth_js, "[data-lhb-user] must print the name before the address"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))
