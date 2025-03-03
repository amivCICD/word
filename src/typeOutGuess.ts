import { appendGuess } from "./appendGuess";
import { arrayOfDivRows } from "./arrayOfDivRows";
import { checkIfWordInWordList } from "./checkIfWordInWordList";
import { fireOffConfetti } from "./fireOffConfetti";
import { RowGameState } from "./rowGameState.ts";
import { showFailureModal } from "./showFailureModal.ts";
import { GameOver } from "./gameOver.ts";
import { CheckCompletionStatus } from "./checkCompletionStatus.ts";
import { sendMessage, onMessage, getGameState, getPlayerState } from "./multiplayer/initialize_web_socket.ts";

const gameOver = GameOver.getInstance();
// const rowGameState = RowGameState.getInstance();
const checkCompletionStatus = CheckCompletionStatus.getInstance();

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
    console.log('DATA.TYPE FROM THE TOP\t', data.type);

    if (data.updateType === "backspace" && data.userInput === 'BACKSPACE') {
        if (state.letterCount >= 0 && state.letterCount < 5) {
            state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = "";
        } else if (state.letterCount === 5 || state.letterCount === 0) {
            return;
        }
    } else if (data.updateType === 'append') {
        // state.userInput = data.userInput; // 03 03 2025, is this necessary?
        if (state.letterCount <= 5 && state.rowLetterCount < 6) {
            state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = state.userInput;
        }
    } else if (data.updateType === "guessAttempt" && data.userInput === "ENTER") {
        if (state.letterCount === 5) {
            if (!checkIfWordInWordList(state.guess)) {
                handleWiggleAnimation(state.arrayOfRowArrays[state.row]);
                return;
            }
            await handleGuess(state, data, gameOver, checkCompletionStatus);
        }
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

    if (state.letterCount !== 5 && userInput === "ENTER") return; // enter key was ENTERING the guess...
    if (state.gameComplete || userInput === null) return;


    if (gameStateParam.reset) {
        resetGameState(state);
        await appendGuess(null, null, null, null, gameStateParam);
    }

    if (state.letterCount === 5 && userInput === "ENTER" && state.guess !== "ENTER") {
        console.log("state.wordOfTheDayLetters\t", state.wordOfTheDayLetters)
        sendMessage(JSON.stringify({
            type: "updateGameState",
            updateType: "guessAttempt",
            row: state.row,
            userInput: userInput,
            wordOfTheDay: wordOfTheDay,
            wordOfTheDayLetters: state.wordOfTheDayLetters,
            gameStateParam: gameStateParam,
            arrayOfRowArrays: state.arrayOfRowArrays,
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
        }));
        return;
    } else if (state.letterCount < 5 && userInput !== "BACKSPACE" && state.rowLetterCount < 5 && !state.userInput.includes("ENTER")) {
        state.rowGameState.incRowLetterCount();
        sendMessage(JSON.stringify({
            type: 'updateGameState',
            updateType: 'append',
            guess: state.guess + userInput,
            userInput: userInput,
            rowLetterCount: state.letterCount,
            letterCount: state.letterCount + 1,
            row: state.row,
            arrayOfRowArrays: state.arrayOfRowArrays
        }));
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

async function handleGuess(state, data, gameOver, checkCompletionStatus) {
    const newRow = await appendGuess(
        state.arrayOfRowArrays[state.row],
        state.guess,
        state.wordOfTheDay,
        state.wordOfTheDayLetters,
        data.gameStateParam
    );
    if (state.row !== 5) {
        console.log("newRow.incRow\t", newRow.incRow)
        console.log("newRow.restart\t", newRow.restart)
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
        checkCompletionStatus.setCompletedGame();
        console.log('You can now restart the game...');
        fireOffConfetti();
    }
    if (gameOver.getGameOverStatus()) {
        state.gameComplete = true;
        checkCompletionStatus.setCompletedGame();
        console.log("You did not get the word...fire off modal...");
        showFailureModal(newRow.wordOfTheDay);
    }
}
function resetGameState(state) {
        state.letterCount = 0;
        state.row = 0;
        state.guess = "";
        state.gameComplete = false;
}