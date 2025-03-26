import { appendGuess } from "./appendGuess";
import { arrayOfDivRows } from "./arrayOfDivRows";
import { checkIfWordInWordList } from "./checkIfWordInWordList";
import { fireOffConfetti } from "./fireOffConfetti";
import { RowGameState } from "./rowGameState.ts";
import { showFailureModal } from "./showFailureModal.ts";
import { GameOver } from "./gameOver.ts";
import { CheckCompletionStatus } from "./checkCompletionStatus.ts";
import { sendMessage, onMessage, getGameState, getPlayerState, getCurrentArrowOfRowArrays } from "./multiplayer/initialize_web_socket.ts";

// const gameOver = GameOver.getInstance();
// const rowGameState = RowGameState.getInstance();
// const checkCompletionStatus = CheckCompletionStatus.getInstance();

let arrayOfRowArrays;
document.addEventListener("DOMContentLoaded", e => {
    arrayOfRowArrays = arrayOfDivRows();
});

onMessage(async (messageData) => {
    const state = getGameState();

    state.arrayOfRowArrays = arrayOfRowArrays;
    // state.wordOfTheDay = wordOfTheDay;
    // state.wordOfTheDayLetters = wordOfTheDayLetters;
    // state.gameComplete = gameComplete;

    const data = JSON.parse(messageData);
    // console.log('DATA.TYPE FROM THE TOP\t', data.type);

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
                    // console.log("FOCUSED FOCUSED state.wordRowArrayState\t", state.wordRowArrayState);
                    // console.log("@@@@@@@@@@ state.arrayOfRowArrays in THEN() @@@@@@@@@@@@\t", state.arrayOfRowArrays);

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
                    // swap to next player
                })
                .then(() => {
                    swapPlayersFrontEnd(); // commented in 03 25 2025 - changed type "updatePlayerState" on this function to swapPlayer, as I believe it was overloading the websockets TEXT_PARTIAL_WRITING
                })
                // .then(() => {
                //     const players = getPlayerState();
                //     const currentPlayer = players.find(player => player.isFirstPlayer === true);
                //     const localCurrentPlayer = localStorage.getItem("username");
                //     const localUserData = JSON.parse(localCurrentPlayer);
                //     if (localUserData.userId.toString() === currentPlayer.userId) {
                //         console.log("localUserData.userId.toString() === currentPlayer.userId\t", localUserData.userId.toString() === currentPlayer.userId);
                //         swapToNextPlayer();
                //     }
                // })
                .catch((e) => console.log(`Error for setting sync word array state in guess attempt\t${e}`));

        }
    } else if (data.updateType === "resetGameState") {
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

    // console.log("gameStateParam.reset in typeOutGuess IF statement\t", gameStateParam.reset);
    if (gameStateParam.reset) {
        // resetGameState(state);
        sendMessage(JSON.stringify({
            type: "updateGameState",
            updateType: "resetGameState",
            resetGameState: gameStateParam,
            wordOfTheDay: wordOfTheDay,
            wordOfTheDayLetters:
            wordOfTheDayLetters,
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
        // console.log("state.wordOfTheDayLetters\t", state.wordOfTheDayLetters);
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
        // console.log("newRow.incRow\t", newRow.incRow);
        // console.log("newRow.restart\t", newRow.restart);
        // rowGameState.startFromZero();
        state.arrayOfRowArrays[state.row+1][0].innerHTML = "";
        state.row = newRow.incRow;
        state.letterCount = 0;
        state.rowGameState.startFromZero();
        state.userInput = ""; // this fixed it for now 03 03 2025
        // state.rowGameState = 0;
        state.guess = "";


    }
    if (newRow.restart) {
        state.gameComplete = true;
        state.checkCompletionStatus.setCompletedGame();
        console.log('You can now restart the game...');
        // resetGameState(state);
        fireOffConfetti();
    }
    // if (gameOver.getGameOverStatus()) {
    if (gameOver.getGameOverStatus()) {
        state.gameComplete = true;
        checkCompletionStatus.setCompletedGame();
        console.log("You did not get the word...fire off modal...");
        // resetGameState(state);
        showFailureModal(state.wordOfTheDay);
        state.userInput = "";
        // state.gameOver.setGameOverFalse(); // perhaps?

    }
    // const currentRowArrayState = getCurrentArrowOfRowArrays();
    // console.log("currentRowArrayState\t", currentRowArrayState);

    // state.arrayOfRowArrays = currentRowArrayState;
    // console.log("state.arrayOfRowArrays\t", state.arrayOfRowArrays);
    // syncWordRowArrayState(state); // this was BACKTRACKING, we have the letters without this, just not the CSS, this makes no letters...
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
        wordRowArrayState: JSON.stringify(state.wordRowArrayState)
    }));
    // console.log("JSON.stringify(state.wordRowArrayState)\t", JSON.stringify(state.wordRowArrayState));
}

export function syncNewCss(updatedWordRowArrayState: [][]) { // to append and backspace
    sendMessage(JSON.stringify({ // send to server
        type: "syncWordRowArrayState",
        wordRowArrayState: JSON.stringify(updatedWordRowArrayState)
    }));
    // console.log("JSON.stringify(state.wordRowArrayState)\t", JSON.stringify(updatedWordRowArrayState));
}

export function swapToNextPlayer() {
    // console.log("Swap to next player() was called");
    // console.trace();
    sendMessage(JSON.stringify({ // send to server
        // type: "updatePlayerState",
        type: "updatePlayerState",
        updateType: "swapToNextPlayer",
        // wordRowArrayState: JSON.stringify(updatedWordRowArrayState)
    }));
}

function swapPlayersFrontEnd() {
    const players = getPlayerState();
    let currentPlayerIndex = players.indexOf(players.find(player => player.isFirstPlayer === true));
    const currentPlayer = players[currentPlayerIndex];
    // players[currentPlayerIndex].isFirstPlayer = false;
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    const nextPlayer = players[nextPlayerIndex];

    sendMessage(JSON.stringify({
        // type: "updatePlayerState",
        type: "updatePlayerState",
        updateType: "nextPlayer",
        currentPlayer: JSON.stringify(currentPlayer),
        nextPlayer: JSON.stringify(nextPlayer)
    }));
}

export function updateServerGameState(state, updateType) {
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