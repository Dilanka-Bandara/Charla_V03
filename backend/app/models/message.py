from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum

class MessageType(str, enum.Enum):
    text = "text"
    image = "image"
    file = "file"
    system = "system"

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default=MessageType.text)
    file_url = Column(String(255))
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    room_id = Column(Integer, ForeignKey('rooms.id', ondelete='CASCADE'))
    reply_to = Column(Integer, ForeignKey('messages.id'))
    is_edited = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=func.now(), index=True)
    
    author = relationship("User", back_populates="messages")
    room = relationship("Room", back_populates="messages")
    reactions = relationship("Reaction", back_populates="message", cascade="all, delete-orphan")

class Reaction(Base):
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    emoji = Column(String(10), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    message_id = Column(Integer, ForeignKey('messages.id', ondelete='CASCADE'))
    created_at = Column(DateTime, default=func.now())
    
    user = relationship("User", back_populates="reactions")
    message = relationship("Message", back_populates="reactions")
