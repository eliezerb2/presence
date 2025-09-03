from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Base

# Assuming PostgreSQL for now, as per README.md hints
DATABASE_URL = "postgresql://user:password@db:5432/presence_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_db_and_tables():
    Base.metadata.create_all(engine)
