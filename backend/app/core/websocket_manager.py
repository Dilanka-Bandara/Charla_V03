from typing import Dict, Set
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.room_members: Dict[int, Set[int]] = {}  # room_id -> set of user_ids
        self.typing_users: Dict[int, Set[int]] = {}  # room_id -> set of typing user_ids

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        # Remove from all rooms
        for room_id in list(self.room_members.keys()):
            if user_id in self.room_members[room_id]:
                self.room_members[room_id].remove(user_id)
        
        print(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")

    async def join_room(self, user_id: int, room_id: int):
        if room_id not in self.room_members:
            self.room_members[room_id] = set()
        self.room_members[room_id].add(user_id)
        print(f"User {user_id} joined room {room_id}")

    async def leave_room(self, user_id: int, room_id: int):
        if room_id in self.room_members and user_id in self.room_members[room_id]:
            self.room_members[room_id].remove(user_id)
        print(f"User {user_id} left room {room_id}")

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                print(f"Error sending to user {user_id}: {e}")
                await self.disconnect(user_id)

    async def broadcast_to_room(self, room_id: int, message: dict, exclude_user: int = None):
        """Broadcast message to all users in a room"""
        if room_id not in self.room_members:
            return
        
        disconnected_users = []
        for user_id in self.room_members[room_id]:
            if exclude_user and user_id == exclude_user:
                continue
            
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to user {user_id}: {e}")
                    disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def broadcast_new_message(self, room_id: int, message_data: dict):
        """Broadcast new message to all room members"""
        await self.broadcast_to_room(room_id, {
            "type": "new_message",
            "room_id": room_id,
            "message": message_data
        })

    async def broadcast_typing(self, room_id: int, user_id: int, username: str, is_typing: bool):
        """Broadcast typing indicator"""
        if room_id not in self.typing_users:
            self.typing_users[room_id] = set()
        
        if is_typing:
            self.typing_users[room_id].add(user_id)
        else:
            self.typing_users[room_id].discard(user_id)
        
        # Get usernames of all typing users
        typing_usernames = []
        if room_id in self.typing_users:
            # You would fetch usernames from DB here
            # For now, we'll just use the provided username
            if is_typing:
                typing_usernames = [username]
        
        await self.broadcast_to_room(room_id, {
            "type": "typing",
            "room_id": room_id,
            "users": typing_usernames
        }, exclude_user=user_id)

manager = ConnectionManager()
