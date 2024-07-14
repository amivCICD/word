import { appendGuess } from "./appendGuess";
import { arrayOfDivRows } from "./arrayOfDivRows";
import { checkIfWordInWordList } from "./checkIfWordInWordList";
import { fireOffConfetti } from "./fireOffConfetti";
import { RowGameState } from "./rowGameState.ts";
import { showFailureModal } from "./showFailureModal.ts";




const rowGameState = RowGameState.getInstance();
let letterCount: number = 0;
let row: number = 0;
let guess: string = "";

const arrayOfRowArrays = arrayOfDivRows();


let gameComplete;
export async function typeOutGuess(userInput: string, gameState: boolean, wordOfTheDay: string, wordOfTheDayLetters: string[]): Promise<void> {
    console.log('wordOfTheDay\t', wordOfTheDay);
    console.log('rowGameState.getRowLetterCount()\t', rowGameState.getRowLetterCount());


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
            console.log('You can now restart the game...');
            fireOffConfetti();
        }
        if (newRow.failure) {
            gameComplete = true;
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
        arrayOfRowArrays[row][letterCount-1].innerHTML = "";
        guess = guess.slice(0, guess.length - 1);
        letterCount--;
        rowGameState.decRowLetterCount();
        if (letterCount === 0) {
            return;
        }
        return;
    }
    if (letterCount === 5 || letterCount === 0 && userInput === "BACKSPACE") { // boundaries
        return;
    }
    guess += userInput;
    arrayOfRowArrays[row][letterCount].innerHTML = userInput;
    letterCount++;
    rowGameState.incRowLetterCount();
}