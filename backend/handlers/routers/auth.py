"""Authentication routes with multi-tenant sign-up / login flows.

Supports four registration intents:
- create_org: public user creates a new organization and becomes OrgAdmin.
- join_org: public user asks to join an existing organization (pending admin approval).
- solo: public user creates a standalone account with no org.
- accept_invite: public user redeems an admin-generated invite token to join an org.

When Cognito is configured, sign-up and login delegate to Cognito; otherwise the local
scrypt user store is used. The legacy global admin (admin / admin321) is always honored.
"""

from __future__ import annotations

import logging
import os
import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from shared.core.auth import (
    ROLE_ORG_ADMIN,
    ROLE_PLATFORM_ADMIN,
    ROLE_USER,
    Principal,
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    authenticate_api_key,
    authenticate_global_admin,
    create_refresh_token,
    create_token,
    decode_refresh_token,
    get_current_principal,
    require_role,
)
from shared.core.cognito import cognito_client, decode_cognito_token
from shared.core import invites, join_requests, notifications, orgs, users

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
log = logging.getLogger("pinghold.auth.router")


def _cognito_enabled() -> bool:
    return bool(os.getenv("COGNITO_USER_POOL_ID") and os.getenv("COGNITO_APP_CLIENT_ID"))


class TokenRequest(BaseModel):
    api_key: str


class TokenResponse(BaseModel):
    access_token: str
    # Traded at /auth/refresh for a new access token. Null on the register responses, which
    # hand out no session until the account is confirmed.
    refresh_token: str | None = None
    token_type: str = "bearer"
    sub: str
    org_id: str = ""
    roles: list[str]
    status: str = "active"
    # Exposed only in local dev fallback; null when Cognito is configured.
    confirmation_code: str | None = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None
    intent: str = "solo"  # create_org | join_org | solo | accept_invite
    org_name: str | None = None
    org_identifier: str | None = None  # org_id, slug, or name for join_org
    invite_token: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ConfirmRequest(BaseModel):
    email: str
    code: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ForgotPasswordResponse(BaseModel):
    # null in production (Cognito sends the code); present in local dev fallback.
    reset_code: str | None = None


def _cognito_sign_up(email: str, password: str, org_id: str, role: str) -> None:
    """Create a user in Cognito with tenant attributes. Raises HTTPException on failure."""
    client = cognito_client()
    if not client:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
    # No email_verified here: it is not writable by an app client, so Cognito rejects
    # the whole sign_up with NotAuthorizedException. Verification happens through the
    # emailed code (AutoVerifiedAttributes) and the /confirm page; the pre-sign-up
    # trigger still auto-confirms admin-created users, which do carry the attribute.
    # No placeholder org id. "solo" was written as a literal custom:org_id, and org_id is
    # the tenant key verbatim (get_tenant_id returns principal.org_id) — so every solo
    # account on the platform shared one tenant's data. No org means no attribute; the
    # readers all treat it as absent, and tenancy gives an org-less caller solo-<sub>.
    attrs = [{"Name": "email", "Value": email}]
    if org_id:
        attrs.append({"Name": "custom:org_id", "Value": org_id})
    if role:
        attrs.append({"Name": "custom:role", "Value": role})
    try:
        client.sign_up(
            ClientId=os.getenv("COGNITO_APP_CLIENT_ID"),
            Username=email,
            Password=password,
            UserAttributes=attrs,
        )
    except client.exceptions.UsernameExistsException as exc:
        # An unconfirmed user already "exists" in Cognito, so a flat 409 strands them:
        # they never got a usable code and signup is the only place to ask for one.
        # resend_confirmation_code raises for a *confirmed* user, which is the real conflict.
        try:
            client.resend_confirmation_code(ClientId=os.getenv("COGNITO_APP_CLIENT_ID"), Username=email)
            return
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
            ) from exc
    except Exception as exc:
        log.warning("Cognito sign_up failed: %s", exc)
        # Pass Cognito's message through: a bare "Sign-up failed" hides password-policy
        # and attribute errors from both the user and whoever is debugging.
        reason = getattr(exc, "response", {}).get("Error", {}).get("Message") or str(exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Sign-up failed: {reason}"
        ) from exc


def _cognito_add_to_group(email: str, group_name: str) -> None:
    """Best-effort add user to a Cognito group."""
    client = cognito_client()
    if not client:
        return
    try:
        client.admin_add_user_to_group(
            UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
            Username=email,
            GroupName=group_name,
        )
    except Exception as exc:  # pragma: no cover - AWS dependency
        log.warning("Cognito add to group failed: %s", exc)


def _generate_code(length: int = 6) -> str:
    """Cryptographically secure numeric code for local fallback verification."""
    return "".join(secrets.choice("0123456789") for _ in range(length))


def _create_or_resume(email: str, **fields) -> None:
    """Write the user row, or resume a signup that never got confirmed.

    A row stuck at pending_confirmation means a previous attempt created the account
    but the code was never entered. Overwriting it (new password, fresh confirmation
    code) is what lets the user retry; 409-ing would block that email forever. Any
    other status is a genuine conflict.
    """
    if users.create_user(email, **fields):
        return
    existing = users.get_user(email)
    if not existing or existing.get("status") != "pending_confirmation":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    users.update_user(email, **{k: v for k, v in fields.items() if v is not None})


@router.post("/token", response_model=TokenResponse)
def issue_token(body: TokenRequest) -> TokenResponse:
    """Exchange an API key for a short-lived JWT."""
    principal = authenticate_api_key(body.api_key)
    if not principal:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    token = create_token(principal.sub, principal.roles, org_id=principal.org_id)
    return TokenResponse(access_token=token, sub=principal.sub, org_id=principal.org_id, roles=principal.roles, status="active")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest) -> TokenResponse:
    """Create a user. When Cognito is configured, signs up in Cognito; otherwise stores locally."""
    intent = body.intent or "solo"
    if intent not in {"create_org", "join_org", "solo", "accept_invite"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signup intent")

    # --- create_org ----------------------------------------------------------
    if intent == "create_org":
        org = orgs.create_org(name=body.org_name or body.email, owner_email=body.email)
        org_id = org.get("org_id")
        if not org_id:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Organization creation failed")
        roles = [ROLE_ORG_ADMIN]
        if _cognito_enabled():
            _cognito_sign_up(body.email, body.password, org_id, ROLE_ORG_ADMIN)
            _cognito_add_to_group(body.email, "OrgAdmin")
            _create_or_resume(
                body.email,
                password=body.password,
                roles=roles,
                name=body.name,
                org_id=org_id,
                status="pending_confirmation",
                intent=intent,
            )
            return TokenResponse(access_token="", sub=body.email, org_id=org_id, roles=roles, status="pending_confirmation")
        code = _generate_code()
        _create_or_resume(
            body.email,
            password=body.password,
            roles=roles,
            name=body.name,
            org_id=org_id,
            status="pending_confirmation",
            confirmation_code=code,
            intent=intent,
        )
        notifications.confirmation_required(body.email, code)
        return TokenResponse(access_token="", sub=body.email, org_id=org_id, roles=roles, status="pending_confirmation", confirmation_code=code)

    # --- solo ----------------------------------------------------------------
    if intent == "solo":
        roles = [ROLE_USER]
        if _cognito_enabled():
            _cognito_sign_up(body.email, body.password, "", ROLE_USER)
            _create_or_resume(
                body.email,
                password=body.password,
                roles=roles,
                name=body.name,
                status="pending_confirmation",
                intent=intent,
            )
            return TokenResponse(access_token="", sub=body.email, org_id="", roles=roles, status="pending_confirmation")
        code = _generate_code()
        _create_or_resume(
            body.email,
            password=body.password,
            roles=roles,
            name=body.name,
            status="pending_confirmation",
            confirmation_code=code,
            intent=intent,
        )
        notifications.confirmation_required(body.email, code)
        return TokenResponse(access_token="", sub=body.email, org_id="", roles=roles, status="pending_confirmation", confirmation_code=code)

    # --- join_org ------------------------------------------------------------
    if intent == "join_org":
        if not body.org_identifier:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="org_identifier is required")
        org = orgs.get_org_by_identifier(body.org_identifier)
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        org_id = org["org_id"]
        # Reject duplicates: a pending or active user with this email cannot re-request.
        if users.get_user(body.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        # Cognito first, and no org_id: membership is granted by the admin approving the
        # request, not by asking. This branch used to skip Cognito entirely, so with a
        # pool configured the request created a DynamoDB row for a user who had no
        # Cognito account at all — approval's admin_update_user_attributes then threw
        # UserNotFoundException (swallowed as a warning) and every later /login 401'd.
        # Signing up here also means the emailed code goes out, so the address can be
        # proven before an admin is asked to vouch for it.
        if _cognito_enabled():
            _cognito_sign_up(body.email, body.password, "", ROLE_USER)
        if not users.create_user(
            body.email,
            body.password,
            roles=[ROLE_USER],
            name=body.name,
            org_id="",
            status="pending_join",
            intent=intent,
        ):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        join_requests.create_join_request(body.email, org_id, name=body.name or body.email)
        notifications.join_request_created(org_id, body.email, name=body.name or body.email)
        return TokenResponse(access_token="", sub=body.email, org_id=org_id, roles=[ROLE_USER], status="pending_join")

    # --- accept_invite -------------------------------------------------------
    if intent == "accept_invite":
        if not body.invite_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invite_token is required")
        invite = invites.get_invite(body.invite_token)
        if not invite:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invite token")
        org_id = invite["org_id"]
        roles = [invite.get("role", ROLE_USER)]
        if roles[0] not in {ROLE_USER, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN}:
            roles = [ROLE_USER]
        existing = users.get_user(body.email)
        if existing and existing.get("status") != "pending_confirmation":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        if _cognito_enabled():
            _cognito_sign_up(body.email, body.password, org_id, roles[0])
            group = "GlobalAdmin" if roles[0] == ROLE_PLATFORM_ADMIN else (
                "OrgAdmin" if roles[0] == ROLE_ORG_ADMIN else "User"
            )
            _cognito_add_to_group(body.email, group)
            _create_or_resume(
                body.email,
                password=body.password,
                roles=roles,
                name=body.name,
                org_id=org_id,
                status="pending_confirmation",
                intent=intent,
            )
            invites.mark_used(body.invite_token)
            return TokenResponse(access_token="", sub=body.email, org_id=org_id, roles=roles, status="pending_confirmation")
        code = _generate_code()
        _create_or_resume(
            body.email,
            password=body.password,
            roles=roles,
            name=body.name,
            org_id=org_id,
            status="pending_confirmation",
            confirmation_code=code,
            intent=intent,
        )
        invites.mark_used(body.invite_token)
        notifications.confirmation_required(body.email, code)
        return TokenResponse(access_token="", sub=body.email, org_id=org_id, roles=roles, status="pending_confirmation", confirmation_code=code)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signup intent")


def _confirm_cognito_code(email: str, code: str, user: dict) -> None:
    """Verify the emailed sign-up code. Cognito checks its own; local dev checks the stored one."""
    if _cognito_enabled():
        client = cognito_client()
        if not client:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
        try:
            client.confirm_sign_up(
                ClientId=os.getenv("COGNITO_APP_CLIENT_ID"),
                Username=email,
                ConfirmationCode=code,
            )
        except Exception as exc:
            log.warning("Cognito confirm_sign_up failed: %s", exc)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid confirmation code") from exc
        return
    # Local fallback: verify the stored code.
    stored_code = user.get("confirmation_code")
    if not stored_code or stored_code != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid confirmation code")


@router.post("/confirm", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def confirm(body: ConfirmRequest) -> None:
    """Confirm sign-up with a verification code. Cognito verifies its own code; local fallback verifies a stored code."""
    user = users.get_user(body.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    current_status = user.get("status", "")
    if current_status == "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already active")
    if current_status == "pending_join":
        # Proving the email and being let into the org are two different gates. This used
        # to refuse outright, which left a join_org signup holding a Cognito verification
        # code it could never redeem — and an unconfirmed Cognito user cannot sign in even
        # after an admin approves them. So verify the code and leave the status alone: the
        # admin still decides membership.
        _confirm_cognito_code(body.email, body.code, user)
        return
    if current_status != "pending_confirmation":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot confirm user with status '{current_status}'")

    _confirm_cognito_code(body.email, body.code, user)

    # Confirming the emailed code is the whole sign-up. create_org used to land in
    # pending_admin here, which meant a self-serve organization signup completed the code
    # step and then could not sign in — /login answers any non-active user with "Account
    # is not active", so it read as a broken auth system rather than a queue. The
    # organization row already exists (register created it with this user as its owner),
    # so there is nothing for a platform admin to decide. Approve/deny still exist in the
    # admin API for suspending an account after the fact.
    users.update_user(body.email, status="active", confirmation_code=None)


def _activate_stranded_org_owner(user: dict | None) -> dict | None:
    """Let through an account the old confirm() parked in pending_admin.

    Anyone who signed up to create an organization before that changed is stuck: they
    cannot confirm again (confirm rejects a non-pending_confirmation status) and they
    cannot sign in. They own a real organization and they proved the email, so this
    activates them on their next sign-in attempt rather than needing a manual fix per
    account. Only create_org signups qualify — an account a platform admin parked in
    pending_admin by hand keeps that status.
    """
    if not user or user.get("status") != "pending_admin" or user.get("intent") != "create_org":
        return user
    users.update_user(user["email"], status="active")
    log.info("Activated stranded org owner %s on sign-in", user["email"])
    return users.get_user(user["email"]) or {**user, "status": "active"}


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    """Exchange email + password for a JWT. Honors legacy global admin, Cognito, then local store."""
    # 1. Legacy global admin
    admin_principal = authenticate_global_admin(body.email, body.password)
    if admin_principal:
        token = create_token(admin_principal.sub, admin_principal.roles, org_id=admin_principal.org_id)
        return TokenResponse(
            access_token=token,
            refresh_token=create_refresh_token(admin_principal.sub),
            sub=admin_principal.sub,
            org_id=admin_principal.org_id,
            roles=admin_principal.roles,
            status="active",
        )

    # 2. Cognito-backed login
    if _cognito_enabled():
        client = cognito_client()
        if not client:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
        try:
            result = client.initiate_auth(
                ClientId=os.getenv("COGNITO_APP_CLIENT_ID"),
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={"USERNAME": body.email, "PASSWORD": body.password},
            )
            auth_result = result.get("AuthenticationResult", {})
            access_token = auth_result.get("AccessToken", "")
            refresh_token = auth_result.get("RefreshToken") or None
            # Enforce backend user status even when Cognito credentials are valid.
            user = _activate_stranded_org_owner(users.get_user(body.email))
            if user and user.get("status") != "active":
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is not active")
            # Decode the Cognito access token to get org_id and roles for the response.
            principal = decode_cognito_token(access_token) if access_token else None
            if not principal:
                # The credentials were right, but we cannot read the token Cognito issued —
                # and get_current_principal will not be able to either, so handing back a
                # session here produces a "logged in" UI where every request 401s. Fail
                # loudly instead; the usual cause is RS256 support missing from the package.
                log.error("Cognito issued a token this service cannot decode — check PyJWT[crypto] and JWKS reachability")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Auth service misconfigured, please contact support",
                )
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                sub=principal.sub or body.email,
                org_id=principal.org_id,
                roles=principal.roles,
                status="active",
            )
        except client.exceptions.NotAuthorizedException as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password") from exc
        except client.exceptions.UserNotFoundException as exc:
            # Same answer as a wrong password. Which of the two it was is not the
            # caller's business, and the old 400 read as "the site is broken" for the
            # most ordinary mistake there is — an email that was never registered.
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password") from exc
        except client.exceptions.UserNotConfirmedException:
            # Not a failed sign-in — an unfinished sign-up. The token-less response is
            # the shape the sign-in page already watches for to send the user to the
            # code form; a 400 here strands them with no way to finish.
            user = users.get_user(body.email) or {}
            return TokenResponse(
                access_token="",
                sub=body.email,
                org_id=user.get("org_id", ""),
                roles=user.get("roles") or [ROLE_USER],
                status="pending_confirmation",
            )
        except client.exceptions.PasswordResetRequiredException as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password reset required — use Forgot password to set a new one.",
            ) from exc
        except HTTPException:
            raise
        except Exception as exc:
            # Whatever is left is a misconfiguration, not a user error: a client id that
            # does not exist, USER_PASSWORD_AUTH disabled on the app client, an app
            # client with a secret. Keep the 400, but say where to look.
            log.warning("Cognito login failed: %s", exc)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Login failed") from exc

    # 3. Local fallback
    user = users.authenticate(body.email, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    user = _activate_stranded_org_owner(user)
    if user.get("status") != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is not active")
    token = create_token(user["email"], user["roles"], org_id=user.get("org_id", ""))
    return TokenResponse(
        access_token=token,
        refresh_token=create_refresh_token(user["email"]),
        sub=user["email"],
        org_id=user.get("org_id", ""),
        roles=user["roles"],
        status="active",
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest) -> TokenResponse:
    """Trade a refresh token for a fresh access token, without re-entering a password.

    Locally-signed refresh tokens are checked first: the built-in global admin gets one even
    when Cognito is configured, so "Cognito is on" is not enough to route by.
    """
    sub = decode_refresh_token(body.refresh_token)

    if sub:
        if sub == ADMIN_USERNAME:
            if ADMIN_PASSWORD is None:
                # The built-in admin was switched off since this token was issued.
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, sign in again")
            roles, org_id = [ROLE_PLATFORM_ADMIN], ""
        else:
            # Roles and status are re-read rather than carried in the token, so a user who
            # was deactivated or demoted cannot refresh their way back in.
            user = users.get_user(sub)
            if not user or user.get("status") != "active":
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, sign in again")
            roles, org_id = user.get("roles", [ROLE_USER]), user.get("org_id", "")
        return TokenResponse(
            access_token=create_token(sub, roles, org_id=org_id),
            # Rolling expiry: an active session keeps working, an abandoned one ages out.
            refresh_token=create_refresh_token(sub),
            sub=sub,
            org_id=org_id,
            roles=roles,
            status="active",
        )

    if _cognito_enabled():
        client = cognito_client()
        if not client:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
        try:
            result = client.initiate_auth(
                ClientId=os.getenv("COGNITO_APP_CLIENT_ID"),
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters={"REFRESH_TOKEN": body.refresh_token},
            )
        except client.exceptions.NotAuthorizedException as exc:
            # The only failure that actually means "this session is over".
            log.info("Cognito rejected the refresh token: %s", exc)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, sign in again") from exc
        except Exception as exc:
            # A throttle, a timeout, a misconfigured client id. Reporting these as 401 signs
            # the user out over a blip that has nothing to do with their credentials.
            log.warning("Cognito refresh failed: %s", exc)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth service unavailable") from exc
        access_token = result.get("AuthenticationResult", {}).get("AccessToken", "")
        principal = decode_cognito_token(access_token) if access_token else None
        if not principal:
            # Cognito just minted this token, so failing to decode it is our problem (JWKS
            # unreachable, wrong client id) — not an expired session.
            log.warning("Refreshed Cognito token could not be decoded")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth service unavailable")
        # Cognito rotates refresh tokens only if the pool is configured to; absent means
        # "keep the one you have", so echo it back rather than sending null.
        return TokenResponse(
            access_token=access_token,
            refresh_token=result.get("AuthenticationResult", {}).get("RefreshToken") or body.refresh_token,
            sub=principal.sub,
            org_id=principal.org_id,
            roles=principal.roles,
            status="active",
        )

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, sign in again")


class MeResponse(Principal):
    """The principal, plus the profile the screens that show a *person* need.

    `principal.sub` is an authentication identifier, not a profile. On the Cognito path it
    is whatever `_claim(payload, "email", "username", "sub")` found — an access token
    carries no `email` claim, so that is the `username` claim, which is only the pool's
    login handle and is not required to be the address the account was registered with.
    The navbar and the settings page were printing that handle as the user's name.

    UsersTable holds both the name someone typed at sign-up and the address they
    registered with, so this answers from there.
    """

    name: str = ""
    email: str = ""


@router.get("/me", response_model=MeResponse)
def me(principal: Principal = Depends(get_current_principal)) -> MeResponse:
    # create_user stores `name or email`, so an account with no name still answers
    # something readable and the UI's own fallback never has to fire.
    user = users.get_user(principal.sub) or {}
    return MeResponse(
        **principal.model_dump(),
        name=user.get("name") or "",
        email=user.get("email") or principal.sub,
    )


@router.get("/admin-check", response_model=Principal)
def admin_check(principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN))) -> Principal:
    """Demonstrates RBAC — requires the platform_admin role."""
    return principal


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def change_password(
    body: ChangePasswordRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
) -> None:
    """Change your own password, proving you know the current one.

    Distinct from /reset-password, which is the forgot-my-password path and takes an
    emailed code instead. Someone signed in should not have to lock themselves out and
    check their email to rotate a password they still know.

    Cognito wants the caller's own access token — the change is made as the user, not by
    an admin, which is what keeps "knows the old password" part of the check rather than
    something this endpoint could skip.
    """
    if _cognito_enabled():
        client = cognito_client()
        if not client:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
        token = request.headers.get("authorization", "")
        token = token[7:].strip() if token.lower().startswith("bearer ") else token.strip()
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")
        try:
            client.change_password(
                PreviousPassword=body.old_password,
                ProposedPassword=body.new_password,
                AccessToken=token,
            )
        except client.exceptions.NotAuthorizedException as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Current password is incorrect") from exc
        except client.exceptions.InvalidPasswordException as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="New password does not meet the password policy") from exc
        except Exception as exc:
            log.warning("Cognito change_password failed: %s", exc)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password change failed") from exc
        return

    if not users.authenticate(principal.sub, body.old_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    if not users.update_user(principal.sub, password=body.new_password):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password change failed")


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(body: ForgotPasswordRequest) -> ForgotPasswordResponse:
    """Request a password reset code. Cognito sends the code by email; local fallback returns it in the response."""
    if _cognito_enabled():
        client = cognito_client()
        if not client:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
        # Cognito is asked directly, without first looking the address up in the local
        # table. Cognito is the account of record here, and gating on a local row meant
        # any user it does not have — created in the console, or whose PostConfirmation
        # write failed — got "a reset code is on its way" and no email, forever.
        try:
            client.forgot_password(
                ClientId=os.getenv("COGNITO_APP_CLIENT_ID"),
                Username=body.email,
            )
        except client.exceptions.UserNotFoundException:
            # Same silent success as any unknown address: this form must not become a
            # way to test who has an account here.
            pass
        except Exception as exc:
            log.warning("Cognito forgot_password failed: %s", exc)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to process reset request") from exc
        return ForgotPasswordResponse()

    user = users.get_user(body.email)
    if not user:
        # Do not reveal whether the email exists.
        return ForgotPasswordResponse()

    # Local fallback: generate and store a reset code.
    code = _generate_code()
    users.update_user(body.email, reset_code=code)
    notifications.password_reset_requested(body.email, code)
    return ForgotPasswordResponse(reset_code=code)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def reset_password(body: ResetPasswordRequest) -> None:
    """Reset a password using a code from forgot-password."""
    user = users.get_user(body.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if _cognito_enabled():
        client = cognito_client()
        if not client:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
        try:
            client.confirm_forgot_password(
                ClientId=os.getenv("COGNITO_APP_CLIENT_ID"),
                Username=body.email,
                ConfirmationCode=body.code,
                Password=body.new_password,
            )
        except Exception as exc:
            log.warning("Cognito confirm_forgot_password failed: %s", exc)
            # Pass Cognito's message through: a flat "Invalid or expired reset code"
            # also swallows InvalidPasswordException (policy) and LimitExceededException,
            # so a valid code with a short password reads as a bad code.
            reason = getattr(exc, "response", {}).get("Error", {}).get("Message")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=reason or "Invalid or expired reset code",
            ) from exc
        return

    stored_code = user.get("reset_code")
    if not stored_code or stored_code != body.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code")

    users.update_user(body.email, password=body.new_password, reset_code=None)
