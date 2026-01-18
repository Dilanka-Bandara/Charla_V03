from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..core.websocket_manager import manager
from datetime import datetime

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return
    
    await manager.connect(websocket, user_id, user.username)
    
    # Update user online status
    user.is_online = True
    db.commit()
    
    # Notify all users about online status
    await manager.broadcast_to_all({
        "type": "user_status",
        "user_id": user_id,
        "username": user.username,
        "is_online": True
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "join_room":
                room_id = data.get("room_id")
                manager.join_room(user_id, room_id)
                await manager.broadcast_to_room({
                    "type": "user_joined",
                    "user_id": user_id,
                    "username": user.username,
                    "room_id": room_id,
                    "timestamp": datetime.now().isoformat()
                }, room_id)
            
            elif message_type == "leave_room":
                room_id = data.get("room_id")
                manager.leave_room(user_id, room_id)
                await manager.broadcast_to_room({
                    "type": "user_left",
                    "user_id": user_id,
                    "username": user.username,
                    "room_id": room_id,
                    "timestamp": datetime.now().isoformat()
                }, room_id)
            
            elif message_type == "new_message":
                room_id = data.get("room_id")
                await manager.broadcast_to_room({
                    "type": "new_message",
                    "message": data.get("message"),
                    "room_id": room_id
                }, room_id)
            
            elif message_type == "typing":
                room_id = data.get("room_id")
                is_typing = data.get("is_typing", False)
                await manager.handle_typing(room_id, user.username, is_typing)
            
            elif message_type == "message_reaction":
                room_id = data.get("room_id")
                await manager.broadcast_to_room({
                    "type": "message_reaction",
                    "message_id": data.get("message_id"),
                    "reaction": data.get("reaction"),
                    "user_id": user_id,
                    "username": user.username
                }, room_id)
            
            elif message_type == "read_receipt":
                room_id = data.get("room_id")
                await manager.broadcast_to_room({
                    "type": "read_receipt",
                    "message_id": data.get("message_id"),
                    "user_id": user_id,
                    "username": user.username
                }, room_id)
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        
        # Update user online status
        user.is_online = False
        user.last_seen = datetime.now()
        db.commit()
        
        # Notify all users about offline status
        await manager.broadcast_to_all({
            "type": "user_status",
            "user_id": user_id,
            "username": user.username,
            "is_online": False,
            "last_seen": user.last_seen.isoformat()
        })
