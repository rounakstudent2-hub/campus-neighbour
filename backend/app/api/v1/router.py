from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    tasks,
    applications,
    escrow,
    messages,
    reviews,
    admin,
    ai_proxy,
    health
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(tasks.router)
api_router.include_router(applications.router)
api_router.include_router(escrow.router)
api_router.include_router(messages.router)
api_router.include_router(reviews.router)
api_router.include_router(admin.router)
api_router.include_router(ai_proxy.router)
