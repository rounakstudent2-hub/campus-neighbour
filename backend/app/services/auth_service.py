from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import user_repository
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserUpdate, Token, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    def register(self, db: Session, user_in: UserCreate) -> Token:
        existing = user_repository.get_by_email(db, user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
        
        user = User(
            email=user_in.email.strip().lower(),
            password_hash=get_password_hash(user_in.password),
            name=user_in.name.strip(),
            role=user_in.role,
            college=user_in.college.strip() if user_in.college else None,
            bio=user_in.bio.strip() if user_in.bio else None,
            avatar=user_in.avatar,
            is_verified=True if user_in.role == "student" else False,
            is_active=True
        )
        saved_user = user_repository.create(db, user)
        token = create_access_token(saved_user.id, saved_user.role)
        return Token(access_token=token, user=UserResponse.model_validate(saved_user))

    def login(self, db: Session, login_in: UserLogin) -> Token:
        user = user_repository.get_by_email(db, login_in.email)
        if not user or not verify_password(login_in.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been suspended by administration."
            )
        
        token = create_access_token(user.id, user.role)
        return Token(access_token=token, user=UserResponse.model_validate(user))

    def update_profile(self, db: Session, user: User, update_in: UserUpdate) -> UserResponse:
        data = update_in.model_dump(exclude_unset=True)
        updated = user_repository.update(db, user, data)
        return UserResponse.model_validate(updated)

auth_service = AuthService()
