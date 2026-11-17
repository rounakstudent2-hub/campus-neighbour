from datetime import datetime, timezone
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.escrow_repository import escrow_repository
from app.repositories.task_repository import task_repository
from app.repositories.application_repository import application_repository
from app.models.escrow import EscrowPayment
from app.models.user import User

class EscrowService:
    def create_order(self, db: Session, payer: User, task_id: str, application_id: str) -> dict:
        task = task_repository.get(db, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        
        application = application_repository.get(db, application_id)
        if not application:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

        # Simulate or initialize Razorpay order ID
        razorpay_order_id = f"order_{uuid.uuid4().hex[:14]}"
        
        escrow = EscrowPayment(
            task_id=task.id,
            payer_id=payer.id,
            payee_id=application.student_id,
            amount=application.proposed_fee,
            status="pending",
            razorpay_order_id=razorpay_order_id
        )
        saved = escrow_repository.create(db, escrow)
        return {
            "order_id": razorpay_order_id,
            "escrow_id": saved.id,
            "amount": saved.amount,
            "currency": "INR",
            "task_id": task.id
        }

    def verify_payment(self, db: Session, payer: User, task_id: str, razorpay_order_id: str, payment_id: str) -> EscrowPayment:
        escrow = escrow_repository.get_by_task(db, task_id)
        if not escrow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow record not found.")

        updated = escrow_repository.update(db, escrow, {
            "status": "escrow_held",
            "razorpay_payment_id": payment_id
        })
        return updated

    def release_escrow(self, db: Session, user: User, task_id: str) -> EscrowPayment:
        task = task_repository.get(db, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        
        if task.creator_id != user.id and user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only task creator or administrator can release escrow.")

        escrow = escrow_repository.get_by_task(db, task_id)
        if not escrow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow record not found.")
        
        if escrow.status != "escrow_held":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Escrow cannot be released from status: {escrow.status}")

        updated = escrow_repository.update(db, escrow, {
            "status": "released",
            "released_at": datetime.now(timezone.utc)
        })
        return updated

    def get_user_ledger(self, db: Session, user_id: str) -> List[EscrowPayment]:
        return escrow_repository.get_by_user(db, user_id)

escrow_service = EscrowService()
