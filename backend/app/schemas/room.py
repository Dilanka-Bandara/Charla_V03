from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    room_type: str = "public"
    icon: str = "💬"

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    created_by: int
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True

# NEW: Room invite schemas
class RoomInviteCreate(BaseModel):
    user_id: int

class RoomInviteResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    invited_by: int
    status: str
    created_at: datetime
    room_name: Optional[str] = None
    inviter_name: Optional[str] = None

    class Config:
        from_attributes = True
