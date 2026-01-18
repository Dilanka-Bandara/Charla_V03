class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(userId) {
    const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    this.ws = new WebSocket(`${WS_URL}/ws/${userId}`);

    this.ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 Received:', data);
      this.emit(data.type, data);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket Error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket Disconnected');
      this.emit('disconnected');
      this.attemptReconnect(userId);
    };
  }

  attemptReconnect(userId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect(userId);
      }, this.reconnectDelay);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected');
    }
  }

  joinRoom(roomId) {
    this.send({ type: 'join_room', room_id: roomId });
  }

  leaveRoom(roomId) {
    this.send({ type: 'leave_room', room_id: roomId });
  }

  sendMessage(roomId, message) {
    this.send({ type: 'new_message', room_id: roomId, message });
  }

  sendTyping(roomId, isTyping) {
    this.send({ type: 'typing', room_id: roomId, is_typing: isTyping });
  }

  sendReaction(roomId, messageId, reaction) {
    this.send({ type: 'message_reaction', room_id: roomId, message_id: messageId, reaction });
  }

  markAsRead(roomId, messageId) {
    this.send({ type: 'read_receipt', room_id: roomId, message_id: messageId });
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketService();
