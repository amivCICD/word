import { appendGuess } from "./appendGuess";
import { arrayOfDivRows } from "./arrayOfDivRows";
import { checkIfWordInWordList } from "./checkIfWordInWordList";
import { fireOffConfetti } from "./fireOffConfetti";
import { RowGameState } from "./rowGameState.ts";
import { showFailureModal } from "./showFailureModal.ts";
import { GameOver } from "./gameOver.ts";
import { CheckCompletionStatus } from "./checkCompletionStatus.ts";
import { sendMessage, onMessage, getGameState, getPlayerState, getCurrentArrowOfRowArrays } from "./multiplayer/initialize_web_socket.ts";


let arrayOfRowArrays;
document.addEventListener("DOMContentLoaded", e => {
    arrayOfRowArrays = arrayOfDivRows();
});

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
                    swapPlayersFrontEnd(state);
                })
                .catch((e) => console.log(`Error for setting sync word array state in guess attempt\t${e}`));

        }
    } else if (data.updateType === "resetGameState") { // we have resetGameState in initialize_web_sockets.ts
        // resetGameState(state);
        console.log("we hit the data.updateType in our onmessage in typeoutGuess.ts")
    }
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
    state.wordOfTheDayLetters = wordOfTheDayLetters

    if (gameStateParam.reset) {
        sendMessage(JSON.stringify({
            type: "updateGameState",
            updateType: "resetGameState",
            resetGameState: gameStateParam,
            wordOfTheDay: wordOfTheDay,
            wordOfTheDayLetters: wordOfTheDayLetters,
            reset: gameStateParam.reset,
            gameComplete: false
        }));
        await appendGuess(null, null, null, null, gameStateParam);
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
            gameStateParam: gameStateParam,
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

async function handleGuess(state, data, gameOver, checkCompletionStatus) {
    const newRow = await appendGuess(
        state.arrayOfRowArrays[state.row],
        state.guess,
        state.wordOfTheDay,
        state.wordOfTheDayLetters,
        data.gameStateParam
    );
    if (state.row !== 5) {
        state.arrayOfRowArrays[state.row+1][0].innerHTML = "";
        state.row = newRow.incRow;
        state.letterCount = 0;
        state.rowGameState.startFromZero();
        state.userInput = ""; // this fixed it for now 03 03 2025
        state.guess = "";
    }
    if (newRow.restart) {
        state.gameComplete = true;
        state.checkCompletionStatus.setCompletedGame();
        console.log('You can now restart the game...');
        fireOffConfetti();
    }
    if (gameOver.getGameOverStatus()) {
        state.gameComplete = true;
        checkCompletionStatus.setCompletedGame();
        console.log("You did not get the word...fire off modal...");
        showFailureModal(state.wordOfTheDay);
        state.userInput = "";
    }
}

function handleWiggleAnimation(row) {
    row.forEach((r) => {
        r.classList.add('animate-wiggle');
    });
    setTimeout(() => {
        row.forEach((r) => {
            r.classList.remove('animate-wiggle');
        });
    }, 750);
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
    console.log("JSON.stringify(state.matrixArray) inside syncMatrixArray()\t", JSON.stringify(state.matrixArray))
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

function swapPlayersFrontEnd(state) {
    console.log("state.incRow in swapPlayersFrontEnd()\t", state.incRow);
    const players = getPlayerState();
    const cp = players.find(player => player.isFirstPlayer);
    // const state = getGameState();
    let currentPlayerIndex = players.indexOf(players.find(player => player.isFirstPlayer === true));
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    players[currentPlayerIndex].isFirstPlayer = false;
    players[nextPlayerIndex].isFirstPlayer = true;

    const currentPlayer = players[nextPlayerIndex]; // new next player
    const nextPlayer = players[currentPlayerIndex]; // player after..
    // state.currentPlayer = currentPlayer; // we need to set state.currentPlayer perhaps in onMessage, so it updates, because incRow is not updating for state.currentPlayer...

    const localUser = localStorage.getItem("username");
    const localUserInfo = JSON.parse(localUser);
    const localUserId = localUserInfo.userId.toString();
    console.log("localUserId\t", localUserId);
    console.log("currentPlayer + userId\t", cp, cp.userId);


    if (cp.userId === localUserId) {

        sendMessage(JSON.stringify({
            type: "updatePlayerState",
            updateType: "nextPlayer",
            currentPlayer: JSON.stringify(currentPlayer),
            nextPlayer: JSON.stringify(nextPlayer),
            incRow: JSON.stringify(state.incRow)
            // incRow: state.incRow
        }));
    }
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