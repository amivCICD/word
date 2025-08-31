import { WordOfTheDay } from "../data/GetWordOfTheDay";
// import { sWords } from "./data/sWords";

export class ResetGameState {
    public reset: boolean;
    public wordOfTheDay: string;
    public wordDefinition: string[];
    public wordOfTheDayLetters: string[];
    public wotd: string;
    public definition: string[];

    constructor(reset: boolean, wotd: string, definition: string[]) {
        this.reset = reset;
        this.wotd = wotd;
        this.definition = definition;
        let currentWordOfTheDay = new WordOfTheDay(this.wotd); // set word of day
        let w = currentWordOfTheDay.getWordOfTheDayAndLetters();
        this.wordOfTheDay = w.wordOfTheDay;
        this.wordOfTheDayLetters = w.wordOfTheDayLetters;
        this.wordDefinition = definition;
    }

    setResetFalse(): void  {
        this.reset = false;
    }

}

