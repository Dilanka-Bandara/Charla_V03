import { useEffect, useCallback } from 'react';
import websocketService from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';

export const useWebSocket = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id).catch(error => {
        console.error('WebSocket connection failed:', error);
      });
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [user?.id]);

  const subscribeToEvent = useCallback((eventType, callback) => {
    return websocketService.on(eventType, callback);
  }, []);

  const sendMessage = useCallback((message) => {
    websocketService.sendMessage(message);
  }, []);

  const joinRoom = useCallback((roomId) => {
    websocketService.joinRoom(roomId);
  }, []);

  const sendTyping = useCallback((roomId, isTyping) => {
    websocketService.sendTyping(roomId, isTyping);
  }, []);

  return {
    subscribeToEvent,
    sendMessage,
    joinRoom,
    sendTyping,
    isConnected: websocketService.isConnected()
  };
};
