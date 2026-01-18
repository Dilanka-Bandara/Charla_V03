from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.room import Room
from ..core.security import get_current_user
from pydantic import BaseModel

router = APIRouter()

class RoomCreate(BaseModel):
    name: str
    description: str = ""
    icon: str = "💬"
    room_type: str = "public"

class RoomResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    room_type: str
    created_by: int
    member_count: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[RoomResponse])
async def get_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rooms = db.query(Room).all()
    return [
        {
            **room.__dict__,
            "member_count": len(room.members)
        }
        for room in rooms
    ]

@router.post("/", response_model=RoomResponse)
async def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if room name exists
    if db.query(Room).filter(Room.name == room_data.name).first():
        raise HTTPException(status_code=400, detail="Room name already exists")
    
    db_room = Room(
        name=room_data.name,
        description=room_data.description,
        icon=room_data.icon,
        room_type=room_data.room_type,
        created_by=current_user.id
    )
    db_room.members.append(current_user)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    return {
        **db_room.__dict__,
        "member_count": len(db_room.members)
    }

@router.post("/{room_id}/join")
async def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if current_user not in room.members:
        room.members.append(current_user)
        db.commit()
    
    return {"message": "Joined room successfully"}

@router.post("/{room_id}/leave")
async def leave_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if current_user in room.members:
        room.members.remove(current_user)
        db.commit()
    
    return {"message": "Left room successfully"}
