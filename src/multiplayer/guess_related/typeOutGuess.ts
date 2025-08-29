import { appendGuess } from "./appendGuess.ts";
import { arrayOfDivRows } from "../helper_functions/arrayOfDivRows.ts";
import { checkIfWordInWordList } from "../../checks/checkIfWordInWordList.ts";
import { handleWiggleAnimation } from "../../ui_handlers/handleWiggleAnimation.ts";
import { sendMessage, onMessage, getGameState, getPlayerState } from "../socket_related/initialize_web_socket.ts";
import { getLocalCurrentUser } from "../helper_functions/getLocalCurrentUser.ts";
import { handleGuess } from "./handleGuess.ts";


let arrayOfRowArrays;

document.addEventListener("DOMContentLoaded", () => {
    arrayOfRowArrays = arrayOfDivRows();
});
document.addEventListener("websocket-ready", () => {
    onMessage(async (messageData) => {
        const state = getGameState();
        state.arrayOfRowArrays = arrayOfRowArrays;
        const data = JSON.parse(messageData);
        if (data.updateType === "backspace" && data.userInput === 'BACKSPACE') {
            if (state.letterCount >= 0 && state.letterCount < 5) {
                state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = "";
                // syncMatrixArrayToServer(state);
                syncWordRowArrayState(state);
            } else if (state.letterCount === 5 || state.letterCount === 0) {
                return;
            }
        } else if (data.updateType === 'append') {
            if (state.letterCount <= 5 && state.rowLetterCount < 6) {
                state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = state.userInput;
                // syncMatrixArrayToServer(state);
                syncWordRowArrayState(state);

            }
        } else if (data.updateType === "guessAttempt" && data.userInput === "ENTER") {
            if (state.letterCount === 5) {
                if (!checkIfWordInWordList(state.guess)) {
                    handleWiggleAnimation(state.arrayOfRowArrays[state.row]);
                    return;
                }
                await handleGuess(state, data, state.gameOver, state.checkCompletionStatus)
                    .then(() => {
                        state.wordRowArrayState.forEach((row, rowIdx) => {
                            row.forEach((col, colIdx) => {
                                if (state.arrayOfRowArrays[rowIdx][colIdx]?.innerHTML === "") {
                                    return;
                                }
                                col.class = state.arrayOfRowArrays[rowIdx][colIdx]?.className || "";
                                col.value = state.arrayOfRowArrays[rowIdx][colIdx]?.innerHTML || "";
                            })
                        })
                        syncNewCss(state.wordRowArrayState);
                    })
                    .then(() => {
                        swapPlayersFrontEnd(state, false, null);
                    })
                    .catch((e) => console.log(`Error for setting sync word array state in guess attempt\t${e}`));

            }
        }
    });
});

let gameComplete = false;
export async function typeOutGuess(
    userInput: string,
    gameStateParam: boolean,
    wordOfTheDay: string,
    wordOfTheDayLetters: string[],
): Promise<void> {

    const state = getGameState();
    const playerState = getPlayerState();
    // state.rowGameState = rowGameState;
    state.wordOfTheDayLetters = wordOfTheDayLetters;
    // who passes type out guess its stuff?
    console.log("wordOfTheDay in typeOutGuess.ts\t", wordOfTheDay)

    if (gameStateParam.reset) {
        const currentUser = getLocalCurrentUser();
        console.log("WE HIT THE gameStateParam.reset in typeOutGuess.ts")
        // if (state.currentUser.userId === currentUser.userId.toString()) { // YES but then it doesnt reset the others state, only issue is really the word of the day matching...get from server...
            // sendMessage(JSON.stringify({
            //     type: "updateGameState",
            //     updateType: "resetGameState",
            //     resetGameState: gameStateParam,
            //     wordOfTheDay: wordOfTheDay,
            //     wordOfTheDayLetters: wordOfTheDayLetters,
            //     reset: gameStateParam.reset,
            //     gameComplete: false
            // }));
        // }
        await appendGuess(null, null, null, null, gameStateParam.reset);
    }

    // state.resetGameState = new ResetGameState(data.reset, data.wordOfTheDay);
    //         state.wordOfTheDay = data.wordOfTheDay;
    //         state.wordOfTheDayLetters = data.wordOfTheDayLetters;

    if (state.letterCount !== 5 && userInput === "ENTER") return; // enter key was ENTERING the guess...
    if (state.gameOver.getGameOverStatus() || userInput === null) return; // test...
    // if (state.gameComplete || userInput === null) return; // test...


    if (state.letterCount === 5 && userInput === "ENTER" && state.guess !== "ENTER") {
        sendMessage(JSON.stringify({
            type: "updateGameState",
            updateType: "guessAttempt",
            row: state.row,
            userInput: userInput,
            wordOfTheDay: wordOfTheDay,
            wordOfTheDayLetters: state.wordOfTheDayLetters,
            gameStateParam: gameStateParam.reset,
            arrayOfRowArrays: state.arrayOfRowArrays,
            letterCount: state.letterCount,
            wordRowArrayState: state.wordRowArrayState
        }));
    } else if (userInput === "BACKSPACE" && state.letterCount !== 0) {
        state.rowGameState.decRowLetterCount();
        sendMessage(JSON.stringify({
            type: 'updateGameState',
            updateType: 'backspace',
            userInput: "BACKSPACE",
            row: state.row,
            guess: state.guess.slice(0, state.guess.length - 1),
            rowLetterCount: state.letterCount - 1,
            letterCount: state.letterCount - 1,
            arrayOfRowArrays: state.arrayOfRowArrays,
            matrixArray: state.matrixArray
        }));
        return;
    } else if (state.letterCount < 5 && userInput !== "BACKSPACE" && state.rowLetterCount < 5 && !state.userInput.includes("ENTER")) {
        state.rowGameState.incRowLetterCount();
        sendMessage(JSON.stringify({
            type: 'updateGameState',
            updateType: 'append',
            userInput: userInput,
            row: state.row,
            guess: state.guess + userInput,
            rowLetterCount: state.letterCount,
            letterCount: state.letterCount + 1,
            arrayOfRowArrays: state.arrayOfRowArrays,
            matrixArray: state.matrixArray
        }));
    }
}

export function syncWordRowArrayState(state) { // to append and backspace
    sendMessage(JSON.stringify({ // send to server
        type: "syncWordRowArrayState",
        // updateType: "syncMatrix",
        wordRowArrayState: JSON.stringify(state.wordRowArrayState),
        // gameState: JSON.stringify(state), // new // overloads server, w/out TEXT PARTIAL WRITING
        // incRow: JSON.stringify(state.incRow) // disable for now....03 27 2025
    }));
}

export function syncNewCss(updatedWordRowArrayState: [][]) { // in then()
    sendMessage(JSON.stringify({
        type: "syncWordRowArrayState",
        wordRowArrayState: JSON.stringify(updatedWordRowArrayState)
    }));
}

export function swapPlayersFrontEnd(state, playerHasLeft: boolean, playerHasLeftData) {
    // console.log("state.incRow in swapPlayersFrontEnd()\t", state.incRow);
    let players = getPlayerState();
    if (playerHasLeft) {
        let indexOfLeaver = players.findIndex(player => player.userId === playerHasLeftData.userId);
        let nextIndex = (indexOfLeaver + 1) % players.length;
        players.splice(indexOfLeaver, 1);
        if (players.length > 0) {
            if (nextIndex >= players.length) nextIndex = 0;
            players[nextIndex].isFirstPlayer = true;
            console.log("players[nextIndex]\t", players[nextIndex]);
        }
    }

    const localUserInfo = JSON.parse(localStorage.getItem("username"));
    const localUserId = localUserInfo.userId.toString();

    if (players.length > 1) {
        let cp = players.find(player => player.isFirstPlayer);
        if (!cp) return;

        let currentPlayerIndex = players.indexOf(cp);
        let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

        players[currentPlayerIndex].isFirstPlayer = false;
        players[nextPlayerIndex].isFirstPlayer = true;

        const currentPlayer = players[nextPlayerIndex]; // new next player
        const nextPlayer = players[currentPlayerIndex]; // player after..
        // state.currentPlayer = currentPlayer; // we need to set state.currentPlayer perhaps in onMessage, so it updates, because incRow is not updating for state.currentPlayer...

        if (cp.userId === localUserId) { // ??
            sendMessage(JSON.stringify({
                type: "updatePlayerState",
                updateType: "nextPlayer",
                currentPlayer: JSON.stringify(currentPlayer),
                nextPlayer: JSON.stringify(nextPlayer),
                incRow: JSON.stringify(state.incRow)
                // incRow: state.incRow
            }));
        }
    } else if (players.length === 1) {
        console.log("Only player left\t", players[0])
        if (players[0].userId === localUserId) {
            sendMessage(JSON.stringify({
                type: "updatePlayerState",
                updateType: "nextPlayer",
                currentPlayer: JSON.stringify(players[0]),
                nextPlayer: JSON.stringify(players[0]),
                incRow: JSON.stringify(state.incRow)
                // incRow: state.incRow
            }));
        }
    }

}

function resetGameState(state) {
        state.letterCount = 0;
        state.row = 0;
        state.guess = "";
        state.gameComplete = false;
        // state.userInput = "";
}

function syncMatrixArrayToServer(state) {
    sendMessage(JSON.stringify({ // send to server
        type: "syncMatrixArray",
        matrixArray: JSON.stringify(state.matrixArray)
    }));
    // console.log("JSON.stringify(state.matrixArray) inside syncMatrixArray()\t", JSON.stringify(state.matrixArray));
}

function updateServerGameState(state, updateType) { // unused as of 03 27 2025
    sendMessage(JSON.stringify({
        type: "updateServerGameState",
        updateType: updateType,
        gameState: state
    }));
}

function gameCompleteClearServerCache() {
    sendMessage(JSON.stringify({
        type: "gameComplete",
        updateType: "resetPlayerServerState"
    }));
}