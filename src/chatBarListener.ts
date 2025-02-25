import { usernameExists } from "./checkForUsername";

const chatBar = document.getElementById("chatBar");
chatBar?.addEventListener('click', e => {
    if (e) {
        if (localStorage.getItem("username") === null || localStorage.getItem("username") === undefined) {
            document.getElementById("usernamePrompt").showModal();
        }
    }
});

// no longer needed since we prompt on page load - handled in ./multiplayer/initprompt

