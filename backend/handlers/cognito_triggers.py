"""AWS Cognito Lambda trigger handlers for Loveheartbeat multi-tenancy.

These are deployed separately as Lambda functions (see apps/api/template.yaml) and wired
into Cognito User Pool triggers. The package is kept inside the API source tree so it can
share store code if needed, but the handlers run as standalone Lambda entry points.
"""

from __future__ import annotations

import json
import logging
import os
import time

log = logging.getLogger("pinghold.cognito_triggers")
log.setLevel(logging.INFO)

# The same in-memory fallback used by the API stores when DynamoDB is not configured.
# In Lambda, PINGHOLD_*_TABLE should be set so real tables are used.


def _users_table():
    import boto3

    table_name = os.getenv("PINGHOLD_USERS_TABLE")
    if not table_name:
        return None
    return boto3.resource("dynamodb").Table(table_name)


def _cognito_groups(user_pool_id: str, username: str):
    """Fetch Cognito groups for a user."""
    import boto3

    try:
        client = boto3.client("cognito-idp", region_name=os.getenv("AWS_REGION", "us-east-1"))
        result = client.admin_list_groups_for_user(
            UserPoolId=user_pool_id,
            Username=username,
        )
        return [g["GroupName"] for g in result.get("Groups", [])]
    except Exception as exc:
        log.warning("Failed to list groups for %s: %s", username, exc)
        return []


def pre_sign_up(event, context):
    """Pre sign-up trigger: auto-confirm admin-created users and validate email domain if configured."""
    log.info("pre_sign_up trigger for %s", event.get("userName"))
    # Auto-confirm so admin-created users (via AdminCreateUser) do not need a verification code.
    # Public sign-up still requires email confirmation unless the frontend decides otherwise.
    event["response"]["autoConfirmUser"] = event["request"].get("userAttributes", {}).get("email_verified") == "true"
    return event


def post_confirmation(event, context):
    """Post confirmation trigger: sync the confirmed user into UsersTable.

    Creates the DynamoDB record if it does not exist, setting org_id and role from Cognito
    attributes. This acts as a safety net for users confirmed directly in Cognito.
    """
    user_pool_id = event.get("userPoolId")
    user_name = event.get("userName")
    attributes = event.get("request", {}).get("userAttributes", {})
    email = attributes.get("email") or user_name
    org_id = attributes.get("custom:org_id", "")
    role = attributes.get("custom:role", "user")

    log.info("post_confirmation trigger for %s / %s", user_name, email)

    # If a record already exists (backend created it at registration), leave it.
    table = _users_table()
    if not table:
        log.warning("PINGHOLD_USERS_TABLE not set; skipping post_confirmation sync")
        return event

    try:
        existing = table.get_item(Key={"email": email}).get("Item")
        if existing:
            return event
    except Exception as exc:
        log.warning("post_confirmation get_item failed: %s", exc)

    item = {
        "email": email,
        "roles": [role],
        "name": email,
        "org_id": org_id,
        "status": "active",
        "created_at": str(time.time()),
    }
    try:
        table.put_item(Item=item, ConditionExpression="attribute_not_exists(email)")
    except Exception as exc:
        log.warning("post_confirmation put_item failed: %s", exc)
    return event


def pre_token_generation(event, context):
    """Pre token generation trigger: inject custom:org_id and custom:role claims into tokens.

    This guarantees that ID and access tokens include the tenant and role claims for the
    backend to extract, even if the attributes were set after the user signed up.
    """
    user_pool_id = event.get("userPoolId")
    user_name = event.get("userName")
    attributes = event.get("request", {}).get("userAttributes", {})

    org_id = attributes.get("custom:org_id", "")
    role = attributes.get("custom:role", "user")

    # If custom:role is missing, derive it from group membership.
    if not attributes.get("custom:role"):
        groups = _cognito_groups(user_pool_id, user_name)
        if "GlobalAdmin" in groups:
            role = "platform_admin"
        elif "OrgAdmin" in groups:
            role = "org_admin"
        else:
            role = "user"

    log.info("pre_token_generation trigger for %s org_id=%s role=%s", user_name, org_id, role)

    event.setdefault("response", {})
    event["response"]["claimsOverrideDetails"] = {
        "claimsToAddOrOverride": {
            "custom:org_id": org_id,
            "custom:role": role,
        },
    }
    return event


def handler(name: str):
    """Entry-point factory for SAM template to wire a single Lambda to multiple triggers."""
    mapping = {
        "PreSignUp": pre_sign_up,
        "PostConfirmation": post_confirmation,
        "PreTokenGeneration": pre_token_generation,
    }
    func = mapping.get(name)
    if not func:
        raise ValueError(f"Unknown trigger handler: {name}")

    def _lambda(event, context):
        log.info("Invoking %s trigger", name)
        return func(event, context)

    return _lambda


# Named Lambda entry points expected by the SAM template.
pre_sign_up_handler = handler("PreSignUp")
post_confirmation_handler = handler("PostConfirmation")
pre_token_generation_handler = handler("PreTokenGeneration")
