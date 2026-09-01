"""Joining an existing organization, from the request to the first sign-in.

The bug this pins down: the `join_org` signup intent was the only one that never called
Cognito. With a pool configured it wrote a DynamoDB row and a join request for a user who
had no Cognito account at all, so approving them threw UserNotFoundException — swallowed
as a log warning, leaving the row saying "active" while every /login 401'd. Nothing in
the product explained why a freshly-approved member could not sign in.

Two halves, and both have to hold:
  * register(join_org) creates the Cognito account (with no org_id — membership is the
    admin's to grant, not the requester's to claim);
  * approving fails loudly if Cognito refuses, instead of marking the local row active
    and stranding the user.

    python3 backend/handlers/routers/test_join_org_flow.py
"""

import contextlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

import handlers.routers.admin as admin  # noqa: E402
import handlers.routers.auth as auth  # noqa: E402


class _Cognito:
    """Records calls; raises UserNotFoundException for anyone who never signed up."""

    class exceptions:
        class UsernameExistsException(Exception):
            pass

    class UserNotFoundException(Exception):
        pass

    def __init__(self):
        self.signed_up = set()
        self.calls = []

    def sign_up(self, **kw):
        self.signed_up.add(kw["Username"])
        self.calls.append(("sign_up", kw["Username"], kw.get("UserAttributes")))

    def _require(self, username):
        if username not in self.signed_up:
            raise _Cognito.UserNotFoundException(f"User does not exist: {username}")

    def confirm_sign_up(self, **kw):
        self._require(kw["Username"])
        if kw["ConfirmationCode"] != "123456":
            raise ValueError("Invalid verification code provided")
        self.calls.append(("confirm_sign_up", kw["Username"]))

    def admin_confirm_sign_up(self, **kw):
        self._require(kw["Username"])
        self.calls.append(("admin_confirm_sign_up", kw["Username"]))

    def admin_update_user_attributes(self, **kw):
        self._require(kw["Username"])
        self.calls.append(("admin_update_user_attributes", kw["Username"]))

    def admin_add_user_to_group(self, **kw):
        self._require(kw["Username"])
        self.calls.append(("admin_add_user_to_group", kw["Username"]))


class _Users:
    def __init__(self):
        self.rows = {}

    def get_user(self, email):
        row = self.rows.get(email)
        return dict(row) if row else None

    def create_user(self, email, password=None, **fields):
        if email in self.rows:
            return False
        self.rows[email] = {"email": email, "password": password, **fields}
        return True

    def update_user(self, email, **fields):
        self.rows.setdefault(email, {"email": email}).update(fields)
        return dict(self.rows[email])


class _JoinRequests:
    def __init__(self):
        self.rows = {}

    def create_join_request(self, email, org_id, name=None):
        self.rows[(email, org_id)] = {"email": email, "org_id": org_id, "status": "pending"}

    def get_join_request(self, email, org_id):
        row = self.rows.get((email, org_id))
        return dict(row) if row else None

    def delete_join_request(self, email, org_id):
        self.rows.pop((email, org_id), None)


class _Notifications:
    def __getattr__(self, _name):
        return lambda *a, **kw: None


@contextlib.contextmanager
def _wired():
    """Point both routers at fresh in-memory doubles, then put them back.

    Self-restoring on purpose. These modules hold their collaborators as module globals,
    so a stub left behind leaks into every later test file: stubbing _cognito_enabled and
    walking away made test_auth_signup_flow.py — which pops the Cognito env vars at import
    precisely to exercise the local path — run against Cognito instead, and fail.
    """
    saved = {m: dict(vars(m)) for m in (auth, admin)}
    cognito, users, joins = _Cognito(), _Users(), _JoinRequests()
    auth._cognito_enabled = admin._cognito_enabled = lambda: True
    auth.users = admin.users = users
    auth.join_requests = admin.join_requests = joins
    auth.notifications = admin.notifications = _Notifications()
    auth.orgs = type("O", (), {"get_org_by_identifier": staticmethod(lambda _i: {"org_id": "org-1"})})()
    auth.cognito_client = admin.cognito_client = lambda: cognito
    try:
        yield cognito, users, joins
    finally:
        for module, originals in saved.items():
            for name, value in originals.items():
                setattr(module, name, value)


def _register_join(email="newbie@example.com"):
    return auth.register(auth.RegisterRequest(
        email=email, password="Passw0rd!", intent="join_org", org_identifier="jundago",
    ))


def _approve(email="newbie@example.com", org_id="org-1"):
    principal = auth.Principal(sub="owner@example.com", roles=["platform_admin"], org_id=org_id)
    return admin.act_on_join_request(
        org_id, email, admin.JoinRequestAction(action="approve"), principal=principal,
    )


def test_join_request_creates_the_cognito_account():
    with _wired() as (cognito, users, joins):
        _register_join()
        assert "newbie@example.com" in cognito.signed_up, "join_org must sign the user up in Cognito"
        assert users.rows["newbie@example.com"]["status"] == "pending_join"
        assert joins.get_join_request("newbie@example.com", "org-1")


def test_the_request_does_not_claim_membership():
    """Asking to join is not joining — no org_id until an admin approves."""
    with _wired() as (cognito, users, _joins):
        _register_join()
        attrs = {a["Name"]: a["Value"] for a in (cognito.calls[0][2] or [])}
        assert "custom:org_id" not in attrs, attrs
        assert users.rows["newbie@example.com"]["org_id"] == ""


def test_approval_activates_the_user_in_both_stores():
    with _wired() as (cognito, users, joins):
        _register_join()
        _approve()
        assert users.rows["newbie@example.com"]["status"] == "active"
        assert users.rows["newbie@example.com"]["org_id"] == "org-1"
        assert ("admin_update_user_attributes", "newbie@example.com") in cognito.calls
        # An unconfirmed Cognito user cannot sign in, so approval has to confirm them too.
        assert ("admin_confirm_sign_up", "newbie@example.com") in cognito.calls
        assert joins.get_join_request("newbie@example.com", "org-1") is None


def test_approval_fails_loudly_when_cognito_has_no_such_user():
    """The original bug's shape: a local row with no Cognito account behind it. The old
    code logged a warning and marked them active, so the user was told they were in and
    then 401'd forever. It must refuse and leave the request pending instead."""
    with _wired() as (_cognito, users, joins):
        users.create_user("ghost@example.com", "x", org_id="", status="pending_join")
        joins.create_join_request("ghost@example.com", "org-1")
        try:
            _approve("ghost@example.com")
        except admin.HTTPException as exc:
            assert exc.status_code == 502, exc.status_code
        else:
            raise AssertionError("approving a user Cognito does not know must not succeed")
        assert users.rows["ghost@example.com"]["status"] == "pending_join", "must not be marked active"
        assert joins.get_join_request("ghost@example.com", "org-1"), "request must stay pending for a retry"


def test_pending_join_can_verify_its_email_without_being_activated():
    """The emailed code must be redeemable — an unconfirmed Cognito user cannot sign in
    even after approval — but redeeming it is not the same as being let into the org."""
    with _wired() as (_cognito, users, _joins):
        _register_join()
        auth.confirm(auth.ConfirmRequest(email="newbie@example.com", code="123456"))
        assert users.rows["newbie@example.com"]["status"] == "pending_join", "confirming is not joining"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all green")
