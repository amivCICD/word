import { initializeSocket } from "./multiplayer/initialize_web_socket";
export const roomId = (function generateroomId(){
    return `room_${Math.random().toString(36).substr(2, 9)}`;
})();
let confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
let usernameInput = document.getElementById("usernameInput");


confirmUsernameBtn.addEventListener('click', () => {
    console.log("usernameInput.value\t", usernameInput.value);

    if (usernameInput.value === "" || usernameInput.value === undefined || usernameInput.value === null) {
        const toolTip = document.getElementById("usernameRequiredToolTip");
        toolTip?.classList.toggle("hidden");
        setTimeout(() => {
            toolTip?.classList.toggle("hidden");
        }, 5000);
        return;
    }

    if (usernameInput.value !== "" || usernameInput.value !== undefined || usernameInput.value !== null) {
        localStorage.setItem("username", JSON.stringify({ username: usernameInput.value, id: Date.now() }));
        console.log("usernameInput.value:\t", usernameInput.value);
        initializeSocket(roomId);
        const usernameModal = document.getElementById("usernamePrompt");
        usernameModal?.close();
        usernameInput.value = "";
    }
});

