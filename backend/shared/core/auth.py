"""Auth — API key + HS256 JWT + role checks.

The JWT secret and API keys come from the environment (PINGHOLD_JWT_SECRET,
PINGHOLD_API_KEYS) rather than a per-process random, so tokens stay valid across replicas
and Lambda cold starts. main.py applies get_current_principal to every router except
health and auth.

Development fallbacks exist for all three credentials so the API runs on a laptop with no
setup. They are development-only by construction: in a deployment (see is_deployed) a
missing JWT secret refuses to start, and the built-in admin login and dev API key switch
off instead of falling back to values published in this repository.
"""

from __future__ import annotations

import logging
import os
import secrets
import time

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

log = logging.getLogger("pinghold.auth")

JWT_ALG = "HS256"
# Access tokens stay short-lived — /auth/refresh trades a refresh token for a new one, so a
# long session no longer needs a long-lived bearer sitting in the browser. Kept in step with
# AccessTokenValidity on the Cognito client in template.yaml.
JWT_TTL_SECONDS = 3600
# Matches RefreshTokenValidity on the Cognito client: how long "stay signed in" lasts before
# the password is required again.
REFRESH_TTL_SECONDS = 30 * 24 * 3600

# Three roles: a platform-wide superuser, an admin scoped to their own org, and a plain
# user. ponytail: three string constants, not an enum/RBAC table — add granularity only
# if a real permission boundary beyond these shows up.
ROLE_PLATFORM_ADMIN = "platform_admin"
ROLE_ORG_ADMIN = "org_admin"
ROLE_USER = "user"

DEV_JWT_SECRET = "dev-insecure-secret-change-me"
DEV_API_KEY = "dev-admin-key"
DEV_ADMIN_PASSWORD = "admin321"

# Values that mean "nobody has set this yet". The middle one is what template.yaml seeds
# pinghold/app-secrets-<stage> with, so a stack that was deployed but never rotated is
# treated as unset rather than as a real secret — it is published in this repository.
_PLACEHOLDERS = {"", DEV_JWT_SECRET, "change-me-in-production", "changeme"}


class InsecureConfiguration(RuntimeError):
    """A deployed service is missing a secret it must not run without.

    Raised at import so the process refuses to start. The alternative — starting with the
    development fallback — means anyone who has read this repository can mint a
    platform_admin token against the deployment.
    """


def is_deployed() -> bool:
    """True when this is a real deployment rather than a laptop or a test run.

    Lambda always sets AWS_LAMBDA_FUNCTION_NAME. Container and EC2 deployments have no
    such marker, so they opt in with PINGHOLD_REQUIRE_SECURE=1.
    """
    return bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME")) or os.getenv("PINGHOLD_REQUIRE_SECURE") == "1"


def load_jwt_secret() -> str:
    secret = (os.getenv("PINGHOLD_JWT_SECRET") or "").strip()
    if secret in _PLACEHOLDERS:
        if is_deployed():
            raise InsecureConfiguration(
                "PINGHOLD_JWT_SECRET is unset or still the placeholder value. Set it to a "
                "random secret (e.g. `openssl rand -base64 48`) in pinghold/app-secrets-<stage> "
                "before deploying — tokens signed with the published default are forgeable."
            )
        log.warning("PINGHOLD_JWT_SECRET unset — using the insecure dev secret. Set it for production.")
        return DEV_JWT_SECRET
    return secret


def load_api_keys() -> dict[str, dict]:
    """PINGHOLD_API_KEYS format: 'key:name:role1,role2;key2:name2:role'.

    Unset is legitimate in a deployment — JWTs are the primary scheme and API keys are for
    machine callers — so an empty map is fine. What is never fine is falling back to the
    published dev key, which grants platform_admin.
    """
    raw = os.getenv("PINGHOLD_API_KEYS") or ""
    keys: dict[str, dict] = {}
    for entry in raw.split(";"):
        parts = entry.split(":")
        if len(parts) >= 3 and parts[0].strip():
            keys[parts[0].strip()] = {"name": parts[1], "roles": [r for r in parts[2].split(",") if r]}

    if keys:
        return keys
    if is_deployed():
        log.info("PINGHOLD_API_KEYS unset — API-key auth disabled; bearer tokens only.")
        return {}
    log.warning("PINGHOLD_API_KEYS unset — using dev API key '%s' (platform_admin).", DEV_API_KEY)
    return {DEV_API_KEY: {"name": "dev-admin", "roles": [ROLE_PLATFORM_ADMIN]}}


JWT_SECRET = load_jwt_secret()
API_KEYS = load_api_keys()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


class Principal(BaseModel):
    sub: str
    roles: list[str]
    org_id: str = ""


def create_token(sub: str, roles: list[str], org_id: str = "") -> str:
    payload = {
        "sub": sub,
        "roles": roles,
        "org_id": org_id,
        "exp": int(time.time()) + JWT_TTL_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(sub: str) -> str:
    """Long-lived token whose only power is minting access tokens at /auth/refresh.

    It carries no roles: they are re-read from the user store on every refresh, so a
    demotion or a deactivation takes effect within one access-token lifetime rather than
    living on in a token issued weeks ago.
    """
    payload = {"sub": sub, "typ": "refresh", "exp": int(time.time()) + REFRESH_TTL_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_refresh_token(token: str) -> str | None:
    """Return the subject of a valid refresh token, else None."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None
    return payload.get("sub") if payload.get("typ") == "refresh" else None


def _decode(token: str) -> Principal | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        # Both are signed with the same secret, so without this a refresh token is also a
        # bearer token — a 30-day one, which is exactly what it must not be.
        if payload.get("typ") == "refresh":
            return None
        return Principal(
            sub=payload.get("sub", ""),
            roles=payload.get("roles", []),
            org_id=payload.get("org_id", ""),
        )
    except jwt.PyJWTError:
        return None


def authenticate_api_key(api_key: str) -> Principal | None:
    info = API_KEYS.get(api_key)
    return Principal(sub=info["name"], roles=info["roles"], org_id=info.get("org_id", "")) if info else None


def _resolve_principal(
    api_key: str | None,
    credentials: HTTPAuthorizationCredentials | None,
) -> Principal | None:
    # Local import to avoid a circular import between auth.py and cognito.py.
    from .cognito import decode_cognito_token

    if api_key:
        p = authenticate_api_key(api_key)
        if p:
            return p
    if credentials:
        token = credentials.credentials
        # Prefer Cognito when a user pool is configured; fall back to local JWT.
        if os.getenv("COGNITO_USER_POOL_ID"):
            p = decode_cognito_token(token)
            if p:
                return p
        p = _decode(token)
        if p:
            return p
    return None


def get_current_principal(
    api_key: str | None = Depends(api_key_header),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Principal:
    p = _resolve_principal(api_key, credentials)
    if p:
        return p
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_optional_principal(
    api_key: str | None = Depends(api_key_header),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Principal | None:
    return _resolve_principal(api_key, credentials)


ADMIN_USERNAME = "admin"


def load_admin_password() -> str | None:
    """The built-in platform-admin password, or None to disable that login entirely.

    On a laptop this keeps the familiar dev credentials. In a deployment, leaving
    PINGHOLD_ADMIN_PASSWORD unset switches the built-in admin off rather than falling back
    to a password published in this repository — a deployment that wants it must choose one.
    """
    password = (os.getenv("PINGHOLD_ADMIN_PASSWORD") or "").strip()
    if password and password not in _PLACEHOLDERS:
        return password
    if is_deployed():
        log.warning(
            "PINGHOLD_ADMIN_PASSWORD unset — the built-in '%s' login is disabled. "
            "Sign in through Cognito, or set the variable to enable it.", ADMIN_USERNAME,
        )
        return None
    return DEV_ADMIN_PASSWORD


ADMIN_PASSWORD = load_admin_password()


def authenticate_global_admin(email: str, password: str) -> Principal | None:
    """Recognize the built-in global admin credentials as a platform admin principal."""
    if ADMIN_PASSWORD is None:
        return None
    # secrets.compare_digest keeps this from leaking the password one character at a time
    # through response timing — it is the only credential compared in the process.
    if email.strip().lower() == ADMIN_USERNAME and secrets.compare_digest(password, ADMIN_PASSWORD):
        return Principal(sub=email, roles=[ROLE_PLATFORM_ADMIN], org_id="")
    return None


def require_role(role: str):
    def _dep(principal: Principal = Depends(get_current_principal)) -> Principal:
        if role not in principal.roles and ROLE_PLATFORM_ADMIN not in principal.roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Role '{role}' required")
        return principal

    return _dep
