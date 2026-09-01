"""Self-serve organization sign-up, from the code to the first sign-in.

The bug this pins down: confirming the emailed code used to park a `create_org` signup
in `pending_admin`, and /login answers every non-active user with "Account is not
active". So the person who had just created an organization, entered the six digits they
were sent, and been told "Confirmed" was then refused at sign-in with an error that reads
as broken auth. Nothing in the product ever showed them an approval queue to wait on.

    python3 backend/handlers/routers/test_auth_signup_flow.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

for _var in ("COGNITO_USER_POOL_ID", "COGNITO_APP_CLIENT_ID"):
    os.environ.pop(_var, None)  # exercise the local-store path, not Cognito

import handlers.routers.auth as auth  # noqa: E402


class _Users:
    """The slice of shared.core.users these two paths touch."""

    def __init__(self, record):
        self.record = record

    def get_user(self, email):
        return dict(self.record) if self.record["email"] == email else None

    def update_user(self, email, **fields):
        assert self.record["email"] == email
        self.record.update(fields)
        return dict(self.record)


def _with_users(record):
    store = _Users(record)
    auth.users = store          # module-level import in auth.py
    return store


def test_confirming_org_signup_activates_it():
    store = _with_users({
        "email": "founder@example.com",
        "status": "pending_confirmation",
        "confirmation_code": "123456",
        "intent": "create_org",
        "org_id": "org-1",
        "roles": ["org_admin"],
    })
    auth.confirm(auth.ConfirmRequest(email="founder@example.com", code="123456"))
    assert store.record["status"] == "active", store.record
    assert store.record["confirmation_code"] is None


def test_wrong_code_still_rejected():
    _with_users({
        "email": "founder@example.com",
        "status": "pending_confirmation",
        "confirmation_code": "123456",
        "intent": "create_org",
    })
    try:
        auth.confirm(auth.ConfirmRequest(email="founder@example.com", code="000000"))
    except auth.HTTPException as exc:
        assert exc.status_code == 400 and "confirmation code" in exc.detail.lower()
    else:
        raise AssertionError("a wrong code must not confirm an account")


def test_account_stranded_by_the_old_flow_is_let_in():
    store = _with_users({
        "email": "founder@example.com",
        "status": "pending_admin",
        "intent": "create_org",
        "org_id": "org-1",
    })
    user = auth._activate_stranded_org_owner(store.get_user("founder@example.com"))
    assert user["status"] == "active"
    assert store.record["status"] == "active"


def test_a_hand_parked_account_stays_parked():
    """Only create_org signups are unstuck — a platform admin's own hold must hold."""
    store = _with_users({
        "email": "someone@example.com",
        "status": "pending_admin",
        "intent": "solo",
    })
    user = auth._activate_stranded_org_owner(store.get_user("someone@example.com"))
    assert user["status"] == "pending_admin"
    assert store.record["status"] == "pending_admin"


if __name__ == "__main__":
    test_confirming_org_signup_activates_it()
    test_wrong_code_still_rejected()
    test_account_stranded_by_the_old_flow_is_let_in()
    test_a_hand_parked_account_stays_parked()
    print("ok — confirming an org sign-up activates it, and stranded owners can sign in")
