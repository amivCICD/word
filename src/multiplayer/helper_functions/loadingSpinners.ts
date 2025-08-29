export function startLoadingSpinner(customMessage: boolean, customMessageText: string){
    if(document.getElementById("loadingSpinner")) return;
    let text = "Loading";
    if (customMessage) text = `${customMessageText}`;
    let div = document.createElement("div");
    div.id = "loadingSpinner";
    div.innerHTML = `
    <div class="fixed top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/4">
        <svg class="size-16 animate-spin text-green-300 mx-auto" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span class="text-green-300 font-bold text-xl mx-auto">${text}</span>
    </div>`;
    document.getElementById("app").appendChild(div);
}
export function stopLoadingSpinner(timer: number){
    let loadingSpinner = document.getElementById("loadingSpinner");
    if (loadingSpinner) {
        setTimeout(() => {
            loadingSpinner.remove();
        }, timer || 1000);
    }
}