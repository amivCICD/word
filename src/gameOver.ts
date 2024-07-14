export class GameOver {
    private static instance: GameOver;
    gameOver: boolean;
    constructor() {
        this.gameOver = false;
    }
    public static getInstance(): GameOver {
        if (!GameOver.instance) {
            GameOver.instance = new GameOver();
        }
        return GameOver.instance;
    }
    setGameOverTrue() {
        this.gameOver = true;
    }
    setGameOverFalse() {
        this.gameOver = false;
    }
    getGameOverStatus() {
        return this.gameOver;
    }
}