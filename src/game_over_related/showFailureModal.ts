import { getGameState } from "../multiplayer/socket_related/initialize_web_socket";
import { getLocalCurrentUser } from "../multiplayer/helper_functions/getLocalCurrentUser";

export function showFailureModal(wordOfTheDay) {
    const gameState = getGameState();
    const failureModal = document.getElementById('failureModal') as HTMLDialogElement | null;
    if (failureModal) { failureModal.showModal; }
    const wordOfTheDayElement = document.getElementById('wordOfTheDay');
    if (wordOfTheDayElement) { wordOfTheDayElement.innerHTML = wordOfTheDay; }

    const localCurrentUser = getLocalCurrentUser();
    if (localCurrentUser.userId.toString() !== gameState.currentPlayer.userId) {
        document.getElementById("failureModalBtn")?.classList.add('hidden');
    }
}