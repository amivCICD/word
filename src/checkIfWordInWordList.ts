import { wordOfTheDay } from "./getWordOfTheDay";
import { sWords } from "./sWords";

export function checkIfWordInWordList(userAttempt: string): boolean {
    return sWords.includes(userAttempt.toLowerCase());
}