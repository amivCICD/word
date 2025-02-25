import { appendGuess } from "./appendGuess";
import { arrayOfDivRows } from "./arrayOfDivRows";
import { checkIfWordInWordList } from "./checkIfWordInWordList";
import { fireOffConfetti } from "./fireOffConfetti";
import { RowGameState } from "./rowGameState.ts";
import { showFailureModal } from "./showFailureModal.ts";
import { GameOver } from "./gameOver.ts";
import { CheckCompletionStatus } from "./checkCompletionStatus.ts";
import { sendMessage, onMessage } from "./multiplayer/initialize_web_socket.ts";


const gameOver = GameOver.getInstance();
const rowGameState = RowGameState.getInstance();
const checkCompletionStatus = CheckCompletionStatus.getInstance();
let letterCount: number = 0;
let row: number = 0;
let guess: string = "";

const arrayOfRowArrays = arrayOfDivRows();


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

        guess = guess.slice(0, guess.length - 1);
        letterCount--;
        rowGameState.decRowLetterCount();

        sendMessage(JSON.stringify({ type: 'backspace', backspace: true, value: "", rowLetterCount: rowGameState.getRowLetterCount() + 1, letterCount: letterCount }));
        onMessage((messageData) => {
            const data = JSON.parse(messageData);
            console.log('data.letterCount\t', data.rowLetterCount)
            if (data.type === 'backspace' && data.rowLetterCount !== 0) {
                arrayOfRowArrays[row][data.rowLetterCount-1].innerHTML = data.value;
            } else if (data.letterCount === -1) {
                return;
            }
        });
        if (letterCount === 0) {
            return;
        }
        return;
    }
    if (letterCount === 5 || letterCount === 0 && userInput === "BACKSPACE") { // boundaries
        return;
    }
    sendMessage(JSON.stringify({ type: 'append', guess: guess, userInput: userInput, letterCount: rowGameState.getRowLetterCount() }));
    onMessage((messageData) => {
        const data = JSON.parse(messageData);
        if (data.type === 'append') {
            arrayOfRowArrays[row][data.letterCount].innerHTML = data.userInput;
        } else {
            return;
        }
    });

    guess += userInput;
    // arrayOfRowArrays[row][letterCount].innerHTML = userInput;

    // ++letterCount;
    letterCount++;
    rowGameState.incRowLetterCount();


}