import { usernameExists } from "../checkForUsername";

console.log('usernameExists\t', usernameExists)
document.addEventListener('DOMContentLoaded', () => {
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


});