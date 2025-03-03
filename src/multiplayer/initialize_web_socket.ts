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

let player = {
    username: null,
    userId: null,
    isCurrentPlayer: false,
    score: { letters: [] },
    // playerCount : [],
    // playerIsSet: false
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
        // const unameInfo = JSON.parse(localStorage.getItem("username"));
        // socket.send(JSON.stringify({ type: 'join', ...unameInfo }));
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
export function getPlayerState() {
    return allPlayers;
}

function updateGameState(data) {
    if (data.updateType === "backspace") {
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
    if (data.updateType === "append") {
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
    if (data.updateType === "setWOTD_and_params") {
        typeOutGuessGameState.wordOfTheDay = data.wordOfTheDay;
        typeOutGuessGameState.wordOfTheDayLetters = data.wordOfTheDayLetters;
        typeOutGuessGameState.gameState = data.gameState;
        // typeOutGuessGameState.arrayOfRowArrays = data.typeOutGuessGameState;
    }
    if (data.updateType === "wiggle") {
        // typeOutGuessGameState.userInput = "";
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

function updatePlayerState(data) {
    if (data.updateType === "setCurrentPlayer") {
        player = {
            username: data.username,
            userId: data.userId,
            // isCurrentUser: allPlayers.length === 0,
            isCurrentUser: data.isCurrentPlayer,
            score: { letters: [] },
            // score: { letters: [ ...playerState.score.letters, data.letter ].filter(i => i) },
            // playerCount: [
            //     ...playerState.playerCount,
            //     { username: data.username, userId: data.userId, isCurrentUser: playerState.isCurrentUser }
            // ],
        }
        allPlayers = [player];
        // allPlayers = allPlayers.length === 0 ? [player] : [...allPlayers, player];
        // allPlayers.push({...playerState});
    } else if (data.updateType === "addPlayer") {
        // const existingPlayer = allPlayers.find(player => player.userId === data.userId);
        // if (!existingPlayer) {
        // }
        // allPlayers = data.playerCount;
        // window.dispatchEvent(new Event("playerStateUpdated"));

        if (Array.isArray(data.playerCount)) {
            const incomingPlayers = JSON.stringify(data.playerCount)
            // console.log('incomingPlayers\t', incomingPlayers);

            const currentPlayers = JSON.stringify(allPlayers)
            // console.log('currentPlayers\t', currentPlayers);
            if (incomingPlayers !== currentPlayers) {
                allPlayers.length = 0;
                data.playerCount?.forEach((player) => {
                    allPlayers.push(player);
                });
                console.log("allPlayers FROM addPlayer updateType\t", allPlayers);
            }
            if (!allPlayers.find(player => player.isFirstPlayer === true)) {
                allPlayers[0].isFirstPlayer = true;

                const currentPlayer = allPlayers.find(player => player.isFirstPlayer);
                const userTurn = document.getElementById("userTurn");
                userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${currentPlayer.username}</div>`;
                console.log('SET PLAYERS PLAYER STATE', currentPlayer);
            }
            // allPlayers.length = 0;
        }

        const localUserInfo = localStorage.getItem("username");
        const userInfo = JSON.parse(localUserInfo);
        if (allPlayers) {
            const mySessionId = allPlayers.filter(player => player.userId === userInfo.userId.toString());
            // console.log("mySessionId\t", mySessionId);

        }

        // player = allPlayers.find(player => player.userId === data.userId);

        // if (!allPlayers?.some(player => player.userId === data.userId)) {
        //     allPlayers = [...allPlayers, {
        //         username: data.username,
        //         userId: data.userId,
        //         score: { letters: [] },
        //         isCurrentPlayer: data.isCurrentPlayer
        //     }];
        //     player = allPlayers.find(player => player.userId === data.userId);
        // }
        // playerState = {
        //     ...playerState,
        //     // isCurrentUser: playerState.playerCount.length === 0,
        //     playerCount: [ ...playerState.playerCount, { ...data.newPlayerInfo } ]
        // }
        // allPlayers.push({ ...data.newPlayerInfo });


    } else if (data.updateType === "removePlayer") {
        // playerState = {
        //     ...playerState,
        //     playerCount: playerState.playerCount.filter(user => user.userId !== data.userId)
        // }
        allPlayers?.filter(player => player.userId !== data.userId);
    } else if (data.updateType === "updatePlayerScore") {
        // playerState = {
        //     ...playerState,
        //     score: { letters: [ ...playerState.score.letters, data.letter ] }
        // }
        allPlayers = allPlayers?.map(player =>
            player.userId === data.userId ? { ...player, score: { letters: [...player.score.letters, data.letter]}} : player);
    } else if (data.updateType === "swapCurrentPlayer") {
        // playerState = {
        //     username: data.username,
        //     userId: data.userId,
        //     isCurrentUser: true,
        //     score: { letters: [ ...playerState.score.letters, data.letter ] },
        //     playerCount: playerState.playerCount
        // }
    } else if (data.updateType === "getAllPlayers") {

    } else if (data.updateType === "checkForTwoPlayers") {
        if (allPlayers.length === 2) {
            console.log("playerState is 2 or more, do coin flip");
            allPlayers[data.randomPlayerChoice].isCurrentPlayer = true;
            // playerState = { ...playerState, playerIsSet: true };
            // console.log("THIS PLAYER HAS BEEN ASSIGNED TO GO FIRST\t", allPlayers[data.randomPlayerChoice]);
        } else {
            console.log("THERE IS ONLY ONE PLAYER READY TO PLAY");
        }
    }
}
onMessage((e) => {
    const data = JSON.parse(e);
    if (data.updateType === "setCurrentPlayer") {
        // console.log('playerState\t', playerState)
    } else if (data.updateType === "addPlayer") {
        // console.log('playerState AFTER INC PLAYER COUNT\t', playerState);
        console.log("ALL PLAYERS ARRAY AFTER ADD PLAYER\t", allPlayers);
        const localUserInfo = localStorage.getItem("username");
        const userInfo = JSON.parse(localUserInfo);




    } else if (data.updateType === "removePlayer") { // whoever sees two players first?
        console.log('playerState AFTER REMOVE PLAYER \t', player);

    } else if (data.updateType === "checkForTwoPlayers" && allPlayers.length >= 2) {
        // if (!playerState.playerIsSet) {
        //     const flipDecision = Math.floor(Math.random() * playerState.playerCount.length);
        //     let currentPlayer = playerState.playerCount[flipDecision];
        //     currentPlayer.isCurrentUser = true;
        //     const userTurn = document.getElementById("userTurn");
        //     userTurn.innerHTML = `<div class="text-xl text-black font-bold flex flex-col">${currentPlayer.username}</div>`;
        //     console.log('SET PLAYERS PLAYER STATE', playerState);
        // }
        const currentPlayer = allPlayers.filter(player => player.isCurrentPlayer === true);


    }
});

// let playerState = {
//     username: null,
//     userId: null,
//     score: { letters: [] },
//     isCurrentPlayer: false
// }


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

