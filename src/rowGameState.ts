export class RowGameState {
    private static instance: RowGameState;
    rowLetterCount: number;
    private constructor() {
        this.rowLetterCount = 0;
    }
    public static getInstance(): RowGameState {
        if (!RowGameState.instance) {
            RowGameState.instance = new RowGameState();
        }
        return RowGameState.instance;
    }
    startFromZero(): void {
        this.rowLetterCount = 0;
    }
    incRowLetterCount(): void {
        this.rowLetterCount += 1;
        // if (this.rowLetterCount === 6) {
        //     this.rowLetterCount -= 1;
        // } else {
        // }
    }
    decRowLetterCount(): void {
        this.rowLetterCount -= 1;
    }
    getRowLetterCount(): number {
        return this.rowLetterCount;
    }
    getMethods() {
        console.log("startFromZero()\nincRowLetterCount()\ndecRowLetterCount()\ngetRowLetterCount()\n")
    }
}