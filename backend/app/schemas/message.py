from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class MessageCreate(BaseModel):
    content: str
    room_id: int
    message_type: str = "text"
    file_url: Optional[str] = None
    reply_to: Optional[int] = None

class ReactionCreate(BaseModel):
    emoji: str
    message_id: int

class ReactionResponse(BaseModel):
    id: int
    emoji: str
    user_id: int
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    content: str
    message_type: str
    file_url: Optional[str]
    user_id: int
    username: str
    avatar_url: str
    avatar_color: str
    room_id: int
    reply_to: Optional[int]
    is_edited: bool
    is_read: bool
    timestamp: datetime
    reactions: List[ReactionResponse] = []
    
    class Config:
        from_attributes = True
