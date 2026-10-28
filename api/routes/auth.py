from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.auth import create_token, verify_credentials

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(payload: LoginRequest):
    if not verify_credentials(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"token": create_token(payload.username), "username": payload.username}
