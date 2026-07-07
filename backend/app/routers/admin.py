from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.user_models import User
from app.services.auth_service import RoleChecker
from app.services.user_service import (
    get_admin_dashboard_stats,
    get_all_users_list,
    get_all_patients_list,
    get_all_caregivers_list
)
from app.schemas.user_schemas import AdminDashboardResponse

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

# Create role dependency for Admin role only
admin_only = RoleChecker(allowed_roles=["admin"])


@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Retrieve statistical aggregations and latest user signups for the admin home view."""
    stats = get_admin_dashboard_stats(db)
    return stats


@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Retrieve list of all users in the system."""
    users_list = get_all_users_list(db)
    return users_list


@router.get("/patients")
def get_patients(db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Retrieve list of all patients in the system."""
    return get_all_patients_list(db)


@router.get("/caregivers")
def get_caregivers(db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    """Retrieve list of all caregivers in the system."""
    return get_all_caregivers_list(db)
