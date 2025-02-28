import { newUserJoiningMessage, userLeavingMessage } from "./newUserJoiningMessage";

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
        console.log("Connected to web socket!");
        // const unameInfo = JSON.parse(localStorage.getItem("username"));
        // socket.send(JSON.stringify({ type: 'join', ...unameInfo }));
        newUserJoiningMessage();
        window.WEB_SOCKET_READY = true;
    };
    socket.onmessage = e => {
        let eventData = JSON.parse(e.data);
        if (eventData.type !== "text") {
            updateGameState({ ...typeOutGuessGameState, ...eventData});
        } else if (eventData.type === "text") {
            updateTextState(eventData);
        }
        messageCallBacks.forEach(callback => callback(e.data));
    }
    socket.onclose = (e) => {
        console.log("Disconnected...\t", e.code, e.reason);
        // userLeavingMessage();
    };
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


// leaving
onMessage((e) => {
    const data = JSON.parse(e);
    if (data.type === "userleaving") {
        const joinedChat = document.getElementById("textMessages");
        const div = document.createElement('div');
        div.innerHTML = `<div class="chat-footer">
        <span class="font-bold italic">${data.username}</span> has left the chat.<br />
        <time class="text-xs opacity-50">${new Date(Date.now()).toString().slice(0, 24)}</time>
        </div>`;
        joinedChat.appendChild(div);
        const textMessages = document.getElementById("textMessages");
        textMessages.scrollTo(0, textMessages.scrollHeight);
    }
}); // initial join if they exist

// joining
onMessage((e) => {
    const data = JSON.parse(e);
    if (data.type === "newuserjoining") {
        const joinedChat = document.getElementById("textMessages");
        const div = document.createElement('div');
        div.innerHTML = `<div class="chat-footer">
        <span class="font-bold italic">${data.username}</span> joined the chat.<br />
        <time class="text-xs opacity-50">${new Date(Date.now()).toString().slice(0, 24)}</time>
        </div>`;
        joinedChat.appendChild(div);
        const textMessages = document.getElementById("textMessages");
        textMessages.scrollTo(0, textMessages.scrollHeight);
    }
});