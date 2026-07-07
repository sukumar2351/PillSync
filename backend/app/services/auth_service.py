from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import Optional

from app.models.user_models import User, Role, PatientProfile, CaregiverProfile
from app.schemas.user_schemas import PatientRegister, CaregiverRegister
from app.utils.security import verify_password, get_password_hash, decode_access_token
from app.database import get_db
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def register_patient(db: Session, schema: PatientRegister) -> User:
    # Check if user exists
    existing_user = get_user_by_email(db, schema.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
        
    # Get Patient role
    patient_role = db.query(Role).filter(Role.name == "patient").first()
    if not patient_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System roles have not been initialized."
        )

    # Hash password
    hashed_pwd = get_password_hash(schema.password)

    # Create user
    new_user = User(
        email=schema.email,
        hashed_password=hashed_pwd,
        role_id=patient_role.id,
        is_active=True
    )
    db.add(new_user)
    db.flush()  # Flushes changes to database to populate new_user.id

    # Create patient profile
    new_profile = PatientProfile(
        user_id=new_user.id,
        full_name=schema.full_name,
        account_status="Active"
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)
    return new_user


def register_caregiver(db: Session, schema: CaregiverRegister) -> User:
    # Check if user exists
    existing_user = get_user_by_email(db, schema.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # Get Caregiver role
    caregiver_role = db.query(Role).filter(Role.name == "caregiver").first()
    if not caregiver_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System roles have not been initialized."
        )

    # Hash password
    hashed_pwd = get_password_hash(schema.password)

    # Create user
    new_user = User(
        email=schema.email,
        hashed_password=hashed_pwd,
        role_id=caregiver_role.id,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create caregiver profile
    new_profile = CaregiverProfile(
        user_id=new_user.id,
        full_name=schema.full_name,
        account_status="Active"
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    user = get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
        
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
