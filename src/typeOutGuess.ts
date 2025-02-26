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
let letterCount: number = 0;
let row: number = 0;
let guess: string = "";

let arrayOfRowArrays = arrayOfDivRows();
let mainTainer = document.getElementById("mainTainer");

onMessage((messageData) => {
    const state = getGameState();
    const data = JSON.parse(messageData);
    console.log("DATA")
    if (data.userInput === 'BACKSPACE' || data.type === "backspace") {
        if (state.rowLetterCount > 0) {
            console.log('arrayOfRowArrays\t', arrayOfRowArrays)
            arrayOfRowArrays[state.row][state.rowLetterCount-1].innerHTML = "";
        } else if (state.letterCount === 0) {
            return;
        } else if (state.letterCount === 5 || state.letterCount === 0) {
            return;
        }
    }

});
onMessage((messageData) => {
    const state = getGameState();
    const data = JSON.parse(messageData);
    console.log("DATA TYPE IN APPEND\t", data.type)
    if (data.type === 'append' && data.userInput !== "BACKSPACE" && data.type !== "backspace") {
        if (state.letterCount < 5) {
            // for (let i=0; i<state.userInput.length; i++) {
            //     let div = document.createElement('div');
            //     div.textContent = state.userInput;
            //     div.classList.add('word-row2');
            //     mainTainer?.replaceChild(div, arrayOfRowArrays[state.row][state.letterCount]);
            // }
            arrayOfRowArrays[state.row][state.letterCount].innerHTML = state.userInput;
        }
        // arrayOfRowArrays[row][data.letterCount].innerHTML = data.userInput;
    } else {
        return;
    }
});
onMessage((messageData) => {
    const state = getGameState();
    const data = JSON.parse(messageData);
    console.log("DATA TYPE IN APPEND\t", data.type)
    if (data.type !== 'append' && data.userInput !== "BACKSPACE" && data.type !== "backspace" && data.userInput === "ENTER") {
        if (state.letterCount === 5) {

        }

    } else {
        return;
    }
});


let gameComplete;
export async function typeOutGuess(
    userInput: string,
    gameState: boolean,
    wordOfTheDay: string,
    wordOfTheDayLetters: string[],
): Promise<void> {

    console.log('wordOfTheDay\t', wordOfTheDay);
    console.log('rowGameState.getRowLetterCount()\t', rowGameState.getRowLetterCount());
    // sendMessage(JSON.stringify({ type: 'none', userInput: userInput }));

    if (gameState.reset) {
        letterCount = 0;
        row = 0;
        guess = "";
        await appendGuess(null, null, null, null, gameState);
        gameComplete = false;
    }

    if (gameComplete) return;
    if (userInput === null) return;
    if (letterCount === 5 && userInput === "ENTER") {
        if (!checkIfWordInWordList(guess)) {
            arrayOfRowArrays[row].forEach((row) => {
                row.classList.add('animate-wiggle');
            });
            await new Promise((res) => setTimeout(res, 750));
            arrayOfRowArrays[row].forEach((row) => {
                row.classList.remove('animate-wiggle');
            });
            return;
        }
        const newRow = await appendGuess(arrayOfRowArrays[row], guess, wordOfTheDay, wordOfTheDayLetters, gameState);
        if (row !== 5) {
            arrayOfRowArrays[row+1][0].innerHTML = "";
            row = newRow.incRow;
            letterCount = 0;
            rowGameState.startFromZero();
            guess = "";
        }
        if (newRow.restart) {
            gameComplete = true;
            checkCompletionStatus.setCompletedGame();
            console.log('You can now restart the game...');
            fireOffConfetti();
        }
        if (gameOver.getGameOverStatus()) {
            gameComplete = true;
            checkCompletionStatus.setCompletedGame();
            console.log("You did not get the word...fire off modal...");
            showFailureModal(newRow.wordOfTheDay);
        }
        return;
    } else if (letterCount < 5 && userInput === "ENTER") {
        return;
    }
    // else if (userInput.length > 1) {
    //     return;
    // }

    if (userInput === "BACKSPACE" && letterCount !== 0) {
        // arrayOfRowArrays[row][letterCount-1].innerHTML = "";

        // guess = guess.slice(0, guess.length - 1);
        // letterCount--;
        // rowGameState.decRowLetterCount();
        sendMessage(JSON.stringify({
            type: 'backspace',
            userInput: "BACKSPACE",
            guess: guess.slice(0, guess.length - 1),
            rowLetterCount: letterCount,
            row: row,
            letterCount: letterCount--,
            arrayOfRowArrays: arrayOfRowArrays,
            inputId: Math.random().toString().slice(2)
        }));




        if (letterCount === 0) {
            return;
        }
        return;
    }
    if (letterCount === 5 || letterCount === 0 && userInput === "BACKSPACE") { // boundaries
        return;
    }




    guess += userInput;
    // arrayOfRowArrays[row][letterCount].innerHTML = userInput;

    sendMessage(JSON.stringify({
        type: 'append',
        guess: guess,
        userInput: userInput,
        rowLetterCount: rowGameState.getRowLetterCount(),
        letterCount: letterCount,
        row: row,
        arrayOfRowArrays: arrayOfRowArrays,
        inputId: Math.random().toString().slice(2)
    }));

    // ++letterCount;
    letterCount++;
    rowGameState.incRowLetterCount();






}