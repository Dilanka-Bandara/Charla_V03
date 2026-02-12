class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.eventHandlers = new Map();
    this.isConnecting = false;
  }

  // Changed: No longer accepts userId, assumes token is in localStorage
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Cannot connect to WebSocket: No token found');
        return Promise.reject('No token');
    }

    this.isConnecting = true;
    const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

    return new Promise((resolve, reject) => {
      try {
        // CHANGED: Connect using query param token instead of path param
        this.ws = new WebSocket(`${WS_URL}/ws?token=${token}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.handleReconnect();
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  handleMessage(data) {
    const handlers = this.eventHandlers.get(data.type);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  on(eventType, callback) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType).add(callback);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(callback);
      }
    };
  }

  subscribeToEvent(eventType, callback) {
    return this.on(eventType, callback);
  }

  sendMessage(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  joinRoom(roomId) {
    this.sendMessage({
      type: 'join_room',
      room_id: roomId
    });
  }

  sendTyping(roomId, isTyping) {
    this.sendMessage({
      type: 'typing',
      room_id: roomId,
      is_typing: isTyping
    });
  }

  disconnect() {
    if (this.ws) {
      this.reconnectAttempts = this.maxReconnectAttempts;
      // CRITICAL FIX: Nullify onclose to prevent auto-reconnect logic from firing
      this.ws.onclose = null; 
      this.ws.close();
      this.ws = null;
      this.isConnecting = false;
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

const websocketService = new WebSocketService();
export default websocketService;