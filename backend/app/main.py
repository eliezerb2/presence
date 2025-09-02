from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn

from .database import engine, Base
from .api import kiosk, manager, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting School Attendance Application...")
    try:
        # Create database tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")
    yield
    # Shutdown
    print("Shutting down School Attendance Application...")

# Create FastAPI app
app = FastAPI(
    title="School Attendance System",
    description="A comprehensive school attendance management system",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(kiosk.router, prefix="/api/v1")
app.include_router(manager.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "School Attendance System API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "school-attendance"}

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
