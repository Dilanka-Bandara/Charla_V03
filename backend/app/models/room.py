from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

# Association table for room members
room_members = Table(
    'room_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('room_id', Integer, ForeignKey('rooms.id', ondelete='CASCADE'))
)

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    room_type = Column(String(20), default="public")  # public, private, direct
    icon = Column(String(10), default="💬")
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=func.now())
    
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")
    members = relationship("User", secondary=room_members, backref="rooms")
