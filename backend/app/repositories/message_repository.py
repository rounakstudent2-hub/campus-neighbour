from typing import List
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.models.message import Message

class MessageRepository(BaseRepository[Message]):
    def __init__(self):
        super().__init__(Message)

    def get_by_task(self, db: Session, task_id: str) -> List[Message]:
        return (
            db.query(Message)
            .options(joinedload(Message.sender), joinedload(Message.recipient))
            .filter(Message.task_id == task_id)
            .order_by(Message.created_at.asc())
            .all()
        )

message_repository = MessageRepository()
