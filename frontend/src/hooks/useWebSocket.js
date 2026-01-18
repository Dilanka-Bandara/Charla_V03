import { useEffect, useCallback } from 'react';
import websocketService from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';

export const useWebSocket = (onMessage) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id);

      return () => {
        websocketService.disconnect();
      };
    }
  }, [user]);

  const subscribeToEvent = useCallback((event, callback) => {
    websocketService.on(event, callback);
    return () => websocketService.off(event, callback);
  }, []);

  const sendMessage = useCallback((roomId, message) => {
    websocketService.sendMessage(roomId, message);
  }, []);

  const sendTyping = useCallback((roomId, isTyping) => {
    websocketService.sendTyping(roomId, isTyping);
  }, []);

  const sendReaction = useCallback((roomId, messageId, reaction) => {
    websocketService.sendReaction(roomId, messageId, reaction);
  }, []);

  const joinRoom = useCallback((roomId) => {
    websocketService.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    websocketService.leaveRoom(roomId);
  }, []);

  return {
    subscribeToEvent,
    sendMessage,
    sendTyping,
    sendReaction,
    joinRoom,
    leaveRoom
  };
};
