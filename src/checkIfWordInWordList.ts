import { wordOfTheDay } from "./getWordOfTheDay";
import { words } from "./five_letter_words";

export function checkIfWordInWordList(userAttempt: string): boolean {
    return words.includes(userAttempt);
}