import { fireOffConfetti } from "../../game_over_related/fireOffConfetti";
import { showFailureModal } from "../../game_over_related/showFailureModal";
import { appendGuess } from "./appendGuess";

export async function handleGuess(state, data, gameOver, checkCompletionStatus) {
    const newRow = await appendGuess(
        state.arrayOfRowArrays[state.row],
        state.guess,
        state.wordOfTheDay,
        state.wordOfTheDayLetters,
        data.gameStateParam
    );
    if (state.row !== 5) {
        state.arrayOfRowArrays[state.row+1][0].innerHTML = "";
        state.row = newRow.incRow;
        state.letterCount = 0;
        state.rowGameState.startFromZero();
        state.userInput = ""; // this fixed it for now 03 03 2025
        state.guess = "";
    }
    if (newRow.restart) {
        state.gameComplete = true;
        state.checkCompletionStatus.setCompletedGame();
        // console.log('You can now restart the game...');
        fireOffConfetti();
    }
    if (gameOver.getGameOverStatus()) {
        state.gameComplete = true;
        checkCompletionStatus.setCompletedGame();
        // console.log("You did not get the word...fire off modal...");
        showFailureModal(state.wordOfTheDay);
        state.userInput = "";
    }
}