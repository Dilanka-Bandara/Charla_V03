from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.room import Room
from app.core.security import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if test user exists
    test_user = db.query(User).filter(User.username == "testuser").first()
    if not test_user:
        test_user = User(
            username="testuser",
            email="test@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="Test User",
            avatar_color="#6366f1"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✓ Created test user: {test_user.username}")
    else:
        print(f"✓ Test user already exists: {test_user.username}")
    
    # Try to create a test room
    test_room = Room(
        name="Test Room",
        description="Testing room creation",
        room_type="public",
        icon="🧪",
        created_by=test_user.id
    )
    db.add(test_room)
    db.commit()
    db.refresh(test_room)
    
    # Add user to room
    test_room.members.append(test_user)
    db.commit()
    
    print(f"✓ Created test room: {test_room.name} (ID: {test_room.id})")
    print(f"✓ Members: {len(test_room.members)}")
    
    # List all rooms
    print("\nAll rooms in database:")
    rooms = db.query(Room).all()
    for room in rooms:
        print(f"  - {room.name} ({room.room_type}) - {len(room.members)} members")
    
    print("\n✅ Database is working correctly!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
