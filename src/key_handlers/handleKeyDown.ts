import { typeOutGuess } from "../multiplayer/guess_related/typeOutGuess";
import { getGameState } from "../multiplayer/socket_related/initialize_web_socket";

export function handleKeyDown(e) {
    const gameState = getGameState();
    let filteredValue = checkInputValues(e.key.toUpperCase());
    typeOutGuess(
      filteredValue,
      gameState,
      gameState.wordOfTheDay,
      gameState.wordOfTheDayLetters
    );
    document.querySelectorAll('.kbd').forEach((keys) => {
      if (filteredValue === keys.innerHTML) {
        keys.classList.add('bg-pink-200')
      }
    });
  }