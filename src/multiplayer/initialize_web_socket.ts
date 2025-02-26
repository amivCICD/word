const devURL = "localhost:1985";
const prodURL = "localhost:1985";
const messageCallBacks = [];

let socket = null;
let currentRoomId = null;

let typeOutGuessGameState = {
    row: 0,
    // type: "",
    guess: "",
    userInput: "",
    letterCount: 0,
    rowLetterCount: 0,
    arrayOfRowArrays: []
};

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

        // socket.onmessage((messageData) => {

        // });
    };
    socket.onmessage = e => {
        console.log('EVENT\t', e);
        let eventData = JSON.parse(e.data);
        if (eventData.type === "append" || eventData.type === "backspace") {
            updateGameState(eventData);
        }
        messageCallBacks.forEach(callback => callback(e.data));
    }
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
// export function onMessage(cb) {
//     if (socket) {
//         socket.onmessage = e => {
//             cb(e.data);
//             console.log(`Message: ${e.data}`);
//         }
//     }
// }
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
function updateGameState(data) {
    console.log("gamestate data\t", data.type)
    // const data = JSON.parse(data);
    if (data.type === "backspace") {
        console.log("was back space....")
        typeOutGuessGameState.row = data.row;
        // typeOutGuessGameState.guess = data.guess || typeOutGuessGameState.guess.slice(0, -1);
        typeOutGuessGameState.guess = data.guess;
        // typeOutGuessGameState.type = data.type;
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
}
// sendMessage(JSON.stringify({
//         type: 'append',
//         guess: guess,
//         userInput: userInput,
//         letterCount: rowGameState.getRowLetterCount(),
//         row: row,
//         arrayOfRowArrays: arrayOfRowArrays,
//         inputId: Math.random().toString().slice(2)
//     }));