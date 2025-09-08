from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import students, attendance, permanent_absences, school_holidays, settings, claims, kiosk, manager
from .models.base import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="School Presence System", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(permanent_absences.router, prefix="/api/permanent-absences", tags=["permanent-absences"])
app.include_router(school_holidays.router, prefix="/api/school-holidays", tags=["school-holidays"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(claims.router, prefix="/api/claims", tags=["claims"])
app.include_router(kiosk.router, prefix="/api/kiosk", tags=["kiosk"])
app.include_router(manager.router, prefix="/api/manager", tags=["manager"])

@app.get("/")
async def root():
    return {"message": "School Presence System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}