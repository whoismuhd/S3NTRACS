"""
Utility script to create an initial superadmin user.
Usage: python -m app.utils.create_admin
"""
import sys
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

if __name__ == "__main__":
    db = SessionLocal()
    
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    
    # Check if user exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"User {email} already exists!")
        sys.exit(1)
    
    # Create user
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        role="superadmin",
    )
    db.add(user)
    db.commit()
    
    print(f"Superadmin user {email} created successfully!")
    db.close()

