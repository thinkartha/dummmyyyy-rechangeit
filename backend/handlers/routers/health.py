import os

from fastapi import APIRouter

from shared.core import users

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/store")
def store_health() -> dict[str, object]:
    """Report whether writes actually reach DynamoDB.

    users.py falls back to an in-memory dict when the table is unset or unreachable,
    which makes every write look like it succeeded and vanish on the next cold start.
    That fallback is right for local dev and silent everywhere else, so surface it.
    """
    table_name = os.getenv("PINGHOLD_USERS_TABLE")
    table = users._get_table()
    return {
        "users_table_env": table_name or None,
        "backend": "dynamodb" if table is not None else "in-memory (NOT PERSISTENT)",
        "persistent": table is not None,
    }
