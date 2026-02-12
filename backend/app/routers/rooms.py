from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.room import Room, room_members, room_invites
from ..models.user import User
from ..models.message import Message 
from ..schemas.room import RoomCreate, RoomResponse, RoomInviteCreate, RoomInviteResponse
from ..schemas.message import MessageResponse
from ..core.security import get_current_user

# Mounted at /api/rooms in main.py
router = APIRouter()

# --- ROOM MANAGEMENT ENDPOINTS ---

@router.get("/", response_model=List[RoomResponse])
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch public rooms OR private rooms the user belongs to
    rooms = db.query(Room).filter(
        or_(
            Room.room_type == "public",
            Room.members.any(id=current_user.id)
        )
    ).distinct().all()
    
    result = []
    for room in rooms:
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

@router.post("/", response_model=RoomResponse)
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

# --- INVITE ENDPOINTS (Must come before /{room_id}) ---

@router.get("/invites", response_model=List[RoomInviteResponse])
def get_my_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

@router.post("/invites/{invite_id}/accept")
def accept_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.execute(
        select(room_invites).where(room_invites.c.id == invite_id)
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your invite")
    if invite.status != 'pending':
        raise HTTPException(status_code=400, detail="Invite already processed")
    
    room = db.query(Room).filter(Room.id == invite.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room.members.append(current_user)
    
    db.execute(
        room_invites.update().where(room_invites.c.id == invite_id).values(status='accepted')
    )
    db.commit()
    return {"message": f"Joined {room.name}"}

@router.post("/invites/{invite_id}/decline")
def decline_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.execute(
        select(room_invites).where(room_invites.c.id == invite_id)
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your invite")
    
    db.execute(
        room_invites.update().where(room_invites.c.id == invite_id).values(status='declined')
    )
    db.commit()
    return {"message": "Invite declined"}

# --- SPECIFIC ROOM ENDPOINTS ---

@router.get("/{room_id}", response_model=RoomResponse)
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

# MOVED FROM MESSAGES.PY: Get messages for a specific room
@router.get("/{room_id}/messages", response_model=List[MessageResponse])
def get_room_messages(
    room_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        Message.room_id == room_id
    ).order_by(Message.timestamp.desc()).offset(skip).limit(limit).all()
    
    result = []
    for msg in reversed(messages):
        user = db.query(User).filter(User.id == msg.user_id).first()
        result.append({
            "id": msg.id,
            "content": msg.content,
            "user_id": msg.user_id,
            "room_id": msg.room_id,
            "message_type": msg.message_type,
            "timestamp": msg.timestamp,
            "username": user.username if user else "Unknown",
            "avatar_color": user.avatar_color if user else "#6366f1",
            
            # --- CRITICAL FIX START ---
            # [cite_start]These fields are required by MessageResponse schema [cite: 131]
            "avatar_url": user.avatar_url if user else "default-avatar.png",
            "reply_to": None,
            "is_edited": False,
            "is_read": False,
            # --- CRITICAL FIX END ---
            
            "file_url": msg.file_url if hasattr(msg, 'file_url') else None,
            "file_name": msg.file_name if hasattr(msg, 'file_name') else None,
            "reactions": [
                {
                    "id": r.id,
                    "emoji": r.emoji,
                    "user_id": r.user_id,
                    "username": r.user.username if r.user else "Unknown", # Added safety
                    "created_at": r.created_at, # Added created_at
                    "message_id": r.message_id
                } for r in msg.reactions
            ]
        })
    return result

@router.post("/{room_id}/join")
def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.room_type == "private":
        raise HTTPException(status_code=403, detail="Cannot join private room without invite")
    
    if current_user in room.members:
        return {"message": "Already a member"}
    
    room.members.append(current_user)
    db.commit()
    return {"message": f"Joined {room.name}"}

@router.post("/{room_id}/invite", response_model=dict)
def invite_to_room(
    room_id: int,
    invite: RoomInviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only room creator can invite users")
    
    if room.room_type != "private":
        raise HTTPException(status_code=400, detail="Can only invite to private rooms")
    
    invited_user = db.query(User).filter(User.id == invite.user_id).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if invited_user in room.members:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    existing_invite = db.execute(
        select(room_invites).where(
            (room_invites.c.room_id == room_id) &
            (room_invites.c.user_id == invite.user_id) &
            (room_invites.c.status == 'pending')
        )
    ).first()
    
    if existing_invite:
        raise HTTPException(status_code=400, detail="Invite already sent")
    
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