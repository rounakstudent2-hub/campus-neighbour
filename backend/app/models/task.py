import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    creator_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open", index=True)  # open, assigned, in_progress, completed, cancelled
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    completion_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Geospatial index
    __table_args__ = (
        Index("idx_tasks_lat_lon", "lat", "lon"),
    )

    # Relationships
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    assigned_student = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")
    applications = relationship("Application", back_populates="task", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="task", cascade="all, delete-orphan")
    escrow_payments = relationship("EscrowPayment", back_populates="task", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="task", cascade="all, delete-orphan")
