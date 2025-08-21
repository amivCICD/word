export function checkForCorrectPosition(wordOfTheDayLetters: string[], guessArr: string[]) {
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