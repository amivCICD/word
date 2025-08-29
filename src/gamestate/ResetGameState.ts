import { WordOfTheDay } from "../data/GetWordOfTheDay";
// import { sWords } from "./data/sWords";

export class ResetGameState {
    public reset: boolean;
    public wordOfTheDay: string;
    public wordOfTheDayLetters: string[];
    public wotd: string;

    constructor(reset: boolean, wotd: string) {
        this.reset = reset;
        this.wotd = wotd;
        let currentWordOfTheDay = new WordOfTheDay(this.wotd); // set word of day
        let w = currentWordOfTheDay.getWordOfTheDayAndLetters();
        this.wordOfTheDay = w.wordOfTheDay;
        this.wordOfTheDayLetters = w.wordOfTheDayLetters;
    }

    setResetFalse(): void  {
        this.reset = false;
    }

}

