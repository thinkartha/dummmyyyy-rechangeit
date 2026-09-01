"""Tenant admin routes for organization and user management.

- Global admins can create/list organizations and manage any user.
- Org admins can invite users, approve/deny join requests, and list/remove users in their org.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from shared.core.auth import (
    ROLE_ORG_ADMIN,
    ROLE_PLATFORM_ADMIN,
    ROLE_USER,
    Principal,
    get_current_principal,
    require_role,
)
from shared.core.cognito import cognito_client
from shared.core import invites, join_requests, notifications, orgs, users

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
log = logging.getLogger("pinghold.admin")


class CreateOrgRequest(BaseModel):
    name: str
    owner_email: str = ""
    status: str = "active"
    plan: str = "free"
    seats: int = 5
    industry: str = ""


class InviteUserRequest(BaseModel):
    email: str
    name: str | None = None
    role: str = ROLE_USER


class TransferOwnershipRequest(BaseModel):
    new_owner_email: str


class JoinRequestAction(BaseModel):
    action: str  # approve | deny


class UpdateUserRequest(BaseModel):
    role: str | None = None
    status: str | None = None


class UpdateOrgRequest(BaseModel):
    name: str | None = None
    status: str | None = None
    plan: str | None = None
    seats: int | None = None
    industry: str | None = None
    owner_email: str | None = None
    # Environments have no routes of their own — they are a list on the organization, and
    # the admin console edits them through this field.
    environments: list[dict] | None = None


class CreateGlobalUserRequest(BaseModel):
    name: str | None = None
    email: str
    role: str = ROLE_USER  # accepts super_admin/org_admin/member or backend role names
    org_id: str | None = None
    status: str = "active"
    password: str | None = None


class UpdateGlobalUserRequest(BaseModel):
    name: str | None = None
    role: str | None = None
    org_id: str | None = None
    status: str | None = None


def _cognito_enabled() -> bool:
    return bool(os.getenv("COGNITO_USER_POOL_ID") and os.getenv("COGNITO_APP_CLIENT_ID"))


def _is_org_admin_for(principal: Principal, org_id: str) -> bool:
    return ROLE_ORG_ADMIN in principal.roles and principal.org_id == org_id


def _cognito_group_name(role: str) -> str:
    if role == ROLE_PLATFORM_ADMIN:
        return "GlobalAdmin"
    if role == ROLE_ORG_ADMIN:
        return "OrgAdmin"
    return "User"


def _normalize_role(role: str) -> str:
    """Map frontend/global role names into backend role constants."""
    mapping = {
        "super_admin": ROLE_PLATFORM_ADMIN,
        "org_admin": ROLE_ORG_ADMIN,
        "member": ROLE_USER,
    }
    return mapping.get(role, role)


def _frontend_role(role: str) -> str:
    """Map backend role constants into frontend/global role names."""
    mapping = {
        ROLE_PLATFORM_ADMIN: "super_admin",
        ROLE_ORG_ADMIN: "org_admin",
        ROLE_USER: "member",
    }
    return mapping.get(role, role)


@router.post("/organizations", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_organization(
    body: CreateOrgRequest,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: create a new organization."""
    org = orgs.create_org(
        name=body.name,
        owner_email=body.owner_email,
        status=body.status,
        plan=body.plan,
        seats=body.seats,
        industry=body.industry,
    )
    if not org.get("org_id"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Organization creation failed")
    log.info("Organization created by %s: %s", principal.sub, org["org_id"])
    return org


@router.get("/organizations", response_model=list[dict])
def list_organizations(
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> list[dict]:
    """Platform admin: list all organizations."""
    return orgs.list_orgs()


@router.get("/organizations/{org_id}/users", response_model=list[dict])
def list_organization_users(
    org_id: str,
    principal: Principal = Depends(get_current_principal),
) -> list[dict]:
    """List users in an organization. Accessible to platform admins and org admins of that org."""
    if ROLE_PLATFORM_ADMIN not in principal.roles and not _is_org_admin_for(principal, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this organization")
    return users.list_users_by_org(org_id)


@router.post("/organizations/{org_id}/invite", response_model=dict, status_code=status.HTTP_201_CREATED)
def invite_user(
    org_id: str,
    body: InviteUserRequest,
    principal: Principal = Depends(get_current_principal),
) -> dict:
    """Invite a user to an organization. Generates a 1-day signed invite token and creates Cognito user if configured."""
    if ROLE_PLATFORM_ADMIN not in principal.roles and not _is_org_admin_for(principal, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this organization")

    target_org = orgs.get_org(org_id)
    if not target_org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    role = body.role if body.role in {ROLE_USER, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} else ROLE_USER
    temporary_password = os.urandom(16).hex()
    invite_token = invites.create_invite(body.email, org_id, role=role)

    if _cognito_enabled():
        client = cognito_client()
        if not client:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cognito unavailable")
        try:
            client.admin_create_user(
                UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                Username=body.email,
                UserAttributes=[
                    {"Name": "email", "Value": body.email},
                    {"Name": "email_verified", "Value": "true"},
                    {"Name": "custom:org_id", "Value": org_id},
                    {"Name": "custom:role", "Value": role},
                ],
                TemporaryPassword=temporary_password,
                MessageAction="SUPPRESS",
            )
            client.admin_add_user_to_group(
                UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                Username=body.email,
                GroupName=_cognito_group_name(role),
            )
        except client.exceptions.UsernameExistsException:
            # If the user already exists in Cognito but is not in our store, continue with invite.
            pass

    notifications.user_invited(org_id, body.email, invite_token, temporary_password=temporary_password)

    return {
        "email": body.email,
        "org_id": org_id,
        "role": role,
        "invite_token": invite_token,
        "temporary_password": temporary_password,
        "expires_in_seconds": 86400,
        "note": "Invite tokens expire in 1 day. Distribute via secure channel.",
    }


@router.post("/organizations/{org_id}/transfer-ownership", response_model=dict)
def transfer_ownership(
    org_id: str,
    body: TransferOwnershipRequest,
    principal: Principal = Depends(get_current_principal),
) -> dict:
    """Hand an organization to another of its members.

    Only the current owner (or a platform admin) can do this — being an org admin is not
    enough, or any admin could take the organization from the person who created it. The
    new owner must already be a member: transferring to an address that has not accepted
    an invite would leave the organization owned by nobody who can sign in.

    The outgoing owner keeps org_admin rather than being demoted. Losing your own access
    as a side effect of handing over the title is the kind of surprise that needs a
    separate, deliberate click — Members can remove them.
    """
    org = orgs.get_org(org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    is_owner = (org.get("owner_email") or "").lower() == (principal.sub or "").lower()
    if ROLE_PLATFORM_ADMIN not in principal.roles and not (is_owner and principal.org_id == org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only the organization owner can transfer ownership")

    new_owner = users.get_user(body.new_owner_email)
    if not new_owner or new_owner.get("org_id") != org_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="That person is not a member of this organization. Invite them first.")
    if (new_owner.get("email") or "").lower() == (org.get("owner_email") or "").lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="They already own this organization")

    roles = list(new_owner.get("roles") or [])
    if ROLE_ORG_ADMIN not in roles:
        roles.append(ROLE_ORG_ADMIN)
        users.update_user(new_owner["email"], roles=roles)
        if _cognito_enabled():
            client = cognito_client()
            if client:
                try:
                    client.admin_add_user_to_group(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=new_owner["email"],
                        GroupName=_cognito_group_name(ROLE_ORG_ADMIN),
                    )
                except Exception as exc:  # pragma: no cover
                    log.warning("Cognito group add failed during transfer: %s", exc)

    if not orgs.update_org(org_id, owner_email=new_owner["email"]):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Transfer failed")

    log.info("Organization %s transferred from %s to %s", org_id, principal.sub, new_owner["email"])
    return {"org_id": org_id, "owner_email": new_owner["email"], "previous_owner": principal.sub}


@router.get("/organizations/{org_id}/join-requests", response_model=list[dict])
def list_pending_join_requests(
    org_id: str,
    principal: Principal = Depends(get_current_principal),
) -> list[dict]:
    """List pending join requests for an organization."""
    if ROLE_PLATFORM_ADMIN not in principal.roles and not _is_org_admin_for(principal, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this organization")
    if not orgs.get_org(org_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return join_requests.list_join_requests_for_org(org_id)


@router.post("/organizations/{org_id}/join-requests/{email}", response_model=dict)
def act_on_join_request(
    org_id: str,
    email: str,
    body: JoinRequestAction,
    principal: Principal = Depends(get_current_principal),
) -> dict:
    """Approve or deny a user's request to join an organization."""
    if ROLE_PLATFORM_ADMIN not in principal.roles and not _is_org_admin_for(principal, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this organization")

    request = join_requests.get_join_request(email, org_id)
    if not request or request.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")

    if body.action == "approve":
        user = users.get_user(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        users.update_user(email, org_id=org_id, status="active")
        if _cognito_enabled():
            client = cognito_client()
            if client:
                try:
                    client.admin_update_user_attributes(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=email,
                        UserAttributes=[
                            {"Name": "custom:org_id", "Value": org_id},
                            {"Name": "custom:role", "Value": ROLE_USER},
                        ],
                    )
                    client.admin_add_user_to_group(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=email,
                        GroupName="User",
                    )
                except Exception as exc:  # pragma: no cover - AWS dependency
                    log.warning("Cognito approve join request failed: %s", exc)
        join_requests.delete_join_request(email, org_id)
        notifications.join_request_approved(org_id, email)
        return {"email": email, "org_id": org_id, "status": "approved"}

    if body.action == "deny":
        users.update_user(email, status="denied")
        join_requests.delete_join_request(email, org_id)
        notifications.join_request_denied(org_id, email)
        return {"email": email, "org_id": org_id, "status": "denied"}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="action must be 'approve' or 'deny'")


@router.put("/organizations/{org_id}/users/{email}", response_model=dict)
def update_organization_user(
    org_id: str,
    email: str,
    body: UpdateUserRequest,
    principal: Principal = Depends(get_current_principal),
) -> dict:
    """Update a user's role/status within an organization."""
    if ROLE_PLATFORM_ADMIN not in principal.roles and not _is_org_admin_for(principal, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this organization")

    user = users.get_user(email)
    if not user or user.get("org_id") != org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    fields: dict[str, str | list[str]] = {}
    if body.status:
        fields["status"] = body.status
    if body.role:
        if body.role not in {ROLE_USER, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        fields["roles"] = [body.role]
        if _cognito_enabled():
            client = cognito_client()
            if client:
                try:
                    client.admin_update_user_attributes(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=email,
                        UserAttributes=[{"Name": "custom:role", "Value": body.role}],
                    )
                    client.admin_add_user_to_group(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=email,
                        GroupName=_cognito_group_name(body.role),
                    )
                except Exception as exc:  # pragma: no cover - AWS dependency
                    log.warning("Cognito update user role failed: %s", exc)

    if not users.update_user(email, **fields):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed")

    return users.get_user(email) or {}


@router.delete("/organizations/{org_id}/users/{email}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def remove_organization_user(
    org_id: str,
    email: str,
    principal: Principal = Depends(get_current_principal),
) -> None:
    """Remove a user from an organization."""
    if ROLE_PLATFORM_ADMIN not in principal.roles and not _is_org_admin_for(principal, org_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this organization")

    user = users.get_user(email)
    if not user or user.get("org_id") != org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    users.update_user(email, status="inactive", org_id="")
    if _cognito_enabled():
        client = cognito_client()
        if client:
            try:
                client.admin_disable_user(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=email,
                )
            except Exception as exc:  # pragma: no cover - AWS dependency
                log.warning("Cognito disable user failed: %s", exc)
    log.info("User %s removed from org %s by %s", email, org_id, principal.sub)


# ═══════════════════════════════════════════════════════════════════════════════
# Global admin endpoints
# ═══════════════════════════════════════════════════════════════════════════════


def _serialize_user(user: dict) -> dict:
    """Return a user dict with both backend and frontend-friendly keys."""
    role = _frontend_role((user.get("roles") or ["user"])[0])
    return {
        **user,
        "id": user.get("email"),
        "role": role,
        "orgId": user.get("org_id"),
        "createdAt": user.get("created_at"),
        "lastActive": user.get("created_at"),
    }


def _serialize_org(org: dict) -> dict:
    """Return an org dict with both backend and frontend-friendly keys."""
    return {
        **org,
        "id": org.get("org_id"),
        "createdAt": org.get("created_at"),
    }


@router.get("/my-organization", response_model=dict)
def get_my_organization(principal: Principal = Depends(get_current_principal)) -> dict:
    """The caller's own organization.

    Every other read of an organization is platform-admin only, which left a member with
    no way to learn the one fact the settings screen needs: who owns the organization
    they are in. Ownership cannot be inferred from a role — org_admin is a role several
    people can hold, owner_email is one address — so the UI has to be told.
    """
    if not principal.org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="This account does not belong to an organization")
    org = orgs.get_org(principal.org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return _serialize_org(org)


@router.get("/organizations/{org_id}", response_model=dict)
def get_organization(
    org_id: str,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: get a single organization."""
    org = orgs.get_org(org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return _serialize_org(org)


@router.put("/organizations/{org_id}", response_model=dict)
def update_organization(
    org_id: str,
    body: UpdateOrgRequest,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: update organization details."""
    if not orgs.get_org(org_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    if not orgs.update_org(org_id, **fields):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed")
    updated = orgs.get_org(org_id)
    return _serialize_org(updated) if updated else {}


@router.delete("/organizations/{org_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_organization(
    org_id: str,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> None:
    """Platform admin: delete an organization and its members."""
    if not orgs.get_org(org_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    for user in users.list_users_by_org(org_id):
        users.delete_user(user["email"])
    orgs.delete_org(org_id)
    log.info("Organization %s deleted by %s", org_id, principal.sub)


@router.get("/users", response_model=list[dict])
def list_all_users(
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> list[dict]:
    """Platform admin: list all users on the platform."""
    return [_serialize_user(u) for u in users.list_all_users()]


@router.post("/users", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_global_user(
    body: CreateGlobalUserRequest,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: create a user account directly."""
    role = _normalize_role(body.role)
    if role not in {ROLE_USER, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    password = body.password or os.urandom(16).hex()
    org_id = body.org_id or ("" if role == ROLE_PLATFORM_ADMIN else "")

    if not users.create_user(
        email=body.email,
        password=password,
        roles=[role],
        name=body.name,
        org_id=org_id,
        status=body.status,
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if _cognito_enabled():
        client = cognito_client()
        if client:
            try:
                client.admin_create_user(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=body.email,
                    UserAttributes=[
                        {"Name": "email", "Value": body.email},
                        {"Name": "email_verified", "Value": "true"},
                        {"Name": "custom:org_id", "Value": org_id},
                        {"Name": "custom:role", "Value": role},
                    ],
                    TemporaryPassword=password,
                    MessageAction="SUPPRESS",
                )
                client.admin_add_user_to_group(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=body.email,
                    GroupName=_cognito_group_name(role),
                )
            except client.exceptions.UsernameExistsException:
                pass
            except Exception as exc:  # pragma: no cover
                log.warning("Cognito admin_create_user failed: %s", exc)

    log.info("User %s created by %s with role %s", body.email, principal.sub, role)
    created = users.get_user(body.email)
    return {**_serialize_user(created or {}), "temporary_password": password}


@router.get("/users/{email}", response_model=dict)
def get_global_user(
    email: str,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: get a user by email."""
    user = users.get_user(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _serialize_user(user)


@router.put("/users/{email}", response_model=dict)
def update_global_user(
    email: str,
    body: UpdateGlobalUserRequest,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: update a user account globally."""
    user = users.get_user(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    fields: dict[str, Any] = {}
    if body.name:
        fields["name"] = body.name
    if body.status:
        fields["status"] = body.status
    if body.role:
        role = _normalize_role(body.role)
        if role not in {ROLE_USER, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        fields["roles"] = [role]
        if body.org_id is None and role == ROLE_PLATFORM_ADMIN:
            fields["org_id"] = ""
    if body.org_id is not None:
        fields["org_id"] = body.org_id

    if not fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    if "roles" in fields and _cognito_enabled():
        client = cognito_client()
        if client:
            try:
                new_role = fields["roles"][0]
                client.admin_update_user_attributes(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=email,
                    UserAttributes=[{"Name": "custom:role", "Value": new_role}],
                )
                client.admin_add_user_to_group(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=email,
                    GroupName=_cognito_group_name(new_role),
                )
            except Exception as exc:  # pragma: no cover
                log.warning("Cognito update user role failed: %s", exc)

    if not users.update_user(email, **fields):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed")
    return _serialize_user(users.get_user(email) or {})


@router.delete("/users/{email}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_global_user(
    email: str,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> None:
    """Platform admin: permanently delete a user account."""
    if not users.get_user(email):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if _cognito_enabled():
        client = cognito_client()
        if client:
            try:
                client.admin_delete_user(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=email,
                )
            except Exception as exc:  # pragma: no cover
                log.warning("Cognito admin_delete_user failed: %s", exc)
    users.delete_user(email)
    log.info("User %s deleted by %s", email, principal.sub)


@router.get("/join-requests", response_model=list[dict])
def list_all_join_requests(
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> list[dict]:
    """Platform admin: list all pending join requests across organizations."""
    return join_requests.list_all_join_requests()


@router.get("/pending-approvals", response_model=list[dict])
def list_pending_approvals(
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> list[dict]:
    """Platform admin: list users awaiting global admin approval."""
    return [_serialize_user(u) for u in users.list_all_users() if u.get("status") == "pending_admin"]


@router.post("/users/{email}/approve", response_model=dict)
def approve_user(
    email: str,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: approve a pending solo or create_org signup."""
    user = users.get_user(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.get("status") != "pending_admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not pending approval")
    users.update_user(email, status="active")
    notifications.user_approved(email, user.get("org_id", ""))
    log.info("User %s approved by %s", email, principal.sub)
    return _serialize_user(users.get_user(email) or user)


@router.post("/users/{email}/deny", response_model=dict)
def deny_user(
    email: str,
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: deny a pending solo or create_org signup."""
    user = users.get_user(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.get("status") != "pending_admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not pending approval")
    users.update_user(email, status="denied")
    notifications.user_denied(email, user.get("org_id", ""))
    log.info("User %s denied by %s", email, principal.sub)
    return _serialize_user(users.get_user(email) or user)


@router.get("/analytics", response_model=dict)
def platform_analytics(
    principal: Principal = Depends(require_role(ROLE_PLATFORM_ADMIN)),
) -> dict:
    """Platform admin: high-level platform analytics."""
    all_users = users.list_all_users()
    all_orgs = orgs.list_orgs()
    active_users = [u for u in all_users if u.get("status") == "active"]
    suspended_users = [u for u in all_users if u.get("status") == "suspended"]
    active_orgs = [o for o in all_orgs if o.get("status") == "active"]
    return {
        "total_users": len(all_users),
        "active_users": len(active_users),
        "suspended_users": len(suspended_users),
        "pending_users": len(all_users) - len(active_users) - len(suspended_users),
        "total_organizations": len(all_orgs),
        "active_organizations": len(active_orgs),
    }
