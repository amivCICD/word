export class GuessStarted {
    private static instance: GuessStarted;
    guessStarted: boolean;
    constructor() {
        this.guessStarted = false;
    }
    public static getInstance(): GuessStarted {
        if (!GuessStarted.instance) {
            GuessStarted.instance = new GuessStarted();
        }
        return GuessStarted.instance;
    }
    setGuessStartedTrue() {
        this.guessStarted = true;
    }
    setGuessStartedFalse() {
        this.guessStarted = false;
    }
    getGuessStarted() {
        return this.guessStarted;
    }
}