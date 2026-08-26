"""What /auth/login answers when Cognito refuses.

Every one of these used to come back as 400 "Login failed": an unregistered email, an
unconfirmed sign-up, an expired temporary password. A 400 reads as a broken site, and
the unconfirmed case in particular stranded the user — the sign-in page routes to the
code form on a token-less 200, which the old branch never produced.

    python3 backend/handlers/routers/test_auth_login.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from fastapi import HTTPException  # noqa: E402

import handlers.routers.auth as auth  # noqa: E402


class _Errors:
    """Stand-in for botocore's generated client.exceptions namespace."""


def _fake_client(raises):
    errors = _Errors()
    for name in (
        "NotAuthorizedException",
        "UserNotFoundException",
        "UserNotConfirmedException",
        "PasswordResetRequiredException",
    ):
        setattr(errors, name, type(name, (Exception,), {}))

    class Client:
        exceptions = errors

        def initiate_auth(self, **_):
            raise getattr(errors, raises)("cognito said no")

    return Client()


def call(raises):
    """Run login() against a Cognito that raises `raises`, return (status, detail|body)."""
    auth._cognito_enabled = lambda: True
    auth.cognito_client = lambda: _fake_client(raises)
    auth.users.get_user = lambda _email: None
    try:
        return None, auth.login(auth.LoginRequest(email="a@b.com", password="pw"))
    except HTTPException as exc:
        return exc.status_code, exc.detail


def main():
    code, detail = call("NotAuthorizedException")
    assert (code, detail) == (401, "Invalid email or password"), (code, detail)

    code, detail = call("UserNotFoundException")
    assert code == 401, f"unknown email must not 400: {code} {detail}"

    code, body = call("UserNotConfirmedException")
    assert code is None, f"unconfirmed sign-up must not raise: {code} {body}"
    assert body.status == "pending_confirmation", body.status
    # Token-less on purpose: this is the flag the sign-in page reads to send the user
    # to the confirmation form instead of the dashboard.
    assert body.access_token == "", body.access_token

    code, detail = call("PasswordResetRequiredException")
    assert code == 401, f"reset-required must not 400: {code} {detail}"
    assert "Forgot password" in detail, detail

    print("ok")


if __name__ == "__main__":
    main()
