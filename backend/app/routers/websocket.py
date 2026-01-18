from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..core.websocket_manager import manager
import json

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    db: Session = Depends(get_db)
):
    # Get user info
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "join_room":
                room_id = message_data.get("room_id")
                await manager.join_room(user_id, room_id)
                
            elif message_data.get("type") == "leave_room":
                room_id = message_data.get("room_id")
                await manager.leave_room(user_id, room_id)
                
            elif message_data.get("type") == "typing":
                room_id = message_data.get("room_id")
                is_typing = message_data.get("is_typing", False)
                await manager.broadcast_typing(room_id, user_id, user.username, is_typing)
                
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(user_id)
