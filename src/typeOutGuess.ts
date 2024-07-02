import { appendGuess } from "./appendGuess";
import { arrayOfDivRows } from "./arrayOfDivRows";
import { checkIfWordInWordList } from "./checkIfWordInWordList";


let letterCount: number = 0;
let row: number = 0;
let guess: string = "";
let guessAsArray = [];
const arrayOfRowArrays = arrayOfDivRows();
export async function typeOutGuess(userInput: string): Promise<void> {
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
            console.log('not in word list');
            return;
        }
        const newRow = await appendGuess(arrayOfRowArrays[row], guess);
        arrayOfRowArrays[row+1][0].innerHTML = "";
        row = newRow.incRow;
        letterCount = 0;
        guess = "";
        if (newRow.restart) {
            console.log('You can now restart the game...');
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
        console.log("guess - 1 working");

        letterCount--;
        if (letterCount === 0) {
            return;
        }
        return;
    }
    if (letterCount === 5 || letterCount === 0 && userInput === "BACKSPACE") { // boundaries
        console.log("letterCount is at 5 || 0");
        return;
    }
    guess += userInput;
    arrayOfRowArrays[row][letterCount].innerHTML = userInput;
    letterCount++;
}