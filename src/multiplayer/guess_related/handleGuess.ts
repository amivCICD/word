import { fireOffConfetti } from "../../game_over_related/fireOffConfetti";
import { showFailureModal } from "../../game_over_related/showFailureModal";
import { sendMessage } from "../socket_related/initialize_web_socket";
import { appendGuess } from "./appendGuess";

export async function handleGuess(state, data, gameOver, checkCompletionStatus) { // used in typeOutGuess.ts #40
    const newRow = await appendGuess(
        state.arrayOfRowArrays[state.row],
        state.guess, // guessFromPrev param...
        data.wordOfTheDay,
        data.wordOfTheDayLetters,
        data.gameStateParam
    );
    if (state.row !== 5) {
        state.arrayOfRowArrays[state.row+1][0].innerHTML = "";
        state.row = newRow.incRow;
        state.letterCount = 0;
        state.rowGameState.startFromZero();
        state.userInput = ""; // this fixed it for now 03 03 2025 // 08 27 2025 fixed WHAT?
        state.guess = "";
    }
    if (newRow.restart) {
        state.gameComplete = true;
        state.checkCompletionStatus.setCompletedGame();

        // console.log('You can now restart the game...');
        fireOffConfetti();
        setNewWordOnServer();
        // console.log("%%%%%%%%%%%%%%%resetting the game ONCE");

    }
    if (gameOver.getGameOverStatus()) {
        state.gameComplete = true;
        state.checkCompletionStatus.setCompletedGame(); // added state. 08 27 2025 // removed state, not sure why this messes it up
        // console.log("You did not get the word...fire off modal...");
        showFailureModal(state.wordOfTheDay);
        state.userInput = "";
        setNewWordOnServer();
        // console.log("%%%%%%%%%%%%%%%resetting the game TWICE");
    }
}

function setNewWordOnServer() {
    sendMessage(JSON.stringify({ // new and temporary
        type: "updateServerWord",
        updateType: "generateNewGameWord"
    }));
}