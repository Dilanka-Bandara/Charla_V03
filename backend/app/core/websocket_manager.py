from typing import Dict, Set, Optional
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.user_usernames: Dict[int, str] = {}  # NEW: Map user_id to username
        self.room_members: Dict[int, Set[int]] = {}
        self.typing_users: Dict[int, Set[int]] = {}

    # Updated to accept username
    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_usernames[user_id] = username
        print(f"User {user_id} ({username}) connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_usernames:
            del self.user_usernames[user_id]
        
        # Remove from all rooms
        for room_id in list(self.room_members.keys()):
            if user_id in self.room_members[room_id]:
                self.room_members[room_id].remove(user_id)
                
        # Remove from typing sets
        for room_id in list(self.typing_users.keys()):
            if user_id in self.typing_users[room_id]:
                self.typing_users[room_id].remove(user_id)
                # Broadcast the update that they stopped typing
                await self.broadcast_typing_list(room_id, exclude_user=user_id)
    
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
        
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def broadcast_new_message(self, room_id: int, message_data: dict):
        await self.broadcast_to_room(room_id, {
            "type": "new_message",
            "room_id": room_id,
            "message": message_data
        })

    async def broadcast_typing(self, room_id: int, user_id: int, username: str, is_typing: bool):
        if room_id not in self.typing_users:
            self.typing_users[room_id] = set()
        
        if is_typing:
            self.typing_users[room_id].add(user_id)
        else:
            self.typing_users[room_id].discard(user_id)
        
        await self.broadcast_typing_list(room_id, exclude_user=user_id)

    async def broadcast_typing_list(self, room_id: int, exclude_user: int):
        # Resolve user_ids to usernames
        typing_usernames = []
        if room_id in self.typing_users:
            for uid in self.typing_users[room_id]:
                # We can't include the person receiving the message in the list "Alice is typing" if I am Alice
                if uid != exclude_user: 
                    name = self.user_usernames.get(uid, "Unknown")
                    typing_usernames.append(name)
        
        # Broadcast to everyone (except the person typing, usually)
        # But actually, everyone needs to know the FULL list of OTHER people typing.
        # Simplification: Broadcast the list of *all* typing users, let frontend filter "me" out.
        
        # Re-calculating full list for broadcast
        all_typing_names = []
        if room_id in self.typing_users:
             for uid in self.typing_users[room_id]:
                 name = self.user_usernames.get(uid, "Unknown")
                 all_typing_names.append(name)

        await self.broadcast_to_room(room_id, {
            "type": "typing",
            "room_id": room_id,
            "users": all_typing_names 
        }, exclude_user=exclude_user)

manager = ConnectionManager()