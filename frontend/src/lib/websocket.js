export function createSocket() {
  const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  return new WebSocket(url);
}
