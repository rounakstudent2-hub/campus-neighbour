from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user
from app.repositories.message_repository import message_repository
from app.repositories.task_repository import task_repository
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageResponse
from app.models.user import User

router = APIRouter(prefix="/messages", tags=["Messages & Chat"])

@router.get("/{task_id}", response_model=List[MessageResponse])
def get_task_messages(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    
    if current_user.id != task.creator_id and current_user.id != task.assigned_to and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to conversation.")

    return message_repository.get_by_task(db, task_id)

@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = task_repository.get(db, msg_in.task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    message = Message(
        task_id=msg_in.task_id,
        sender_id=current_user.id,
        recipient_id=msg_in.recipient_id,
        text=msg_in.text.strip()
    )
    return message_repository.create(db, message)
