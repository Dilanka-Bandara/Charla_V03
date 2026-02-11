from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(255), default="default-avatar.png")
    avatar_color = Column(String(7), default="#6366f1")
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, default=func.now())
    
    # FIX 1: Changed back_populates="author" to "user" to match the Message model
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    
    reactions = relationship("Reaction", back_populates="user", cascade="all, delete-orphan")
    
    # FIX 2: Added missing 'rooms' relationship (required by Room.members)
    # We use the string "room_members" to refer to the association table defined in room.py
    rooms = relationship("Room", secondary="room_members", back_populates="members")