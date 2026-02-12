from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

room_members = Table(
    'room_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('room_id', Integer, ForeignKey('rooms.id'))
)

# Room invites table
room_invites = Table(
    'room_invites',
    Base.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('room_id', Integer, ForeignKey('rooms.id')),
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('invited_by', Integer, ForeignKey('users.id')),
    Column('status', String, default='pending'),
    # FIX: Use timezone-aware datetime
    Column('created_at', DateTime(timezone=True), default=get_utc_now)
)

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    room_type = Column(String, default="public")
    icon = Column(String, default="💬")
    created_by = Column(Integer, ForeignKey('users.id'))
    # FIX: Use timezone-aware datetime
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    members = relationship("User", secondary=room_members, back_populates="rooms")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])