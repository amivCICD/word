import { sWords } from "../data/sWords";

export function checkIfWordInWordList(userAttempt: string): boolean {
    return sWords.includes(userAttempt.toLowerCase());
}