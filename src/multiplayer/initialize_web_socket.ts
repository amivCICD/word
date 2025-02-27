const prodURL = "localhost:1985";

let socket = null;
let currentRoomId = null;
const messageCallBacks = [];
window.WEB_SOCKET_READY = false; // so user cannot spam input while websocket is loading (messing with state)

let typeOutGuessGameState = {
    row: 0,
    guess: "",
    userInput: "",
    letterCount: 0,
    wordOfTheDay: "",
    gameComplete: false,
    rowLetterCount: 0,
    gameStateParam: undefined,
    arrayOfRowArrays: [],
    wordOfTheDayLetters: [],
};
let textMessageState = {
    userId: "",
    message: "",
    username: "",
    messageId: "",
};

let allMessagesState = [];

export function initializeSocket(roomId) {
    if (socket && socket.readyState === WebSocket.OPEN && currentRoomId === roomId) {
        return socket;
    }
    if (socket) {
        socket.close();
    }

    currentRoomId = roomId;
    socket = new WebSocket(`ws://${prodURL}/chat?room=${roomId}`);

    socket.onopen = () => {
        console.log("connected to web sockets!");
        const unameInfo = JSON.parse(localStorage.getItem("username"));
        socket.send(JSON.stringify({ type: 'join', ...unameInfo }));
        window.WEB_SOCKET_READY = true;
    };
    socket.onmessage = e => {
        let eventData = JSON.parse(e.data);
        if (eventData.type !== "text") {
            updateGameState({ ...typeOutGuessGameState, ...eventData});
        } else if (eventData.type === "text") {
            updateTextState(eventData);
        } else if (eventData.type === "join") {

        }
        messageCallBacks.forEach(callback => callback(e.data));
    }
    socket.onclose = (e) => console.log("Disconnected...\t", e.code, e.reason);
    socket.onerror = (e) => console.log("ERROR: \t", e.message || e);

    return socket;
}

export function getSocket() {
    if (!socket) {
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
    if (!messageCallBacks.includes(cb)) {
        messageCallBacks.push(cb);
    }
}
export function onClose(cb) {
    if (socket) {
        socket.onclose = cb;
    }
}
export function getGameState() {
    return typeOutGuessGameState;
}
export function getTextMessageState() {
    return textMessageState;
}
export function getAllTextMessageState() {
    return allMessagesState;
}
function updateGameState(data) {
    if (data.type === "backspace") {
        typeOutGuessGameState.row = data.row;
        // typeOutGuessGameState.guess = data.guess || typeOutGuessGameState.guess.slice(0, -1);
        typeOutGuessGameState.guess = data.guess;
        typeOutGuessGameState.userInput = data.userInput;
        typeOutGuessGameState.letterCount = data.letterCount;
        typeOutGuessGameState.rowLetterCount = data.rowLetterCount;
        if (data.arrayOfRowArrays) {
            typeOutGuessGameState.arrayOfRowArrays = data.arrayOfRowArrays;
        }
    }
    if (data.type === "append") {
        typeOutGuessGameState.row = data.row;
        // typeOutGuessGameState.type = data.type;
        typeOutGuessGameState.guess = data.guess;
        typeOutGuessGameState.userInput = data.userInput;
        typeOutGuessGameState.letterCount = data.letterCount;
        typeOutGuessGameState.rowLetterCount = data.rowLetterCount;
        if (data.arrayOfRowArrays) {
            typeOutGuessGameState.arrayOfRowArrays = data.arrayOfRowArrays;
        }
    }
    if (data.type === "setWOTD_and_params") {
        typeOutGuessGameState.wordOfTheDay = data.wordOfTheDay;
        typeOutGuessGameState.wordOfTheDayLetters = data.wordOfTheDayLetters;
        typeOutGuessGameState.gameState = data.gameState;
        // typeOutGuessGameState.arrayOfRowArrays = data.typeOutGuessGameState;
    }
}

function updateTextState(data) {
    if (data.type === "text") {
        textMessageState = {
            userId: data.userId || "",
            message: data.message || "",
            username: data.username || "",
            messageId: data.messageId || "",
        };
        allMessagesState.push({ ...textMessageState });
    }
}