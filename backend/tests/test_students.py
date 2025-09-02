from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app import crud, schemas

def test_create_student(client: TestClient, db_session: Session):
    student_data = {
        "student_number": "12345",
        "nickname": "TestNick",
        "first_name": "Test",
        "last_name": "Student",
        "phone_number": "123-456-7890",
        "school_level": "יסודי",
        "activity_status": "פעיל"
    }
    response = client.post("/students/", json=student_data)
    assert response.status_code == 200
    data = response.json()
    assert data["student_number"] == student_data["student_number"]
    assert "id" in data

def test_read_students(client: TestClient, db_session: Session):
    response = client.get("/students/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_student(client: TestClient, db_session: Session):
    student_data = {
        "student_number": "67890",
        "nickname": "AnotherNick",
        "first_name": "Another",
        "last_name": "Student",
        "phone_number": "098-765-4321",
        "school_level": "תיכון",
        "activity_status": "פעיל"
    }
    created_student = crud.create_student(db_session, schemas.StudentCreate(**student_data))

    response = client.get(f"/students/{created_student.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["student_number"] == student_data["student_number"]

def test_update_student(client: TestClient, db_session: Session):
    student_data = {
        "student_number": "11223",
        "nickname": "UpdateNick",
        "first_name": "Update",
        "last_name": "Student",
        "phone_number": "111-222-3333",
        "school_level": "יסודי",
        "activity_status": "פעיל"
    }
    created_student = crud.create_student(db_session, schemas.StudentCreate(**student_data))

    update_data = {"nickname": "UpdatedNickname"}
    response = client.put(f"/students/{created_student.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nickname"] == "UpdatedNickname"

def test_delete_student(client: TestClient, db_session: Session):
    student_data = {
        "student_number": "44556",
        "nickname": "DeleteNick",
        "first_name": "Delete",
        "last_name": "Student",
        "phone_number": "444-555-6666",
        "school_level": "תיכון",
        "activity_status": "לא פעיל"
    }
    created_student = crud.create_student(db_session, schemas.StudentCreate(**student_data))

    response = client.delete(f"/students/{created_student.id}")
    assert response.status_code == 200
    assert response.json() == {"message": "Student deleted successfully"}

    # Verify deletion
    response = client.get(f"/students/{created_student.id}")
    assert response.status_code == 404
