from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.message import Message, Reaction
from ..models.user import User
from ..schemas.message import MessageCreate, MessageResponse, ReactionCreate, ReactionResponse
from ..core.security import get_current_user
from ..core.websocket_manager import manager
from datetime import datetime
import os
import uuid
from pathlib import Path

# Mounted at /api/messages in main.py
router = APIRouter()

@router.post("/", response_model=MessageResponse)
async def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_message = Message(
        content=message.content,
        user_id=current_user.id,
        room_id=message.room_id,
        message_type=message.message_type or "text"
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # FIX: Construct response with ALL fields required by MessageResponse schema
    message_data = {
        "id": db_message.id,
        "content": db_message.content,
        "user_id": db_message.user_id,
        "room_id": db_message.room_id,
        "message_type": db_message.message_type,
        "timestamp": db_message.timestamp,
        "username": current_user.username,
        "avatar_color": current_user.avatar_color,
        # CRITICAL FIXES BELOW:
        "avatar_url": current_user.avatar_url,  # Required by schema
        "file_url": None,                       # Required by schema
        "reply_to": None,                       # Required by schema (column dropped from DB)
        "is_edited": False,                     # Required by schema (column dropped from DB)
        "is_read": False,                       # Required by schema (column dropped from DB)
        "reactions": []
    }
    
    await manager.broadcast_new_message(message.room_id, message_data)
    return message_data

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    room_id = message.room_id
    db.delete(message)
    db.commit()
    
    await manager.broadcast_to_room(room_id, {
        "type": "message_deleted",
        "room_id": room_id,
        "message_id": message_id
    })
    return {"message": "Message deleted"}

@router.post("/{message_id}/reactions", response_model=ReactionResponse)
async def add_reaction(
    message_id: int,
    reaction: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    existing = db.query(Reaction).filter(
        Reaction.message_id == message_id,
        Reaction.user_id == current_user.id,
        Reaction.emoji == reaction.emoji
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        reaction_data = None
    else:
        db_reaction = Reaction(
            message_id=message_id,
            user_id=current_user.id,
            emoji=reaction.emoji
        )
        db.add(db_reaction)
        db.commit()
        db.refresh(db_reaction)
        reaction_data = {
            "id": db_reaction.id,
            "emoji": db_reaction.emoji,
            "user_id": db_reaction.user_id,
            "username": current_user.username, # Added username for ReactionResponse
            "created_at": db_reaction.created_at, # Added created_at
            "message_id": db_reaction.message_id
        }
    
    await manager.broadcast_to_room(message.room_id, {
        "type": "message_reaction",
        "room_id": message.room_id,
        "message_id": message_id,
        "reaction": reaction_data
    })
    
    # If reaction was removed, return a dummy response or handle 204. 
    # For now returning the created data or empty if deleted (API design choice)
    if not reaction_data:
         return {
             "id": 0, 
             "emoji": reaction.emoji, 
             "user_id": current_user.id, 
             "username": current_user.username,
             "created_at": datetime.now(),
             "message_id": message_id
         }
         
    return reaction_data

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    room_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / unique_filename
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    file_url = f"/uploads/{unique_filename}"
    message_content = f"📎 {file.filename}"
    
    db_message = Message(
        content=message_content,
        user_id=current_user.id,
        room_id=room_id,
        message_type="file",
        file_url=file_url,
        file_name=file.filename
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # FIX: Add missing fields for file upload response
    message_data = {
        "id": db_message.id,
        "content": db_message.content,
        "user_id": db_message.user_id,
        "room_id": db_message.room_id,
        "message_type": "file",
        "file_url": file_url,
        "file_name": file.filename, # Note: This will be stripped if not in Schema, but good to keep
        "timestamp": db_message.timestamp,
        "username": current_user.username,
        "avatar_color": current_user.avatar_color,
        "avatar_url": current_user.avatar_url,  # Required
        "reply_to": None,                       # Required
        "is_edited": False,                     # Required
        "is_read": False,                       # Required
        "reactions": []
    }
    
    await manager.broadcast_new_message(room_id, message_data)
    return message_data