import { usernameExists } from "../checkForUsername";
import { initializeSocket } from "./initialize_web_socket";

console.log('usernameExists\t', usernameExists)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialRoomId = urlParams.get("room");
    if (initialRoomId && window.location.pathname.includes('/multi_player/chat')) {
        initializeSocket(initialRoomId);
    } else {
        document.getElementById("usernamePrompt").showModal();
        if (usernameExists) {
            const confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
            confirmUsernameBtn?.classList.add('hidden');

            const continueUserButton = document.getElementById("startGameButton");
            continueUserButton?.classList.remove('hidden');


            const usernameMessage = document.getElementById("usernameMessage");
            usernameMessage.innerHTML = `
            Current username: <span class="text-xl font-extrabold italic text-green-300">${usernameExists}</span>
            `;
            const usernameInput = document.getElementById("usernameInput");
            usernameInput.value = usernameExists;
            usernameInput.placeholder = "change username";
        }
    }
});