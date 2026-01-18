from typing import Dict, List, Set
from fastapi import WebSocket
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}  # user_id: websocket
        self.room_connections: Dict[int, Set[int]] = {}  # room_id: set of user_ids
        self.typing_users: Dict[int, Set[str]] = {}  # room_id: set of usernames
    
    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ User {username} (ID:{user_id}) connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            # Remove from all rooms
            for room_id in self.room_connections:
                self.room_connections[room_id].discard(user_id)
            print(f"❌ User ID:{user_id} disconnected. Total: {len(self.active_connections)}")
    
    def join_room(self, user_id: int, room_id: int):
        if room_id not in self.room_connections:
            self.room_connections[room_id] = set()
        self.room_connections[room_id].add(user_id)
    
    def leave_room(self, user_id: int, room_id: int):
        if room_id in self.room_connections:
            self.room_connections[room_id].discard(user_id)
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
    
    async def broadcast_to_room(self, message: dict, room_id: int):
        if room_id in self.room_connections:
            for user_id in self.room_connections[room_id]:
                await self.send_personal_message(message, user_id)
    
    async def broadcast_to_all(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)
    
    def get_online_users(self) -> List[int]:
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.active_connections
    
    async def handle_typing(self, room_id: int, username: str, is_typing: bool):
        if room_id not in self.typing_users:
            self.typing_users[room_id] = set()
        
        if is_typing:
            self.typing_users[room_id].add(username)
        else:
            self.typing_users[room_id].discard(username)
        
        await self.broadcast_to_room({
            "type": "typing",
            "room_id": room_id,
            "users": list(self.typing_users[room_id])
        }, room_id)

manager = ConnectionManager()
