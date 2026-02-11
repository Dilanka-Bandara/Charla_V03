from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone # Import timezone
from ..database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    message_type = Column(String, default="text")
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    # Changed default to timezone-aware function
    timestamp = Column(DateTime(timezone=True), default=get_utc_now, index=True)
    
    user = relationship("User", back_populates="messages")
    room = relationship("Room", back_populates="messages")
    reactions = relationship("Reaction", back_populates="message", cascade="all, delete-orphan")

class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True)
    emoji = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    message_id = Column(Integer, ForeignKey("messages.id"))
    # Changed default to timezone-aware function
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    user = relationship("User")
    message = relationship("Message", back_populates="reactions")