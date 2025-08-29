

export class UIReset {
    static resetKeyboard(): void {
        document.querySelectorAll('.kbd').forEach((key) => {
            key.classList.remove(
                'bg-yellow-200',
                'bg-green-200',
                'bg-slate-500',
                'text-black'
            );
            key.classList.add('bg-black', 'text-pink-200');
        });
    }
    static resetWordRows(): void {
        document.querySelectorAll('.word-row').forEach((wordRow) => {
            wordRow.innerHTML = "";
            wordRow.classList.remove(
                "bg-green-200",
                "bg-yellow-200",
                "bg-slate-500"
            );
            wordRow.classList.add("bg-black");
        });
    }
    static resetUI(): void {
        this.resetKeyboard();
        this.resetWordRows();
        console.log("UI reset called");
    }
}