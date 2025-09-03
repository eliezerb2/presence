from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import students, attendance, kiosk, management

app = FastAPI(title="School Attendance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(kiosk.router, prefix="/api/kiosk", tags=["kiosk"])
app.include_router(management.router, prefix="/api/management", tags=["management"])

@app.get("/")
async def root():
    return {"message": "School Attendance System API"}