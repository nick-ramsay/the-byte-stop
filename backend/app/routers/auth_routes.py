import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr
from pymongo.errors import DuplicateKeyError

from app.auth import clear_auth_cookie, create_jwt, hash_password, set_auth_cookie, verify_password
from app.db import users
from app.deps import get_current_user

logger = logging.getLogger("app.auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])

RESET_TOKEN_EXPIRY = timedelta(minutes=15)


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


def _public_user(user: dict) -> dict:
    return {"id": str(user["_id"]), "email": user["email"], "name": user["name"]}


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, response: Response):
    try:
        result = users.insert_one(
            {
                "email": body.email.lower(),
                "name": body.name,
                "passwordHash": hash_password(body.password),
            }
        )
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists")

    token = create_jwt(str(result.inserted_id))
    set_auth_cookie(response, token)
    return {"id": str(result.inserted_id), "email": body.email.lower(), "name": body.name}


@router.post("/login")
def login(body: LoginRequest, response: Response):
    user = users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["passwordHash"]):
        logger.warning("login failed: invalid credentials (email=%s)", body.email.lower())
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_jwt(str(user["_id"]))
    set_auth_cookie(response, token)
    return _public_user(user)


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    user = users.find_one({"email": body.email.lower()})
    if not user:
        # Don't reveal whether the email exists.
        return {"message": "If that email exists, a reset token has been issued."}

    reset_token = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + RESET_TOKEN_EXPIRY
    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetToken": reset_token, "resetTokenExpiresAt": expires_at}},
    )

    # Demo stub: a real app would email this token. We return it directly so the
    # reset flow can be clicked through live without an email service dependency.
    return {"message": "Demo stub — no email sent, reset token returned directly", "resetToken": reset_token}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest):
    user = users.find_one({"resetToken": body.token})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    expires_at = user.get("resetTokenExpiresAt")
    if not expires_at or datetime.now(timezone.utc) > expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"passwordHash": hash_password(body.password)},
            "$unset": {"resetToken": "", "resetTokenExpiresAt": ""},
        },
    )
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return _public_user(user)
