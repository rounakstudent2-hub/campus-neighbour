from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.repositories.base import BaseRepository
from app.models.escrow import EscrowPayment

class EscrowRepository(BaseRepository[EscrowPayment]):
    def __init__(self):
        super().__init__(EscrowPayment)

    def get_by_task(self, db: Session, task_id: str) -> Optional[EscrowPayment]:
        return db.query(EscrowPayment).filter(EscrowPayment.task_id == task_id).first()

    def get_by_user(self, db: Session, user_id: str) -> List[EscrowPayment]:
        return (
            db.query(EscrowPayment)
            .filter((EscrowPayment.payer_id == user_id) | (EscrowPayment.payee_id == user_id))
            .order_by(EscrowPayment.created_at.desc())
            .all()
        )

    def get_total_volume(self, db: Session) -> float:
        total = db.query(func.sum(EscrowPayment.amount)).filter(EscrowPayment.status.in_(["escrow_held", "released"])).scalar()
        return float(total or 0.0)

escrow_repository = EscrowRepository()
