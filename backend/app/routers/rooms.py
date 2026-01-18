from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.room import Room
from ..core.security import get_current_user
from ..models.room import room_invites
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

# Add these new endpoints

@router.post("/rooms/{room_id}/invite", response_model=dict)
def invite_to_room(
    room_id: int,
    invite: RoomInviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Invite a user to a private room (only creator can invite)"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if current user is the creator
    if room.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only room creator can invite users")
    
    # Check if room is private
    if room.room_type != "private":
        raise HTTPException(status_code=400, detail="Can only invite to private rooms")
    
    # Check if user is already a member
    invited_user = db.query(User).filter(User.id == invite.user_id).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if invited_user in room.members:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Check if invite already exists
    existing_invite = db.execute(
        room_invites.select().where(
            (room_invites.c.room_id == room_id) &
            (room_invites.c.user_id == invite.user_id) &
            (room_invites.c.status == 'pending')
        )
    ).first()
    
    if existing_invite:
        raise HTTPException(status_code=400, detail="Invite already sent")
    
    # Create invite
    db.execute(
        room_invites.insert().values(
            room_id=room_id,
            user_id=invite.user_id,
            invited_by=current_user.id,
            status='pending'
        )
    )
    db.commit()
    
    return {"message": f"Invited {invited_user.username} to {room.name}"}

@router.get("/rooms/invites", response_model=List[RoomInviteResponse])
def get_my_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all pending invites for current user"""
    invites = db.execute(
        room_invites.select().where(
            (room_invites.c.user_id == current_user.id) &
            (room_invites.c.status == 'pending')
        )
    ).fetchall()
    
    result = []
    for invite in invites:
        room = db.query(Room).filter(Room.id == invite.room_id).first()
        inviter = db.query(User).filter(User.id == invite.invited_by).first()
        result.append({
            "id": invite.id,
            "room_id": invite.room_id,
            "user_id": invite.user_id,
            "invited_by": invite.invited_by,
            "status": invite.status,
            "created_at": invite.created_at,
            "room_name": room.name if room else None,
            "inviter_name": inviter.username if inviter else None
        })
    
    return result

@router.post("/rooms/invites/{invite_id}/accept")
def accept_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a room invite"""
    invite = db.execute(
        room_invites.select().where(room_invites.c.id == invite_id)
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your invite")
    
    if invite.status != 'pending':
        raise HTTPException(status_code=400, detail="Invite already processed")
    
    # Add user to room
    room = db.query(Room).filter(Room.id == invite.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room.members.append(current_user)
    
    # Update invite status
    db.execute(
        room_invites.update().where(
            room_invites.c.id == invite_id
        ).values(status='accepted')
    )
    
    db.commit()
    
    return {"message": f"Joined {room.name}"}

@router.post("/rooms/invites/{invite_id}/decline")
def decline_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Decline a room invite"""
    invite = db.execute(
        room_invites.select().where(room_invites.c.id == invite_id)
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your invite")
    
    db.execute(
        room_invites.update().where(
            room_invites.c.id == invite_id
        ).values(status='declined')
    )
    db.commit()
    
    return {"message": "Invite declined"}