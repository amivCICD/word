

export class CheckCompletionStatus {
    private completed: boolean;
    private completionDate: Date | null;
    private static instance: CheckCompletionStatus;

    constructor() {
        this.loadState();
        this.checkCompletionStatus();
    }

    public static getInstance(): CheckCompletionStatus {
        if (!CheckCompletionStatus.instance) {
            CheckCompletionStatus.instance = new CheckCompletionStatus();
        }
        return CheckCompletionStatus.instance;
    }

    private loadState(): void {
        const savedCompleted = localStorage.getItem("completed");
        const savedCompletionDate = localStorage.getItem("completionDate");

        this.completed = savedCompleted === "true";
        this.completionDate = savedCompletionDate ? new Date(savedCompletionDate) : null;
    }
    private checkCompletionStatus(): void {
        const currentDate = new Date();
        if (this.completionDate && this.isSameDay(this.completionDate, currentDate)) {
            this.completed = true;
        } else {
            this.completed = false;
            this.completionDate = null;
        }
        this.saveState();
    }
    private saveState(): void {
        localStorage.setItem("completed", this.completed.toString());
        localStorage.setItem("completionDate", this.completionDate?.toISOString() || "");
    }
    private isSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth()    === date2.getMonth()    &&
            date1.getDate()     === date2.getDate()
        );
    }
    public setCompletedGame(): void {
        this.completed = true;
        this.completionDate = new Date();
        this.hideRevealStartBtn(false);
        this.saveState();
    }

    public isCompleted(): boolean {
        return this.completed;
    }
    public resetState(): void {
        this.completed = false;
        this.completionDate = null;
        this.saveState();
    }
    public resetCompletionNextDay(): void {
        let currentTime: any = new Date();
        let midnight: any = new Date(currentTime);
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight: any = midnight - currentTime;
        setTimeout(() => {
            this.resetState();
            this.hideRevealStartBtn(true); // hide at midnight
        }, timeUntilMidnight)
    }
    public hideRevealStartBtn(hide: boolean): void {
        let btn = document.getElementById('startNewGameBtn');
        if (hide) {
            btn?.classList.add("hidden");
        } else {
            btn?.classList.remove("hidden");
        }
    }
}