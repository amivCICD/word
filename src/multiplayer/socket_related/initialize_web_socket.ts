import { CheckCompletionStatus } from "../../checks/CheckCompletionStatus";
import { GameOver } from "../../game_over_related/GameOver";
import { GuessStarted } from "../guess_related/GuessStarted";
import { ResetGameState } from "../../gamestate/ResetGameState";
import { UIReset } from "../../gamestate/UIReset";
import { RowGameState } from "../../gamestate/RowGameState";
import { newUserJoiningMessage, userLeavingMessage } from "../chat_related/newUserJoiningMessage";
import { swapPlayersFrontEnd } from "../guess_related/typeOutGuess";
import { typeOutGuess } from "../guess_related/typeOutGuess";
import { startLoadingSpinner, stopLoadingSpinner } from "../helper_functions/loadingSpinners";
import { wordDefinitionProvider } from "../helper_functions/wordDefinitionProvider";



const prodURL = window.location.host === "localhost:5173" ? "localhost:1985" : window.location.host;

let socket: WebSocket | null = null;
let currentRoomId: string | null = null;
let heartBeatInterval: number | null = null;
let reconnectTimeout: number | null = null;

const messageCallBacks = [];
window.WEB_SOCKET_READY = false; // so user cannot spam input while websocket is loading (messing with state)


let typeOutGuessGameState = {
    row: 0,
    guess: "",
    userInput: "",
    letterCount: 0,
    wordOfTheDay: "",
    wordDefinition: [],
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
    ],
    keyboardState: [
        // { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""},
        // { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""},
        // { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""},
        // { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""}, { class: ""},
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
    startLoadingSpinner(false);
    if (socket && socket.readyState === WebSocket.OPEN && currentRoomId === roomId) {
        return socket;
    }
    if (socket) {
        cleanupSocket();
        socket.close();
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    currentRoomId = roomId;
    socket = new WebSocket(`${wsProtocol}://${prodURL}/chat?room=${roomId}`);
    socket.onopen = () => {
        console.log("Connected to web socket!");
        newUserJoiningMessage();
        window.WEB_SOCKET_READY = true;
        document.dispatchEvent(new Event("websocket-ready"));
        stopLoadingSpinner(0);

        if(heartBeatInterval) clearInterval(heartBeatInterval);
        heartBeatInterval = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "ping" }));
            }
        }, 15000);
    };
    socket.onmessage = e => {
        let eventData = JSON.parse(e.data);

        if (eventData.type === "updatePlayerState") {
            updatePlayerState(eventData);
        } else if (eventData.type === "text") {
            updateTextState(eventData);
        } else if (eventData.type === "updateGameState") {
            const typeOutGuessGameState = getGameState();
            updateGameState({ ...typeOutGuessGameState, ...eventData });
            // updateGameState(eventData); 08 27 2025 look into this, perhaps we need to send everything from the server...
        } else if (eventData.type === "updateServerWord") {
            // console.log("updatedServer word fired in socket.onmessage")
        } else if (eventData.type === "userleaving") {
            checkForPlayerCount(eventData);
        } else if (eventData.type === "newJoinerInitialState") {
            console.log("eventData.currentPlayerState\t", eventData.currentPlayerState);
        }
        messageCallBacks.forEach(callback => callback(e.data));
    }
    socket.onclose = (e) => {
        console.log("Disconnected...\t", e.code, e.reason);
        window.WEB_SOCKET_READY = false;
        cleanupSocket();
        scheduleReconnect(roomId);
    };
    socket.onerror = (e) => console.error("Websocket Error:\t", e);
    return socket;
}
function scheduleReconnect(roomId: string) {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (window.WEB_SOCKET_READY === true) return;
    reconnectTimeout = window.setTimeout(() => {
        console.log("Attempting Reconnect...");
        initializeSocket(roomId);
    }, 2000);
}
function cleanupSocket() {
    if(heartBeatInterval) {
        clearInterval(heartBeatInterval);
        heartBeatInterval = null;
    }
    if(reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
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
export function getCurrentKeyboardState(): [] {
    return Array.from(document.querySelectorAll("kbd"));
}

function updateGameState(data) {
    const typeOutGuessGameState = getGameState();
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
        // typeOutGuessGameState.keyboardState = getCurrentKeyboardState();

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
        typeOutGuessGameState.keyboardState = data.keyboardState
        // console.log("IN GUESS ATTEMPT typeOutGuessGameState.wordRowArrayState\t", typeOutGuessGameState.wordRowArrayState);

    } else if (data.updateType === "checkCompletionStatus") {
        typeOutGuessGameState.checkCompletionStatus = data.checkCompletionStatus
    } else if (data.updateType === "syncStateToServer") {
        console.log('typeOutGuessGameState.matrixArray from updateState\t', typeOutGuessGameState.matrixArray)
    } else if (data.updateType === "syncMatrix") {
        // console.log("data from SYNCMATRIX\t", data.keyboardState);
    }
}

function updatePlayerState(data) {
    let typeOutGuessGameState = getGameState();
    if (data.updateType === "setCurrentPlayer") {
        player = {
            username: data.username,
            userId: data.userId,
            isCurrentUser: data.isCurrentPlayer,
            score: { letters: [] },
            currentPlayerIndex: null,
            isFirstPlayer: false
        }
        allPlayers = [player];
    } else if (data.updateType === "addPlayer") {
        console.log("data from addPlayer\t", data);
        console.log("data from addPlayer data.playerCount\t", data.playerCount);
        // console.log("data.playerCount.incRow\t", data.playerCount);
        if (data.playerCount) {
            allPlayers = [...data?.playerCount];
        }

        if (Array.isArray(data.playerCount)) {
            const incomingPlayers = JSON.stringify(data.playerCount);
            const currentPlayers = JSON.stringify(allPlayers);
            console.log("incomingPlayers\t", incomingPlayers);
            console.log("currentPlayers\t", currentPlayers);
            if (incomingPlayers !== currentPlayers) {
                allPlayers.length = 0;
                data.playerCount?.forEach((player) => {
                    allPlayers.push(player);
                });
            }
            // allPlayers = [...data.playerCount]; 09 03 2025 testing this
            if (!allPlayers.find(player => player.isFirstPlayer)) {
                // state.incRow = parseInt(data.playerCount[0].incRow);
                // console.log("(when addPlayer called) state.incRow\t", state.incRow);
                // console.log("@@@@@@@@DATA.PLAYERCOUNT\t", data.playerCount);
                // console.log("It does NOT see a players.isFirstPlayer");
                allPlayers[0].isFirstPlayer = true;
                allPlayers[0].currentPlayerIndex = 0;
                allPlayers[0].wasInitialFirstPlayer = true;
                // typeOutGuessGameState.incRow = allPlayers[0].incRow;

                // state.currentPlayer = JSON.stringify(allPlayers[0]); // initial first player // why was this stringified? 03 28 2025

                typeOutGuessGameState.currentPlayer = allPlayers[0]; // initial first player
                const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
                const userTurn = document.getElementById("userTurn");
                userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${currentPlayer.username}</div>`;
                // console.log("currentPlayer MATRIX ARRAY\t", JSON.parse(currentPlayer.wordRowArrayState));
                // console.log("currentPlayer wordArrayState\t", currentPlayer);
            }
            else if (allPlayers.find(player => player.isFirstPlayer === true)) {
                console.log("It sees a players.isFirstPlayer");

                // state.incRow = newIncRow;
                // console.log("state.incRow\t", state.incRow)
                // new 03 23 2025
                const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
                typeOutGuessGameState.currentPlayer = currentPlayer;
                // typeOutGuessGameState.incRow = parseInt(data.incRow); 09 04 2025 commented out, not even sure if it does anything
                // typeOutGuessGameState.incRow = 4;

                const userTurn = document.getElementById("userTurn");
                userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${currentPlayer.username}</div>`;
                // console.log("currentPlayer MATRIX ARRAY\t", JSON.parse(currentPlayer.wordRowArrayState));
                // console.log("currentPlayer wordArrayState\t", currentPlayer);
            }
            // allPlayers
            if (allPlayers.length > 1 && allPlayers[0].wordRowArrayState.length) {
                // typeOutGuessGameState.incRow = parseInt(data.incRow);

                const localUser = localStorage.getItem("username");
                const localUserData = JSON.parse(localUser);
                const localUserId = localUserData.userId.toString();
                const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
                typeOutGuessGameState.incRow = currentPlayer.incRow; // 09 04 2025 this hack temporarily works
                console.log("currentPlayer.incRow\t", currentPlayer.incRow);

                // typeOutGuessGameState.incRow = currentPlayer.incRow - 1; // this hack temporarily works
                const currentRowArrayState = getCurrentArrowOfRowArrays();
                const wordRowData = JSON.parse(currentPlayer.wordRowArrayState);
                if (localUserId !== currentPlayer.userId && currentPlayer.wordRowArrayState.length > 0) {
                    if (wordRowData) { // currentPlayer.wordRowArrayState
                        // console.log("wordRowData in if statement is called");
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
                const kbState = JSON.parse(currentPlayer.keyboardState);
                if (localUserId !== currentPlayer.userId && kbState.length > 1) {
                    kbState.forEach((changedKey: { value: string, class: string }) => {
                        const currentKeys = Array.from(document.querySelectorAll("kbd"))
                            .find((k) => k.innerHTML === changedKey.value)
                        if (currentKeys) {
                            currentKeys.className = changedKey.class;
                        }
                    });
                }
            }
            // const localUser = localStorage.getItem("username");
            // const localUserData = JSON.parse(localUser);
            // const localUserId = localUserData.userId.toString();
            // const currentPlayer = allPlayers.find(player => player.isFirstPlayer);

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
    } else if (data.updateType === "nextPlayer") { // 09 04 2025 handled in typeOutGuess.ts
        const typeOutGuessGameState = getGameState();
        // console.log("JSON.parse(data.currentPlayer)\t", JSON.parse(data.currentPlayer));
        // console.log("JSON.parse(data.nextPlayer)\t", JSON.parse(data.nextPlayer));
        // console.log("JSON.parse(data.incRow)\t", JSON.parse(data.incRow));
        //////////////08 31 2025 leave these off, was changing the inc row dramatically
        // state.incRow = JSON.parse(data.incRow);
        // state.currentPlayer.incRow = data.incRow;
        //////////////////////////
        const d1 = JSON.parse(data.currentPlayer);
        const d2 = JSON.parse(data.nextPlayer);
        console.log("JSON.parse(data.currentPlayer)\t", d1);
        console.log("JSON.parse(data.nextPlayer)\t", d2);
        typeOutGuessGameState.currentPlayer = JSON.parse(data.currentPlayer); // this MOVES TO our next player: MUST have
        // typeOutGuessGameState.incRow = d1.incRow;
        // typeOutGuessGameState.incRow = d1.incRow;
        // typeOutGuessGameState.currentPlayer.incRow = JSON.parse(data.currentPlayer.incRow);
        // 03 26 2025 - 12:16 AM
        // HERES AN IDEA, DITCH THE isFirstPlayer, and just run it off state, state.currentPlayer, and set it each time...then we are not updating anything, we are simply checking if localUserId === state.currentPlayer.userId
        const player = typeOutGuessGameState.currentPlayer;
        const userTurn = document.getElementById("userTurn");
        userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${player.username}</div>`;

    } else if (data.updateType === "getSyncedKeyboardCSS") {
        console.log("syncKeyboardCSS FIRED OFFF@@@@@@@@@@@@@@");
        const typeOutGuessGameState = getGameState();
        // const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
        // console.log("allPlayers\t", allPlayers)
        // console.log("currentPlayer\t", currentPlayer);
        // const kbState = JSON.parse(currentPlayer.keyboardState);
        // const kbState = false;
        // console.log("data from syncKeyboardCSS\t", data)
        // if (kbState) {
        //     console.log("kbState data.keyboardState\t", kbState);
        //     const localUserId = JSON.parse(localStorage.getItem("username")).userId;
        //     if (localUserId !== currentPlayer.userId && kbState.length > 1) {
        //         kbState.forEach((changedKey: { value: string, class: string }) => {
        //             const currentKeys = Array.from(document.querySelectorAll("kbd"))
        //                 .find((k) => k.innerHTML === changedKey.value)
        //             if (currentKeys) {
        //                 currentKeys.className = changedKey.class;
        //             }
        //         });
        //     }
        // }


    }

}
onMessage((e) => {
    const typeOutGuessGameState = getGameState();
    const data = JSON.parse(e);
    if (data.updateType === "addPlayer") {

    } else if (data.updateType === "removePlayer") { // whoever sees two players first?
        console.log('playerState AFTER REMOVE PLAYER \t', player);
    } else if (data.updateType === "checkForTwoPlayers" && allPlayers.length >= 2) {

    } else if (data.updateType === "checkCompletionStatus") {

    } else if (data.updateType === "resetGameState") {
        // console.log("typeOutGuessGameState.wordOfTheDay IN RESET GAME STATE AFTER GAME OVER\t", typeOutGuessGameState.wordOfTheDay);
        // console.log("state.currentPlayer IN RESET GAME STATE AFTER GAME OVER\t", typeOutGuessGameState.currentPlayer);
        typeOutGuessGameState.wordRowArrayState = [
            [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
            [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
            [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
            [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
            [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
            [ { class: "", value: "", }, { class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", },{ class: "", value: "", } ],
        ];
        typeOutGuessGameState.keyboardState = [];
        console.log("data @@@@AFTER@@@@ resetGameState\t", data);

        // from the other resetGameState
        typeOutGuessGameState.resetGameState = data.resetGameState; // 08 29 2025 was .reset
        typeOutGuessGameState.wordOfTheDay = data.resetGameState.wordOfTheDay;
        typeOutGuessGameState.wordOfTheDayLetters = data.resetGameState.wordOfTheDayLetters;

        console.log("typeOutGuessGameState.wordOfTheDay AFTER APPLIED DATA\t", typeOutGuessGameState.wordOfTheDay);

        // state.resetGameState = new ResetGameState(data.reset, data.wordOfTheDay);
        typeOutGuessGameState.resetGameState = data.resetGameState.reset;
        typeOutGuessGameState.wordOfTheDay = data.wordOfTheDay;
        console.log("data.resetGameState.wordDefinition\t", data.resetGameState.wordDefinition);
        console.log("data.wordDefinition\t", data.wordDefinition);
        // typeOutGuessGameState.wordDefinition = data.resetGameState.wordDefinition; 09 04 2025 old word definition state is being held
        typeOutGuessGameState.wordDefinition = data.wordDefinition;
        typeOutGuessGameState.wordOfTheDayLetters = data.wordOfTheDayLetters;
        // state.gameOver =  data.gameOver;
        typeOutGuessGameState.letterCount = 0;
        typeOutGuessGameState.row = 0;
        typeOutGuessGameState.guess = "";
        typeOutGuessGameState.gameComplete = data.gameComplete;
        typeOutGuessGameState.rowGameState.startFromZero();
        typeOutGuessGameState.incRow = 0;
        typeOutGuessGameState.appendGuess = "";
        typeOutGuessGameState.c = 0;
        typeOutGuessGameState.restart = false // added later
        UIReset.resetUI();
        typeOutGuessGameState.checkCompletionStatus.setCompletedGame();
        typeOutGuessGameState.checkCompletionStatus.hideRevealStartBtn(true);
        typeOutGuessGameState.gameOver.setGameOverFalse();
        // allPlayers = []; 09 04 2025, what does this do if added
        wordDefinitionProvider();

        const hard_reset = { reset: true };
        typeOutGuess(null, hard_reset, typeOutGuessGameState.wordOfTheDay, typeOutGuessGameState.wordOfTheDayLetters);
        return;
    } else if (data.updateType === "resetGuessState") {
        typeOutGuessGameState.incRow = data.incRow;
        typeOutGuessGameState.appendGuess = data.appendGuess;
        typeOutGuessGameState.c = data.c;
        typeOutGuessGameState.restart = data.restart;
        return;
    } else if (data.updateType === "wordOfDay") {
        console.log("data in wordOfDay\t", data)
        const userWhoClicked = data.userWhoClicked;
        startLoadingSpinner(true, `${userWhoClicked} restarted the game!`);
        // console.log("data WORD OF DAY \t", data);
        stopLoadingSpinner(2500);
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
        startLoadingSpinner(true, `${data.username} has joined!`);
        const joinedChat = document.getElementById("textMessages");
        const div = document.createElement('div');
        div.innerHTML = `<div class="chat-footer">
        <span class="font-bold italic">${data.username}</span> joined the chat.<br />
        <time class="text-xs opacity-50">${new Date(Date.now()).toString().slice(0, 24)}</time>
        </div>`;
        joinedChat.appendChild(div);
        const textMessages = document.getElementById("textMessages");
        textMessages.scrollTo(0, textMessages.scrollHeight);
        stopLoadingSpinner(2000);
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

function checkForPlayerCount(data) {
    console.log("checkForPlayerCount DATA\t", data);
    const state = getGameState();
    swapPlayersFrontEnd(state, true, data);

    // let gameState = getGameState();
    // let allPlayersOriginalLength = allPlayers.length;
    // const indexOfLeavingUser = allPlayers.findIndex(user => user.userId === data.userId);

    // const nextPlayersIndex = (indexOfLeavingUser + 1) % allPlayersOriginalLength;
    // console.log("nextPlayersIndex", nextPlayersIndex);
    // console.log("allPlayers[nextPlayersIndex]", allPlayers[nextPlayersIndex]);

    // allPlayers = allPlayers.filter(player => parseInt(player.userId) !== parseInt(data.userId));
    // allPlayers[nextPlayersIndex].isFirstPlayer = true;

    // gameState.currentPlayer = allPlayers[nextPlayersIndex]; // initial first player
    // const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
    // const userTurn = document.getElementById("userTurn");
    // userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${currentPlayer.username}</div>`;

    // let globalCurrentPlayer = gameState.currentPlayer;
    // console.log("globalCurrentPlayer in initialize_web_sockets", globalCurrentPlayer);

}






