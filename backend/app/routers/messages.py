from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.message import Message, Reaction
from ..schemas.message import MessageCreate, MessageResponse, ReactionCreate, ReactionResponse
from ..core.security import get_current_user

router = APIRouter()

@router.get("/room/{room_id}", response_model=List[MessageResponse])
async def get_room_messages(
    room_id: int,
    limit: int = Query(50, le=100),
    offset: int = 0,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Message).filter(Message.room_id == room_id)
    
    if search:
        query = query.filter(Message.content.contains(search))
    
    messages = query.order_by(Message.timestamp.desc()).offset(offset).limit(limit).all()
    
    result = []
    for msg in reversed(messages):
        result.append({
            "id": msg.id,
            "content": msg.content,
            "message_type": msg.message_type,
            "file_url": msg.file_url,
            "user_id": msg.user_id,
            "username": msg.author.username,
            "avatar_url": msg.author.avatar_url,
            "avatar_color": msg.author.avatar_color,
            "room_id": msg.room_id,
            "reply_to": msg.reply_to,
            "is_edited": msg.is_edited,
            "is_read": msg.is_read,
            "timestamp": msg.timestamp,
            "reactions": [
                {
                    "id": r.id,
                    "emoji": r.emoji,
                    "user_id": r.user_id,
                    "username": r.user.username,
                    "created_at": r.created_at
                }
                for r in msg.reactions
            ]
        })
    
    return result

@router.post("/", response_model=MessageResponse)
async def create_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_message = Message(
        content=message_data.content,
        message_type=message_data.message_type,
        file_url=message_data.file_url,
        user_id=current_user.id,
        room_id=message_data.room_id,
        reply_to=message_data.reply_to
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return {
        "id": db_message.id,
        "content": db_message.content,
        "message_type": db_message.message_type,
        "file_url": db_message.file_url,
        "user_id": db_message.user_id,
        "username": current_user.username,
        "avatar_url": current_user.avatar_url,
        "avatar_color": current_user.avatar_color,
        "room_id": db_message.room_id,
        "reply_to": db_message.reply_to,
        "is_edited": db_message.is_edited,
        "is_read": db_message.is_read,
        "timestamp": db_message.timestamp,
        "reactions": []
    }

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
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
    
    db.delete(message)
    db.commit()
    return {"message": "Message deleted successfully"}

@router.post("/reactions", response_model=ReactionResponse)
async def add_reaction(
    reaction_data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if reaction already exists
    existing = db.query(Reaction).filter(
        and_(
            Reaction.message_id == reaction_data.message_id,
            Reaction.user_id == current_user.id,
            Reaction.emoji == reaction_data.emoji
        )
    ).first()
    
    if existing:
        # Remove reaction if it exists
        db.delete(existing)
        db.commit()
        return None
    
    db_reaction = Reaction(
        emoji=reaction_data.emoji,
        user_id=current_user.id,
        message_id=reaction_data.message_id
    )
    db.add(db_reaction)
    db.commit()
    db.refresh(db_reaction)
    
    return {
        "id": db_reaction.id,
        "emoji": db_reaction.emoji,
        "user_id": db_reaction.user_id,
        "username": current_user.username,
        "created_at": db_reaction.created_at
    }
