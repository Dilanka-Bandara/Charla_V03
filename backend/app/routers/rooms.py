from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.room import Room, room_members, room_invites
from ..models.user import User
from ..schemas.room import RoomCreate, RoomResponse, RoomInviteCreate, RoomInviteResponse
from ..core.security import get_current_user

router = APIRouter()

@router.post("/rooms", response_model=RoomResponse)
def create_room(
    room: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_room = Room(
        name=room.name,
        description=room.description,
        room_type=room.room_type,
        icon=room.icon,
        created_by=current_user.id
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    # Add creator as first member
    db_room.members.append(current_user)
    db.commit()
    
    return {
        "id": db_room.id,
        "name": db_room.name,
        "description": db_room.description,
        "room_type": db_room.room_type,
        "icon": db_room.icon,
        "created_by": db_room.created_by,
        "created_at": db_room.created_at,
        "member_count": len(db_room.members)
    }

@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all public rooms and private rooms user is a member of
    public_rooms = db.query(Room).filter(Room.room_type == "public").all()
    
    # Get user's private rooms
    user = db.query(User).filter(User.id == current_user.id).first()
    private_rooms = [room for room in user.rooms if room.room_type == "private"]
    
    all_rooms = public_rooms + private_rooms
    
    result = []
    for room in all_rooms:
        result.append({
            "id": room.id,
            "name": room.name,
            "description": room.description,
            "room_type": room.room_type,
            "icon": room.icon,
            "created_by": room.created_by,
            "created_at": room.created_at,
            "member_count": len(room.members)
        })
    
    return result

@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {
        "id": room.id,
        "name": room.name,
        "description": room.description,
        "room_type": room.room_type,
        "icon": room.icon,
        "created_by": room.created_by,
        "created_at": room.created_at,
        "member_count": len(room.members)
    }

@router.post("/rooms/{room_id}/join")
def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if room is private
    if room.room_type == "private":
        raise HTTPException(status_code=403, detail="Cannot join private room without invite")
    
    # Check if already a member
    if current_user in room.members:
        return {"message": "Already a member"}
    
    room.members.append(current_user)
    db.commit()
    
    return {"message": f"Joined {room.name}"}

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
    
    # Check if user exists
    invited_user = db.query(User).filter(User.id == invite.user_id).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already a member
    if invited_user in room.members:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Check if invite already exists
    existing_invite = db.execute(
        select(room_invites).where(
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
        select(room_invites).where(
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
        select(room_invites).where(room_invites.c.id == invite_id)
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
        select(room_invites).where(room_invites.c.id == invite_id)
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
