import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = async (username, email, password, fullName) => {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
    full_name: fullName
  });
  return response.data;
};

export const login = async (username, password) => {
  const response = await api.post('/auth/login', {
    username,
    password
  });
  return response.data;
};

// User APIs
export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Room APIs
export const getRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

export const createRoom = async (data) => {
  const response = await api.post('/rooms', data);
  return response.data;
};

export const joinRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/join`);
  return response.data;
};

export const leaveRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/leave`);
  return response.data;
};

// Message APIs
export const getRoomMessages = async (roomId, limit = 50, offset = 0, search = null) => {
  const response = await api.get(`/messages/room/${roomId}`, {
    params: { limit, offset, search }
  });
  return response.data;
};

export const createMessage = async (data) => {
  const response = await api.post('/messages', data);
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
};

export const addReaction = async (messageId, emoji) => {
  const response = await api.post('/messages/reactions', {
    message_id: messageId,
    emoji
  });
  return response.data;
};

export default api;
