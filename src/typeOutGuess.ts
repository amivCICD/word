import { appendGuess } from "./appendGuess";
import { arrayOfDivRows } from "./arrayOfDivRows";
import { checkIfWordInWordList } from "./checkIfWordInWordList";
import { fireOffConfetti } from "./fireOffConfetti";
import { RowGameState } from "./rowGameState.ts";
import { showFailureModal } from "./showFailureModal.ts";
import { GameOver } from "./gameOver.ts";
import { CheckCompletionStatus } from "./checkCompletionStatus.ts";
import { sendMessage, onMessage, getGameState } from "./multiplayer/initialize_web_socket.ts";


const gameOver = GameOver.getInstance();
const rowGameState = RowGameState.getInstance();
const checkCompletionStatus = CheckCompletionStatus.getInstance();
// let letterCount: number = 0;
// let row: number = 0;
// let guess: string = "";

let arrayOfRowArrays;
document.addEventListener("DOMContentLoaded", e => {
    arrayOfRowArrays = arrayOfDivRows();
});

let gameComplete = false;
export async function typeOutGuess(
    userInput: string,
    gameStateParam: boolean,
    wordOfTheDay: string,
    wordOfTheDayLetters: string[],
): Promise<void> {
    // if (!window.WEB_SOCKET_READY) return;
    const state = getGameState();
    state.rowGameState = rowGameState;

    onMessage(async (messageData) => {
        state.arrayOfRowArrays = arrayOfRowArrays;
        state.wordOfTheDay = wordOfTheDay;
        state.wordOfTheDayLetters = wordOfTheDayLetters;
        state.gameComplete = gameComplete;

        const data = JSON.parse(messageData);
        console.log("DATA\t", data)
        console.log('DATA.TYPE FROM THE TOP\t', data.type)
        if (data.userInput === 'BACKSPACE' && data.type === "backspace") {
            if (state.letterCount >= 0 && state.letterCount < 5) {
                state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = "";
            } else if (state.letterCount === 5 || state.letterCount === 0) {
                return;
            }
        } else if (data.type === 'append') {

            if (state.letterCount <= 5 && state.rowLetterCount < 6) {
                state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = state.userInput;
            }
        } else if (data.type === 'wiggle' && data.userInput === "ENTER") {
            if (state.letterCount === 5) {
                if (!checkIfWordInWordList(state.guess)) {
                    state.arrayOfRowArrays[state.row].forEach((row) => {
                        row.classList.add('animate-wiggle');
                    });
                    setTimeout(() => {
                        state.arrayOfRowArrays[state.row].forEach((row) => {
                            row.classList.remove('animate-wiggle');
                        });
                    }, 750);
                    return;
                } else if (checkIfWordInWordList(state.guess)) {
                    const newRow = await appendGuess(
                        state.arrayOfRowArrays[state.row],
                        state.guess,
                        state.wordOfTheDay,
                        state.wordOfTheDayLetters,
                        gameStateParam
                    );
                    if (state.row !== 5) {
                        state.arrayOfRowArrays[state.row+1][0].innerHTML = "";
                        state.row = newRow.incRow;
                        state.letterCount = 0;
                        state.rowGameState.startFromZero();
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
                    return;
                }
            }
        }
    });

    if (gameStateParam.reset) {
        state.letterCount = 0;
        state.row = 0;
        state.guess = "";
        await appendGuess(null, null, null, null, gameStateParam);
        state.gameComplete = false;
    }

    if (state.gameComplete) return;
    if (userInput === null) return;

    if (state.letterCount === 5 && userInput === "ENTER") {
        sendMessage(JSON.stringify({
            type: "wiggle",
            row: state.row,
            userInput: userInput,
            wordOfTheDay: wordOfTheDay,
            wordOfTheDayLetters: wordOfTheDayLetters,
            gameStateParam: gameStateParam,
            rowGameState: rowGameState
        }));
    } else if (userInput === "BACKSPACE" && state.letterCount !== 0) {
        state.rowGameState.decRowLetterCount();
        console.log("USER INPUT\t", userInput);
        sendMessage(JSON.stringify({
            type: 'backspace',
            userInput: "BACKSPACE",
            row: state.row,
            guess: state.guess.slice(0, state.guess.length - 1),
            rowLetterCount: state.letterCount - 1,
            letterCount: state.letterCount - 1,
            arrayOfRowArrays: state.arrayOfRowArrays,
        }));
        return;
    } else if (state.letterCount < 5 && userInput !== "BACKSPACE" && state.rowLetterCount < 5) {
        console.log("USER INPUT\t", userInput);
        state.rowGameState.incRowLetterCount();
        sendMessage(JSON.stringify({
            type: 'append',
            guess: state.guess + userInput,
            userInput: userInput,
            rowLetterCount: state.letterCount,
            letterCount: state.letterCount + 1,
            row: state.row,
            arrayOfRowArrays: state.arrayOfRowArrays
        }));
    }

    // else if (letterCount < 5 && userInput === "ENTER") {
    //     return;
    // }
    // else if (userInput.length > 1) {
    //     return;
    // }


    // if (letterCount === 5 || letterCount === 0 && userInput === "BACKSPACE") { // boundaries
    //     return;
    // }
    // guess += userInput;
    // // arrayOfRowArrays[row][letterCount].innerHTML = userInput;

    // // ++letterCount;
    // letterCount++;
    // rowGameState.incRowLetterCount();








}