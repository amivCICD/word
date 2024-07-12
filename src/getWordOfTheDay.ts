import { sWords } from "./sWords";

export const getWordOfTheDay = (arr: string[]): string => {
    const randomIndex: number = Math.floor(Math.random() * arr.length);
    const wordOfTheDay: string = arr[randomIndex];
    return wordOfTheDay.toUpperCase();
}
export const wordOfTheDay = getWordOfTheDay(sWords);
export const wordOfTheDayLetters = wordOfTheDay.split("");
// console.log("wordOfTheDay\t", wordOfTheDay);

export class WordOfTheDay {
    constructor(sWords: string[]) {
        this.sWords = sWords;
    }
    getWordOfTheDayAndLetters(sWords = this.sWords) {
        const randomIndex: number = Math.floor(Math.random() * sWords.length);
        const wordOfTheDay: string = sWords[randomIndex];

        return { wordOfTheDay: wordOfTheDay.toUpperCase(), wordOfTheDayLetters: wordOfTheDay.toUpperCase().split("") };
    }
}
