import { usernameExists } from "../../checks/checkForUsername";
import { initializeSocket } from "../socket_related/initialize_web_socket";
import { unHideRoomId_clipoard_divs } from "./unhide_room_info";
import { playMultiPlayerAfterUsername } from "../socket_related/createsocket_changeroom";
import { roomId } from "./generateRoomId";
import { setInitialPromptReady } from "../window_initializers/setInitialPromptReady";


document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialRoomId = urlParams.get("room");
    // console.log("window.location.pathname.includes('/multi_player/chat')\t", window.location.pathname.includes('/multi_player/chat'));

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
            setInitialPromptReady();
        }

    } else {
        console.log("WE ARE HITTING THE ELSE IN INITIAL PROMPT");
        console.log("usernameExists\t", usernameExists)
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
            setInitialPromptReady();
            // usernameInput.value = usernameExists;
            // usernameInput.placeholder = "change username";
        }
    }
});