import { useEffect, useCallback } from 'react';
import websocketService from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';

export const useWebSocket = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if we have a user (and implicitly a token)
    if (user) {
      websocketService.connect().catch(error => {
        console.error('WebSocket connection failed:', error);
      });
    }

    return () => {
      // Optional: disconnect on unmount if desired
      // websocketService.disconnect();
    };
  }, [user]);

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