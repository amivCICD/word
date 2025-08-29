import { checkIfWordInWordList } from "../../checks/checkIfWordInWordList";
import { handleWiggleAnimation } from "../../ui_handlers/handleWiggleAnimation";
import { arrayOfDivRows } from "../helper_functions/arrayOfDivRows";
import { getGameState, onMessage } from "../socket_related/initialize_web_socket";
import { handleGuess } from "./handleGuess";
import { swapPlayersFrontEnd, syncNewCss, syncWordRowArrayState } from "./typeOutGuess";




let arrayOfRowArrays;
document.addEventListener("DOMContentLoaded", () => {
    arrayOfRowArrays = arrayOfDivRows();
});
document.addEventListener("websocket-ready", () => {
    onMessage(async (messageData) => {
        const state = getGameState();
        state.arrayOfRowArrays = arrayOfRowArrays;
        const data = JSON.parse(messageData);
        if (data.updateType === "backspace" && data.userInput === 'BACKSPACE') {
            if (state.letterCount >= 0 && state.letterCount < 5) {
                state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = "";
                // syncMatrixArrayToServer(state);
                syncWordRowArrayState(state);
            } else if (state.letterCount === 5 || state.letterCount === 0) {
                return;
            }
        } else if (data.updateType === 'append') {
            if (state.letterCount <= 5 && state.rowLetterCount < 6) {
                state.arrayOfRowArrays[state.row][state.rowLetterCount].innerHTML = state.userInput;
                // syncMatrixArrayToServer(state);
                syncWordRowArrayState(state);
            }
        } else if (data.updateType === "guessAttempt" && data.userInput === "ENTER") {
            if (state.letterCount === 5) {
                if (!checkIfWordInWordList(state.guess)) {
                    handleWiggleAnimation(state.arrayOfRowArrays[state.row]);
                    return;
                }
                await handleGuess(state, data, state.gameOver, state.checkCompletionStatus)
                    .then(() => {
                        state.wordRowArrayState.forEach((row, rowIdx) => {
                            row.forEach((col, colIdx) => {
                                if (state.arrayOfRowArrays[rowIdx][colIdx]?.innerHTML === "") {
                                    return;
                                }
                                col.class = state.arrayOfRowArrays[rowIdx][colIdx]?.className || "";
                                col.value = state.arrayOfRowArrays[rowIdx][colIdx]?.innerHTML || "";
                            })
                        })
                        syncNewCss(state.wordRowArrayState);
                    })
                    .then(() => {
                        swapPlayersFrontEnd(state, false, null);
                    })
                    .catch((e) => console.log(`Error for setting sync word array state in guess attempt\t${e}`));
            }
        }
    });
});