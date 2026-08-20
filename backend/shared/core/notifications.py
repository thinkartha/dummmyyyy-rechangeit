"""Webhook notifications for org lifecycle events.

POSTs a JSON payload to PINGHOLD_WEBHOOK_URL when a user wants to join an org,
is invited, or a join request is approved/denied. If no webhook URL is configured,
the event is only logged.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

log = logging.getLogger("pinghold.notifications")

_WEBHOOK_URL = os.getenv("PINGHOLD_WEBHOOK_URL")


def _send(url: str, payload: dict[str, Any]) -> bool:
    try:
        import urllib.request
        import json

        body = json.dumps(payload).encode()
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status < 400
    except Exception as exc:  # pragma: no cover - external network
        log.warning("Webhook send failed: %s", exc)
        return False


def _post(event: str, org_id: str, email: str, extras: dict[str, Any] | None = None) -> None:
    if not _WEBHOOK_URL:
        log.info("No PINGHOLD_WEBHOOK_URL configured; skipping %s notification for %s", event, email)
        return
    payload = {"event": event, "org_id": org_id, "email": email, "timestamp": str(time.time())}
    if extras:
        payload.update(extras)
    _send(_WEBHOOK_URL, payload)


def join_request_created(org_id: str, email: str, name: str | None = None) -> None:
    _post("join_request.created", org_id, email, {"name": name or email, "message": "A user requested to join this organization"})


def join_request_approved(org_id: str, email: str) -> None:
    _post("join_request.approved", org_id, email, {"message": "Your request to join the organization was approved"})


def join_request_denied(org_id: str, email: str) -> None:
    _post("join_request.denied", org_id, email, {"message": "Your request to join the organization was denied"})


def user_invited(org_id: str, email: str, invite_token: str, temporary_password: str | None = None) -> None:
    _post(
        "user.invited",
        org_id,
        email,
        {"invite_token": invite_token, "temporary_password": temporary_password, "message": "You have been invited to join an organization"},
    )


def confirmation_required(email: str, confirmation_code: str) -> None:
    _post(
        "user.confirmation_required",
        "",
        email,
        {"confirmation_code": confirmation_code, "message": "A confirmation code is required to activate this account"},
    )


def password_reset_requested(email: str, reset_code: str) -> None:
    _post(
        "user.password_reset_requested",
        "",
        email,
        {"reset_code": reset_code, "message": "A password reset was requested"},
    )


def user_approved(email: str, org_id: str = "") -> None:
    _post(
        "user.approved",
        org_id,
        email,
        {"message": "Your account has been approved by a global administrator"},
    )


def user_denied(email: str, org_id: str = "") -> None:
    _post(
        "user.denied",
        org_id,
        email,
        {"message": "Your account has been denied by a global administrator"},
    )
