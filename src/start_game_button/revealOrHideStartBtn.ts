

export function revealOrHideStartBtn(hide: boolean): void {
    let btn = document.getElementById('startNewGameBtn');
    if (hide) {
        btn?.classList.add("hidden");
    } else {
        btn?.classList.remove("hidden");
    }
}