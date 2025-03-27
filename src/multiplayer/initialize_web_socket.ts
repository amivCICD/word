import { CheckCompletionStatus } from "../checkCompletionStatus";
import { GameOver } from "../gameOver";
import { GuessStarted } from "../guessStarted";
import { ResetGameState, UIReset } from "../resetGameState";
import { RowGameState } from "../rowGameState";
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
    resetGameState: ResetGameState,
    gameOver: GameOver.getInstance(),
    rowGameState: RowGameState.getInstance(),
    guessStarted: GuessStarted.getInstance(),
    checkCompletionStatus: CheckCompletionStatus.getInstance(),
    currentPlayer: null,
    incRow: 0,
    c: 0,
    appendGuess: "",
    restart: false,
    matrixArray: [['','','','',''],['','','','',''],['','','','',''],['','','','',''],['','','','',''],['','','','','']],
    wordRowArrayState: [
        [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
        [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
        [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
        [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
        [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
        [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
    ]
};
let textMessageState = {
    userId: "",
    message: "",
    username: "",
    messageId: "",
};
let allMessagesState = [];

let player = {
    username: null,
    userId: null,
    isCurrentPlayer: false,
    score: { letters: [] },
}

let allPlayers = [];

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
        newUserJoiningMessage();
        window.WEB_SOCKET_READY = true;
    };
    socket.onmessage = e => {
        let eventData = JSON.parse(e.data);

        if (eventData.type === "updatePlayerState") {
            updatePlayerState(eventData);
        } else if (eventData.type === "text") {
            updateTextState(eventData);
        } else if (eventData.type === "updateGameState") {
            updateGameState({ ...typeOutGuessGameState, ...eventData });
        }
        messageCallBacks.forEach(callback => callback(e.data));
    }
    socket.onclose = (e) => {
        console.log("Disconnected...\t", e.code, e.reason);
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
export function getPlayerState() {
    return allPlayers;
}
export function getCurrentArrowOfRowArrays(): [][] {
    const rows = document.querySelectorAll('.word-row');
    const arrayOfRows = Array.from(rows);
    let arrayOfRowArrays: Array<T> = [];
    for (let i = 0; i < arrayOfRows.length; i+=5) {
        const element = arrayOfRows.slice(i, i+5);
        arrayOfRowArrays.push(element);
    }
    return arrayOfRowArrays;
}

function updateGameState(data) {
    if (data.updateType === "backspace") {
        const currentRowArrayState = getCurrentArrowOfRowArrays();
        typeOutGuessGameState.row = data.row;
        typeOutGuessGameState.guess = data.guess;
        typeOutGuessGameState.userInput = data.userInput;
        typeOutGuessGameState.letterCount = data.letterCount;
        typeOutGuessGameState.rowLetterCount = data.rowLetterCount;
        typeOutGuessGameState.matrixArray[typeOutGuessGameState.row][data.letterCount] = "";
        if (data.arrayOfRowArrays) {
            typeOutGuessGameState.arrayOfRowArrays = data.arrayOfRowArrays;
            typeOutGuessGameState.wordRowArrayState[typeOutGuessGameState.row][typeOutGuessGameState.letterCount].class = currentRowArrayState[data.row][data.letterCount]?.classList?.value;
            typeOutGuessGameState.wordRowArrayState[typeOutGuessGameState.row][typeOutGuessGameState.letterCount].value = "";
        }
    } else if (data.updateType === "append") {
        const currentRowArrayState = getCurrentArrowOfRowArrays();
        // console.log('currentRowArrayState*********', currentRowArrayState);
        typeOutGuessGameState.row = data.row;
        // typeOutGuessGameState.type = data.type;
        typeOutGuessGameState.guess = data.guess;
        typeOutGuessGameState.userInput = data.userInput;
        typeOutGuessGameState.letterCount = data.letterCount;
        typeOutGuessGameState.rowLetterCount = data.rowLetterCount;
        typeOutGuessGameState.matrixArray[typeOutGuessGameState.row][data.letterCount - 1] = data.userInput;
        if (data.arrayOfRowArrays) {
            typeOutGuessGameState.arrayOfRowArrays = data.arrayOfRowArrays;
        }
        if (currentRowArrayState) {
            typeOutGuessGameState.wordRowArrayState[typeOutGuessGameState.row][typeOutGuessGameState.letterCount - 1].class = currentRowArrayState[data.row][data.letterCount - 1].classList.value;
            typeOutGuessGameState.wordRowArrayState[typeOutGuessGameState.row][typeOutGuessGameState.letterCount - 1].value = data.userInput;
        }
    } else if (data.updateType === "setWOTD_and_params") {
        typeOutGuessGameState.wordOfTheDay = data.wordOfTheDay;
        typeOutGuessGameState.wordOfTheDayLetters = data.wordOfTheDayLetters;
        typeOutGuessGameState.gameState = data.gameState;
        // typeOutGuessGameState.arrayOfRowArrays = data.typeOutGuessGameState;
    } else if (data.updateType === "guessAttempt") {
        // typeOutGuessGameState.userInput = "";
        typeOutGuessGameState.row = data.row;
        typeOutGuessGameState.userInput = data.userInput;
        typeOutGuessGameState.wordOfTheDay =  data.wordOfTheDay;
        typeOutGuessGameState.wordOfTheDayLetters = data.wordOfTheDayLetters;
        typeOutGuessGameState.gameStateParam = data.gameStateParam;
        typeOutGuessGameState.rowGameState = data.rowGameState;
        typeOutGuessGameState.arrayOfRowArrays = data.arrayOfRowArrays;
        console.log("IN GUESS ATTEMPT typeOutGuessGameState.wordRowArrayState\t", typeOutGuessGameState.wordRowArrayState);

    } else if (data.updateType === "resetGameState") {
        typeOutGuessGameState.resetGameState = data.resetGameState;
        typeOutGuessGameState.wordOfTheDay = data.resetGameState.wordOfTheDay;
        typeOutGuessGameState.wordOfTheDayLetters = data.resetGameState.wordOfTheDayLetters;
    } else if (data.updateType === "checkCompletionStatus") {
        typeOutGuessGameState.checkCompletionStatus = data.checkCompletionStatus
    } else if (data.updateType === "syncStateToServer") {
        console.log('typeOutGuessGameState.matrixArray from updateState\t', typeOutGuessGameState.matrixArray)
    } else if (data.updateType === "syncMatrix") {
        const state = getGameState();
        console.log("@updateType syncMatrix: data.incRow\t", data.incRow);
        console.log("state.currentPlayer\t", state.currentPlayer)
        // typeOutGuessGameState.incRow = data.incRow; // didnt work, but did reset incRow for both players...
    }
}

function updatePlayerState(data) {
    let state = getGameState();
    if (data.updateType === "setCurrentPlayer") {
        player = {
            username: data.username,
            userId: data.userId,
            isCurrentUser: data.isCurrentPlayer,
            score: { letters: [] },
            currentPlayerIndex: null
        }
        allPlayers = [player];
    } else if (data.updateType === "addPlayer") {

        if (Array.isArray(data.playerCount)) {
            const incomingPlayers = JSON.stringify(data.playerCount)
            const currentPlayers = JSON.stringify(allPlayers)
            if (incomingPlayers !== currentPlayers) {
                allPlayers.length = 0;
                data.playerCount?.forEach((player) => {
                    allPlayers.push(player);
                });
            }
            if (!allPlayers.find(player => player.isFirstPlayer === true)) {
                // state.incRow = parseInt(data.playerCount[0].incRow);
                console.log("(when addPlayer called) state.incRow\t", state.incRow)
                console.log("@@@@@@@@DATA.PLAYERCOUNT\t", data.playerCount);
                console.log("It does NOT see a players.isFirstPlayer");
                allPlayers[0].isFirstPlayer = true;
                allPlayers[0].currentPlayerIndex = 0;
                state.currentPlayer = JSON.stringify(allPlayers[0]); // initial first player

                const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
                const userTurn = document.getElementById("userTurn");
                userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${currentPlayer.username}</div>`;
                // console.log("currentPlayer MATRIX ARRAY\t", JSON.parse(currentPlayer.wordRowArrayState));
                console.log("currentPlayer wordArrayState\t", currentPlayer);
            }
            else if (allPlayers.find(player => player.isFirstPlayer === true)) {
                console.log("It sees a players.isFirstPlayer")
                // new 03 23 2025
                const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
                const userTurn = document.getElementById("userTurn");
                userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${currentPlayer.username}</div>`;
                // console.log("currentPlayer MATRIX ARRAY\t", JSON.parse(currentPlayer.wordRowArrayState));
                console.log("currentPlayer wordArrayState\t", currentPlayer);
            }
            // allPlayers
            if (allPlayers.length > 1 && allPlayers[0].wordRowArrayState.length) {
                const localUser = localStorage.getItem("username");
                const localUserData = JSON.parse(localUser);
                const localUserId = localUserData.userId.toString();
                const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
                const currentRowArrayState = getCurrentArrowOfRowArrays();
                const wordRowData = JSON.parse(currentPlayer.wordRowArrayState);
                if (localUserId !== currentPlayer.userId && currentPlayer.wordRowArrayState.length > 0) {
                    if (wordRowData) { // currentPlayer.wordRowArrayState
                        console.log("wordRowData in if statement is called")
                        wordRowData.forEach((row, rowIndex) => { // this successfully updates the new player joining (letters not css yet)
                            row.forEach((col, colIndex) => {
                                if (col.value === "") {
                                } else {
                                    currentRowArrayState[rowIndex][colIndex].innerHTML = col.value;
                                    currentRowArrayState[rowIndex][colIndex].classList.value = col.class;
                                }
                            });
                        });
                    }
                }
            }
        }

        const localUserInfo = localStorage.getItem("username");
        const userInfo = JSON.parse(localUserInfo);
        if (allPlayers) {
            const mySessionId = allPlayers.filter(player => player.userId === userInfo.userId.toString());
        }
    } else if (data.updateType === "removePlayer") {
        allPlayers?.filter(player => player.userId !== data.userId);

    } else if (data.updateType === "updatePlayerScore") {
        allPlayers = allPlayers?.map(player =>
            player.userId === data.userId ? { ...player, score: { letters: [...player.score.letters, data.letter]}} : player);
    } else if (data.updateType === "nextPlayer") {
        state.currentPlayer = data.currentPlayer;
        // 03 26 2025 - 12:16 AM
        // HERES AN IDEA, DITCH THE isFirstPlayer, and just run it off state, state.currentPlayer, and set it each time...then we are not updating anything, we are simply checking if localUserId === state.currentPlayer.userId
        const player = JSON.parse(state.currentPlayer);
        console.log("JSON.parse(data.currentPlayer)\t", JSON.parse(data.currentPlayer));
        const userTurn = document.getElementById("userTurn");
        userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${player.username}</div>`;
    }
}
onMessage((e) => {
    const state = getGameState();
    const data = JSON.parse(e);
    if (data.updateType === "addPlayer") {
        const localUserInfo = localStorage.getItem("username");
        const userInfo = JSON.parse(localUserInfo);
    } else if (data.updateType === "removePlayer") { // whoever sees two players first?
        console.log('playerState AFTER REMOVE PLAYER \t', player);
    } else if (data.updateType === "checkForTwoPlayers" && allPlayers.length >= 2) {

    } else if (data.updateType === "checkCompletionStatus") {

    } else if (data.updateType === "resetGameState") {
        state.resetGameState = data.resetGameState;
        // state.resetGameState = new ResetGameState(data.reset, data.wordOfTheDay);
        state.wordOfTheDay = data.wordOfTheDay;
        state.wordOfTheDayLetters = data.wordOfTheDayLetters;
        // state.gameOver =  data.gameOver;
        state.letterCount = 0;
        state.row = 0;
        state.guess = "";
        state.gameComplete = data.gameComplete;
        state.rowGameState.startFromZero();
        state.incRow = 0;
        state.appendGuess = "";
        state.c = 0;
        state.restart = false // added later
        UIReset.resetUI();
        return;
    } else if (data.updateType === "resetGuessState") {
        state.incRow = data.incRow;
        state.appendGuess = data.appendGuess;
        state.c = data.c;
        state.restart = data.restart;
        return;
    }
});

// leaving chat channel
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

// joining chat channel
onMessage((e) => {
    const state = getGameState();
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


