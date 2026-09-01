"""Who may hand an organization to someone else, and to whom.

The rules this pins down:
  * only the owner (or a platform admin) can transfer — an org_admin who is not the
    owner cannot take the organization from the person who created it;
  * the new owner must already be a member, or the organization ends up owned by an
    address that cannot sign in to administer it;
  * the new owner is promoted to org_admin, and the outgoing owner keeps their access.

    python3 backend/handlers/routers/test_transfer_ownership.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

for _var in ("COGNITO_USER_POOL_ID", "COGNITO_APP_CLIENT_ID"):
    os.environ.pop(_var, None)

import handlers.routers.admin as admin  # noqa: E402
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_USER  # noqa: E402


class _Orgs:
    def __init__(self, org):
        self.org = org

    def get_org(self, org_id):
        return dict(self.org) if self.org["org_id"] == org_id else None

    def update_org(self, org_id, **fields):
        assert self.org["org_id"] == org_id
        self.org.update(fields)
        return True


class _Users:
    def __init__(self, members):
        self.members = {m["email"]: m for m in members}

    def get_user(self, email):
        found = self.members.get(email)
        return dict(found) if found else None

    def update_user(self, email, **fields):
        self.members[email].update(fields)
        return True


def _world():
    admin.orgs = _Orgs({"org_id": "org-1", "name": "RootVyana", "owner_email": "founder@x.com"})
    admin.users = _Users([
        {"email": "founder@x.com", "org_id": "org-1", "roles": [ROLE_ORG_ADMIN]},
        {"email": "second@x.com", "org_id": "org-1", "roles": [ROLE_USER]},
        {"email": "outsider@y.com", "org_id": "org-2", "roles": [ROLE_USER]},
    ])
    return admin.orgs, admin.users


def _principal(sub, roles, org_id):
    return admin.Principal(sub=sub, roles=roles, org_id=org_id)


def _transfer(principal, email):
    return admin.transfer_ownership(
        "org-1", admin.TransferOwnershipRequest(new_owner_email=email), principal=principal
    )


def test_owner_can_transfer_to_a_member():
    orgs, users = _world()
    result = _transfer(_principal("founder@x.com", [ROLE_ORG_ADMIN], "org-1"), "second@x.com")
    assert result["owner_email"] == "second@x.com"
    assert orgs.org["owner_email"] == "second@x.com"
    assert ROLE_ORG_ADMIN in users.members["second@x.com"]["roles"], "new owner must be an admin"
    assert users.members["founder@x.com"]["roles"] == [ROLE_ORG_ADMIN], "outgoing owner keeps access"


def test_an_admin_who_is_not_the_owner_cannot():
    orgs, _ = _world()
    try:
        _transfer(_principal("second@x.com", [ROLE_ORG_ADMIN], "org-1"), "second@x.com")
    except admin.HTTPException as exc:
        assert exc.status_code == 403
    else:
        raise AssertionError("only the owner may transfer the organization")
    assert orgs.org["owner_email"] == "founder@x.com"


def test_cannot_transfer_to_a_non_member():
    orgs, _ = _world()
    for email in ("outsider@y.com", "nobody@x.com"):
        try:
            _transfer(_principal("founder@x.com", [ROLE_ORG_ADMIN], "org-1"), email)
        except admin.HTTPException as exc:
            assert exc.status_code == 400 and "member" in exc.detail.lower()
        else:
            raise AssertionError(f"{email} is not a member and must be refused")
    assert orgs.org["owner_email"] == "founder@x.com"


if __name__ == "__main__":
    test_owner_can_transfer_to_a_member()
    test_an_admin_who_is_not_the_owner_cannot()
    test_cannot_transfer_to_a_non_member()
    print("ok — only the owner transfers, and only to a member of the organization")
