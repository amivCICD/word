import { illuminateKeys } from "../../key_handlers/illuminateKeys.ts";
import { checkForCorrectPosition } from "../../checks/checkForCorrectPosition.ts";
import { checkForCorrectLetter } from "../../checks/checkForCorrectLetter.ts";
import { getGameState, sendMessage } from "../socket_related/initialize_web_socket.ts";



export async function appendGuess( // used in: handleGuess.ts as: const newRow = await appendGuess()
    divEl: HTMLDivElement[],
    guessFromPrev: string,
    wordOfTheDay: string,
    wordOfTheDayLetters: string[],
    gameStateParam: boolean
): Promise<number> {

    const gameState = getGameState();
    const gameOver = gameState.gameOver;
    const guessStarted = gameState.guessStarted;
    guessStarted.setGuessStartedTrue();

    if (gameStateParam.reset) { // 08 28 2025: 9:13PM commented out, hasnt caused any issues as of yet...
        console.log("gameStateParam.reset@!@!@!");
        gameState.incRow = 0;
        gameState.appendGuess = "";
        gameState.guess = "";
        gameState.c = 0;
        gameState.wordOfTheDay = wordOfTheDay;
        gameState.wordOfTheDayLetters = wordOfTheDayLetters;
        illuminateKeys("", "", gameStateParam.reset);
        // checkForCorrectLetter(gameStateParam.reset);
        gameState.restart = false;
        guessStarted.setGuessStartedFalse();
        return { incRow: gameState.incRow, restart: gameState.restart };
        // return;
    }
    console.log("guessFromPrev\t", guessFromPrev);

    const guessAsArray = guessFromPrev?.split("");
    let filt = guessAsArray.filter(letter => wordOfTheDayLetters.includes(letter));
    let yellowWorthy = [...new Set(filt)];
    let correctPositionArr = checkForCorrectPosition(wordOfTheDayLetters, guessAsArray).aux;

    console.log("correctPositionArr\t", correctPositionArr);
    console.log("yellowWorthy\t", yellowWorthy);


    for (const letter of divEl) {
        letter.classList.toggle('box');
        await new Promise(res => setTimeout(res, 500));
        // console.log("gameState.appendGuess\t", gameState.appendGuess);

        gameState.appendGuess += letter.innerHTML;

        checkForCorrectLetter(letter, yellowWorthy, correctPositionArr, gameState.c);
        letter.classList.toggle('box');
        console.log("should be a misse\t", letter.innerHTML)
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


