import { wordOfTheDay } from "./getWordOfTheDay";
import { wordOfTheDayLetters } from "./getWordOfTheDay";
import { illuminateKeys } from "./illuminateKeys";

import { getGameState, getCurrentArrowOfRowArrays } from "./multiplayer/initialize_web_socket.ts";



const gameState = getGameState();
const guessStarted = gameState.guessStarted;

function checkForCorrectPosition(wordOfTheDayLetters: string[], guessArr: string[]) {

    let aux = Array.from({ length: 5 });
    let correctLetters = [];
    for (let i = 0; i < wordOfTheDayLetters.length; i++) {
        const element = wordOfTheDayLetters[i];
        if (element === guessArr[i]) {
            aux[i] = element;
            correctLetters.push(element);
        }
    }
    return { aux, correctLetters };
}
let keysArray = Array.from(document.querySelectorAll('.kbd'));
function checkForCorrectLetter(letter: string, yellowWorthy: string[], correctPositionArr: string[], count: number) {

        if (correctPositionArr[count] === letter.innerHTML) {
            letter.classList.remove('bg-black');
            letter.classList.add('bg-green-200');
            illuminateKeys(letter.innerHTML, "green");

            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.remove("bg-black")
            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.remove("bg-yellow-200")
            keysArray.filter((key) => key.innerHTML === letter.innerHTML)[0].classList.add("bg-green-200")

        }
        else if (yellowWorthy.includes(letter.innerHTML) && correctPositionArr.indexOf(letter.innerHTML) === -1) {
            letter.classList.remove('bg-black');
            letter.classList.add('bg-yellow-200');
            if (!correctPositionArr.includes(letter.innerHTML)) {
                illuminateKeys(letter.innerHTML, "hit");
            }
            yellowWorthy = yellowWorthy.shift();
        }
        else if (correctPositionArr[count] !== letter.innerHTML) {
            letter.classList.remove('bg-black');
            letter.classList.add('bg-slate-500');
            illuminateKeys(letter.innerHTML, "miss");
        }
}

const gameOver = gameState.gameOver;
export async function appendGuess(
    divEl: HTMLDivElement[],
    guessFromPrev: string,
    wordOfTheDay: string,
    wordOfTheDayLetters: string[],
    gameStateParam
): Promise<number> {
    guessStarted.setGuessStartedTrue();
    if (gameStateParam.reset) {
        gameState.incRow = 0;
        gameState.appendGuess = "";
        gameState.c = 0;
        illuminateKeys("", "", gameStateParam.reset);
        gameState.restart = false;
        guessStarted.setGuessStartedFalse();
        return { incRow: gameState.incRow, restart: gameState.restart };
        // return;
    }

    const guessAsArray = guessFromPrev.split("");
    let filt = guessAsArray.filter(letter => wordOfTheDayLetters.includes(letter));
    let yellowWorthy = [...new Set(filt)];
    let correctPositionArr = checkForCorrectPosition(wordOfTheDayLetters, guessAsArray).aux;

    for (const letter of divEl) {
        letter.classList.toggle('box');
        await new Promise(res => setTimeout(res, 500));
        // console.log(letter.innerHTML);

        gameState.appendGuess += letter.innerHTML;

        checkForCorrectLetter(letter, yellowWorthy, correctPositionArr, gameState.c);
        letter.classList.toggle('box');
        illuminateKeys(letter.innerHTML, "miss");

        gameState.c++;

    }

    if (gameState.appendGuess === wordOfTheDay) {
        console.log('You got it!');
        gameState.restart = true;
    } else if (gameState.incRow === 5 && gameState.appendGuess !== wordOfTheDay) {
        gameOver.setGameOverTrue();
    } else {
        gameState.appendGuess = "";
    }
    gameState.c = 0;
    gameState.incRow++;
    guessStarted.setGuessStartedFalse();
    return { incRow: gameState.incRow, restart: gameState.restart, wordOfTheDay };
}