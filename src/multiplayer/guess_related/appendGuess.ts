import { illuminateKeys } from "../../key_handlers/illuminateKeys.ts";
import { checkForCorrectPosition } from "../../checks/checkForCorrectPosition.ts";
import { checkForCorrectLetter } from "../../checks/checkForCorrectLetter.ts";
import { getGameState } from "../socket_related/initialize_web_socket.ts";

const gameState = getGameState();
const guessStarted = gameState.guessStarted;

const gameOver = gameState.gameOver;
export async function appendGuess(
    divEl: HTMLDivElement[],
    guessFromPrev: string,
    wordOfTheDay: string,
    wordOfTheDayLetters: string[],
    gameStateParam: boolean
): Promise<number> {
    guessStarted.setGuessStartedTrue();
    if (gameStateParam.reset) {
        gameState.incRow = 0;
        gameState.appendGuess = "";
        gameState.c = 0;
        gameState.wordOfTheDay = wordOfTheDay;
        gameState.wordOfTheDayLetters = wordOfTheDayLetters;
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


