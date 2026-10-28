"""Minimal, dependency-free session auth for the government admin portal.

Credentials are configured through environment variables so they can be changed
without editing code. Tokens are HMAC-signed and stateless, so they survive a
server restart but still expire.
"""

import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import Header, HTTPException

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "Dhiru")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Dhiru@9090")
SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "denguecare-admin-session-secret")
TOKEN_TTL_SECONDS = int(os.getenv("AUTH_TOKEN_TTL_SECONDS", str(8 * 60 * 60)))


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(payload: bytes) -> bytes:
    return hmac.new(SECRET_KEY.encode(), payload, hashlib.sha256).digest()


def verify_credentials(username: str, password: str) -> bool:
    return hmac.compare_digest(username or "", ADMIN_USERNAME) and hmac.compare_digest(
        password or "", ADMIN_PASSWORD
    )


def create_token(username: str) -> str:
    payload = json.dumps(
        {"sub": username, "exp": int(time.time()) + TOKEN_TTL_SECONDS},
        separators=(",", ":"),
    ).encode()
    return f"{_b64encode(payload)}.{_b64encode(_sign(payload))}"


def verify_token(token: str) -> str | None:
    try:
        payload_part, signature_part = token.split(".")
        payload = _b64decode(payload_part)
        if not hmac.compare_digest(_sign(payload), _b64decode(signature_part)):
            return None
        data = json.loads(payload)
        if int(data.get("exp", 0)) < time.time():
            return None
        return data.get("sub")
    except Exception:
        return None


async def require_admin(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency that rejects unauthenticated admin requests."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    username = verify_token(authorization[7:].strip())
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return username
