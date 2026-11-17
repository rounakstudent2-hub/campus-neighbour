import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.seed import init_db_and_seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed
    init_db_and_seed()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CampusNeighbor Hyperlocal Student Help Marketplace Enterprise Backend API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Logging Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    if request.url.path.startswith("/api"):
        print(f"[API] {request.method} {request.url.path} -> {response.status_code} ({process_time * 1000:.1f}ms)")
    return response

# Mount API Routers:
# 1. Standard /api/v1 versioned prefix
app.include_router(api_router, prefix=settings.API_V1_STR)
# 2. Compatibility /api prefix
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "CampusNeighbor Hyperlocal Marketplace Backend is operational.",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
