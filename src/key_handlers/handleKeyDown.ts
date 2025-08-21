import { typeOutGuess } from "../multiplayer/guess_related/typeOutGuess";

export function handleKeyDown(e) {
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