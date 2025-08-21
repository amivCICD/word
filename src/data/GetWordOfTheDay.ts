import { sWords } from "./sWords";

// export const getWordOfTheDay = (arr: string[]): string => {
//     const randomIndex: number = Math.floor(Math.random() * arr.length);
//     const wordOfTheDay: string = arr[randomIndex];
//     return wordOfTheDay.toUpperCase();
// }
// export const wordOfTheDay = getWordOfTheDay(sWords);
// export const wordOfTheDayLetters = wordOfTheDay.split("");

export class WordOfTheDay {
    public wotd: string;

    constructor(wotd: string) {
        this.wotd = wotd;
    }
    getWordOfTheDayAndLetters() {
        return { wordOfTheDay: this.wotd.toUpperCase(), wordOfTheDayLetters: this.wotd.toUpperCase().split("") };
    }
}