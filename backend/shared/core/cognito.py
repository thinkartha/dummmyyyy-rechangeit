"""Cognito JWT validation and role extraction.

Used when the backend runs behind API Gateway with a Cognito authorizer.
API Gateway already validates the signature, but this module lets the FastAPI
application extract the caller identity, org_id, and Cognito group roles from
the provided access/id token.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import jwt
import urllib.request

from .auth import Principal, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, ROLE_USER

log = logging.getLogger("pinghold.cognito")

USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID")
_AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
_JWKS: dict[str, Any] | None = None


def _jwks_url() -> str:
    return f"https://cognito-idp.{_AWS_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"


def _get_jwks() -> dict[str, Any]:
    global _JWKS
    if _JWKS is None:
        with urllib.request.urlopen(_jwks_url(), timeout=10) as resp:
            _JWKS = json.load(resp)
    return _JWKS


def _public_key(kid: str) -> jwt.PyJWK | None:
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwt.PyJWK(key)
    return None


def _cognito_group_to_role(group: str) -> str:
    """Map Cognito group names to internal platform roles."""
    if group == "GlobalAdmin":
        return ROLE_PLATFORM_ADMIN
    if group == "OrgAdmin":
        return ROLE_ORG_ADMIN
    return ROLE_USER


def cognito_client():
    """Return a boto3 cognito-idp client, or None if not configured."""
    if not USER_POOL_ID or not APP_CLIENT_ID:
        log.warning("Cognito client not configured (pool or client id missing)")
        return None
    try:
        import boto3

        return boto3.client("cognito-idp", region_name=_AWS_REGION)
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("Cognito client unavailable: %s", exc)
        return None


def _claim(payload: dict, *keys: str) -> Any:
    """Return the first present claim value from a list of possible keys."""
    for key in keys:
        value = payload.get(key)
        if value:
            return value
    return ""


def _org_id_from_store(email: str) -> str:
    """Membership read from the user store, for a token that carries no org claim.

    Cognito's V1_0 pre-token-generation trigger — the one template.yaml wires up under
    LambdaConfig.PreTokenGeneration — can only add claims to the *ID* token. This service
    authenticates with the **access** token (see /auth/login), and an access token never
    carries custom attributes, so `custom:org_id` is simply absent on every request: the
    caller looks org-less even when they are a member. The same gap swallows anyone whose
    membership changed after their attributes were stamped (an approved join request, an
    ownership transfer, a removal).

    UsersTable is where every membership write lands, so it is the source of truth and the
    claim is only a cache. The lookup is keyed by the email off the *verified* token — an
    unverified claim never chooses a tenant.
    """
    from . import users  # local import: keeps this module importable without the store

    if not email:
        return ""
    return (users.get_user(email) or {}).get("org_id", "") or ""


def decode_cognito_token(token: str) -> Principal | None:
    """Decode and validate a Cognito access or ID token, returning a platform Principal."""
    if not USER_POOL_ID:
        log.warning("COGNITO_USER_POOL_ID unset; cannot decode Cognito token")
        return None

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            return None

        # Inspect token_use without verifying signature to choose the right audience check.
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        token_use = unverified_payload.get("token_use")
        issuer = f"https://cognito-idp.{_AWS_REGION}.amazonaws.com/{USER_POOL_ID}"

        jwk = _public_key(kid)
        if not jwk:
            return None

        if token_use == "access":
            # Access tokens do not have an 'aud' claim; verify client_id manually.
            payload = jwt.decode(token, jwk.key, algorithms=["RS256"], issuer=issuer)
            if payload.get("client_id") != APP_CLIENT_ID:
                return None
        elif token_use == "id":
            payload = jwt.decode(token, jwk.key, algorithms=["RS256"], audience=APP_CLIENT_ID, issuer=issuer)
        else:
            # Unknown token type; try with audience validation.
            payload = jwt.decode(token, jwk.key, algorithms=["RS256"], audience=APP_CLIENT_ID, issuer=issuer)

        sub = payload.get("sub", "")
        email = _claim(payload, "email", "username", "sub")
        org_id = _claim(payload, "custom:org_id", "org_id") or _org_id_from_store(email)
        role_claim = _claim(payload, "custom:role")
        groups = payload.get("cognito:groups", [])
        if isinstance(groups, str):
            groups = [groups]

        roles = list({_cognito_group_to_role(g) for g in groups if g})
        if role_claim and role_claim not in roles:
            roles.append(role_claim)
        if not roles:
            roles = [ROLE_USER]

        return Principal(sub=email, roles=roles, org_id=org_id)
    except Exception as exc:  # pragma: no cover - depends on Cognito
        log.warning("Cognito token decode failed: %s", exc)
        return None
