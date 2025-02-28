
import { unHideRoomId_clipoard_divs } from "./multiplayer/unhide_room_info";
import { playMultiPlayerAfterUsername } from "./multiplayer/createsocket_changeroom";
import { setInitialPromptReady } from "./multiplayer/setInitialPromptReady";
import { sendMessage, onMessage } from "./multiplayer/initialize_web_socket";
import { newUserJoiningMessage } from "./multiplayer/newUserJoiningMessage";

export const roomId = (function generateroomId(){
    return `room_${Math.random().toString(36).substr(2, 9)}`;
})();

let confirmUsernameBtn = document.getElementById("confirmUsernameBtn") as HTMLElement;
let usernameInput = document.getElementById("usernameInput") as HTMLInputElement;


confirmUsernameBtn.addEventListener('click', () => {
    // console.log("usernameInput.value\t", usernameInput?.value);

    if (usernameInput.value === "" || usernameInput.value === undefined || usernameInput.value === null) {
        const toolTip = document.getElementById("usernameRequiredToolTip");
        toolTip?.classList.toggle("hidden");
        setTimeout(() => {
            toolTip?.classList.toggle("hidden");
        }, 5000);
        return;
    }

    if (usernameInput?.value !== "" || usernameInput?.value !== undefined || usernameInput?.value !== null) {
        localStorage.setItem("username", JSON.stringify({ username: usernameInput?.value, userId: Date.now() }));
        playMultiPlayerAfterUsername(roomId);
        // let userInfo = JSON.parse(localStorage.getItem("username"));
        // sendMessage({ type: 'join', username: userInfo.username, userId: userInfo.userId });
        // sendMessage(JSON.stringify({ type: "newuserjoining", username: userInfo.username, userId: userInfo.userID }));


        const uname = usernameInput.value;
        usernameInput.value = "";
        usernameInput.classList.add("hidden");

        let roomIdReadOnly = document.getElementById("roomIdReadOnly");
        roomIdReadOnly.addEventListener("click", e => {
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
            Current username: <span class="text-xl font-extrabold italic text-green-300">${uname}</span>
        `;

        // direct exit button, no events called
        const userHasroomID_username = document.getElementById("modalClose");
        userHasroomID_username?.classList.remove("hidden");

        setInitialPromptReady();

        // const usernameInput = document.getElementById("usernameInput");
        // usernameInput.value = usernameExists;
        // usernameInput?.classList.add("hidden");

        // newUserJoiningMessage();



    }
});

