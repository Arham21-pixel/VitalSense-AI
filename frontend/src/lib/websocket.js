const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

let socket = null;
const callbacks = [];
const statusCallbacks = [];
let reconnectTimeout = null;
let heartbeatInterval = null;

const emitStatus = (status) => {
  statusCallbacks.forEach((callback) => callback(status));
};

export const connectWebSocket = () => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  console.log('Connecting to WebSocket:', WS_URL);
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log('WebSocket connection established.');
    emitStatus('ONLINE');
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    heartbeatInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send('ping');
      }
    }, 10000);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callbacks.forEach((callback) => callback(data));
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed. Reconnecting in 3 seconds...');
    emitStatus('OFFLINE');
    socket = null;
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  };

  socket.onerror = (err) => {
    console.error('WebSocket error:', err);
    socket.close();
  };

  return socket;
};

export const onRiskUpdate = (callback) => {
  callbacks.push(callback);
  return () => {
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  };
};

export const onConnectionStatus = (callback) => {
  statusCallbacks.push(callback);
  return () => {
    const index = statusCallbacks.indexOf(callback);
    if (index !== -1) {
      statusCallbacks.splice(index, 1);
    }
  };
};

