from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..core.websocket_manager import manager
from ..core.security import settings
from jose import jwt, JWTError
import json

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    # 1. Validate Token explicitly before accepting connection
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Get User from DB
    user = db.query(User).filter(User.username == username).first()
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # 3. Accept connection and pass username for typing indicator logic
    await manager.connect(websocket, user.id, user.username)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "join_room":
                room_id = message_data.get("room_id")
                await manager.join_room(user.id, room_id)
                
            elif message_data.get("type") == "leave_room":
                room_id = message_data.get("room_id")
                await manager.leave_room(user.id, room_id)
                
            elif message_data.get("type") == "typing":
                room_id = message_data.get("room_id")
                is_typing = message_data.get("is_typing", False)
                # Pass the username we retrieved earlier
                await manager.broadcast_typing(room_id, user.id, user.username, is_typing)
                
    except WebSocketDisconnect:
        await manager.disconnect(user.id)
    except Exception as e:
        print(f"WebSocket error for user {user.id}: {e}")
        await manager.disconnect(user.id)