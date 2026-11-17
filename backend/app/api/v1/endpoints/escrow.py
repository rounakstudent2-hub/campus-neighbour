from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user, require_roles
from app.services.escrow_service import escrow_service
from app.schemas.escrow import EscrowOrderCreate, EscrowVerifyRequest, EscrowReleaseRequest, EscrowResponse
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["Escrow & Payments"])

@router.post("/create-order")
def create_escrow_order(
    order_in: EscrowOrderCreate,
    current_user: User = Depends(require_roles(["neighbor", "admin"])),
    db: Session = Depends(get_db)
):
    return escrow_service.create_order(db, current_user, order_in.task_id, order_in.application_id)

@router.post("/verify", response_model=EscrowResponse)
def verify_payment(
    verify_in: EscrowVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return escrow_service.verify_payment(
        db, current_user, verify_in.task_id, verify_in.razorpay_order_id, verify_in.razorpay_payment_id
    )

@router.post("/release", response_model=EscrowResponse)
def release_escrow(
    release_in: EscrowReleaseRequest,
    current_user: User = Depends(require_roles(["neighbor", "admin"])),
    db: Session = Depends(get_db)
):
    return escrow_service.release_escrow(db, current_user, release_in.task_id)

@router.get("/ledger", response_model=List[EscrowResponse])
def get_user_ledger(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return escrow_service.get_user_ledger(db, current_user.id)
