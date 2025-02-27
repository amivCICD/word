import { usernameExists } from "../checkForUsername";
import { initializeSocket } from "./initialize_web_socket";
import { unHideRoomId_clipoard_divs } from "./unhide_room_info";
import { playMultiPlayerAfterUsername } from "./createsocket_changeroom";
import { roomId } from "./createsocket_changeroom";

console.log('usernameExists\t', usernameExists)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialRoomId = urlParams.get("room");
    if (initialRoomId && window.location.pathname.includes('/multi_player/chat')) {
        initializeSocket(initialRoomId);
        document.getElementById("usernamePrompt").showModal();
        if (usernameExists) {
            let roomIdReadOnly = document.getElementById("roomIdReadOnly");
            roomIdReadOnly?.addEventListener("click", e => {
                if (e) {
                    e.target.select();
                }
            });

            const confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
            confirmUsernameBtn?.classList.add('hidden');

            const continueUserButton = document.getElementById("startGameButton");
            continueUserButton?.classList.add('hidden');
            unHideRoomId_clipoard_divs(window.location.href);


            const usernameMessage = document.getElementById("usernameMessage");
            usernameMessage.innerHTML = `
                Current username: <span class="text-xl font-extrabold italic text-green-300">${usernameExists}</span>
            `;

            // direct exit button, no events called
            const userHasroomID_username = document.getElementById("modalClose");
            userHasroomID_username?.classList.remove("hidden");

            const usernameInput = document.getElementById("usernameInput");
            usernameInput.value = usernameExists;
            usernameInput?.classList.add("hidden");
        }

    } else {
        console.log("WE ARE HITTING THE ELSE IN INITIAL PROMPT");

        document.getElementById("usernamePrompt").showModal();
        if (usernameExists) {
            playMultiPlayerAfterUsername(roomId);

            const confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
            confirmUsernameBtn?.classList.add('hidden');

            const continueUserButton = document.getElementById("startGameButton");
            continueUserButton?.classList.add('hidden');
            unHideRoomId_clipoard_divs(`${window.location.href}`);

            let roomIdReadOnly = document.getElementById("roomIdReadOnly");
            roomIdReadOnly?.addEventListener("click", e => {
                if (e) {
                    e.target.select();
                }
            });

            const userHasNameButNoRoom = document.getElementById("modalClose"); // direct close modal
            userHasNameButNoRoom?.classList.remove("hidden");


            const usernameMessage = document.getElementById("usernameMessage");
            usernameMessage.innerHTML = `
                Current username: <span class="text-xl font-extrabold italic text-green-300">${usernameExists}</span>
            `;
            const usernameInput = document.getElementById("usernameInput");
            usernameInput?.classList.add("hidden");
            // usernameInput.value = usernameExists;
            // usernameInput.placeholder = "change username";
        }
    }
});