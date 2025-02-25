const devURL = "localhost:1985";
const prodURL = "localhost:1985";

let socket = null;
let currentRoomId = null;

export function initializeSocket(roomId) {
    if (socket && socket.readyState === WebSocket.OPEN && currentRoomId === roomId) {
        return socket;
    }
    if (socket) {
        socket.close();
    }

    currentRoomId = roomId;
    socket = new WebSocket(`ws://${prodURL}/chat?room=${roomId}`);

    socket.onopen = () => console.log("connected to web sockets!");
    socket.onclose = (e) => console.log("Disconnected...\t", e.code, e.reason);
    socket.onerror = (e) => console.log("ERROR: \t", e.message || e);

    return socket;
}

export function getSocket() {
    if (!socket) {
        // throw new Error("WebSocket not initialized. Call initializeWebSocket first...");
        console.error("WebSocket not initialized. Call initializeWebSocket first...");
    }
    return socket;
}
export function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
    } else {
        console.error("Cannot send: WebSocket not open...");
    }
}
export function onMessage(cb) {
    if (socket) {
        socket.onmessage = e => {
            cb(e.data);
            console.log(`Message: ${e.data}`);
        }
    }
}
export function onClose(cb) {
    if (socket) {
        socket.onclose = cb;
    }
}
