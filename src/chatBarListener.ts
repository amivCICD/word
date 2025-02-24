import { usernameExists } from "./checkForUsername";

const chatBar = document.getElementById("chatBar");


chatBar?.addEventListener('click', e => {
    if (e) {
        if (!usernameExists) {
            document.getElementById("usernamePrompt").showModal();
        }
    }
})