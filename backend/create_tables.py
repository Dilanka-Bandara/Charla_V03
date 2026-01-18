from app.database import engine, Base
from app.models.user import User
from app.models.message import Message, Reaction
from app.models.room import Room, room_members, room_invites

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
