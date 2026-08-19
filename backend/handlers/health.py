"""Health check Lambda — confirm API wiring works."""

from __future__ import annotations

from typing import Any

from shared.response import ok


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    return ok(
        {
            "service": "loveheartbeat-backend",
            "status": "healthy",
            "requestId": getattr(context, "aws_request_id", None),
        }
    )
