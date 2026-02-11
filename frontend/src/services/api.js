import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
// FIX 1: Removed URLSearchParams. Sending a plain object makes Axios send JSON.
export const login = (username, password) =>
  api.post('/api/auth/login', { username, password });

export const register = (username, email, password, fullName) =>
  api.post('/api/auth/register', { username, email, password, full_name: fullName });

// Users
export const getCurrentUser = () => api.get('/api/users/me');
export const getAllUsers = () => api.get('/api/users');

// Rooms
export const getRooms = () => api.get('/api/rooms');
export const getRoom = (roomId) => api.get(`/api/rooms/${roomId}`);
export const createRoom = (roomData) => api.post('/api/rooms', roomData);
export const joinRoom = (roomId) => api.post(`/api/rooms/${roomId}/join`);

// Room Invites
export const inviteToRoom = (roomId, userId) => 
  api.post(`/api/rooms/${roomId}/invite`, { user_id: userId });
export const getMyInvites = () => api.get('/api/rooms/invites');

export const acceptInvite = (inviteId) => 
  api.post(`/api/rooms/invites/${inviteId}/accept`);
export const declineInvite = (inviteId) => 
  api.post(`/api/rooms/invites/${inviteId}/decline`);

// Messages
export const getRoomMessages = (roomId) =>
  api.get(`/api/rooms/${roomId}/messages`);
export const createMessage = (messageData) =>
  api.post('/api/messages', messageData);

export const deleteMessage = (messageId) =>
  api.delete(`/api/messages/${messageId}`);

// File Upload
export const uploadFile = async (file, roomId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('room_id', roomId);
  
  return api.post('/api/messages/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Reactions
export const addReaction = (messageId, emoji) =>
  api.post(`/api/messages/${messageId}/reactions`, { emoji });

export default api;