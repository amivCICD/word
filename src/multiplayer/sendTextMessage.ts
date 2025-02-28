
import { getSocket, sendMessage, onMessage } from "./initialize_web_socket";
import { getTextMessageState, getAllTextMessageState } from "./initialize_web_socket";
import { checkInputValues } from "../checkInputValues";
import { usernameExists } from "../checkForUsername";


// const urlParams = new URLSearchParams(window.location.search);
// console.log('urlParams\t', urlParams.get("room"));
// const room = urlParams.get("room");

// export const socket = playMultiPlayer?.socket;

const checkInitUsername = (function getUserName() {
    let currentUser = localStorage.getItem("username");
    if (currentUser === null || currentUser === undefined) {
        return false;
    } else {
        return { userExists: true, currentUser: currentUser };
    }
})();
if (checkInitUsername.userExists) {
    const currentUser = checkInitUsername.currentUser;
    const currentUserId = currentUser?.userId;
    const allMessageState = getAllTextMessageState();
    console.log("CURRENT USER ID:\t", currentUserId)
    allMessageState.forEach((msg) => {
        let div = document.createElement('div');
        if (msg.userId !== currentUserId) {
            div.innerHTML = `
            <div class="chat chat-end">
                <div class="chat-bubble bg-green-300 text-white"><span class="font-bold">${msg?.username}</span>: ${msg?.message}</div>
            </div>
            `;
        } else {
            div.innerHTML = `
            <div class="chat chat-start">
                <div class="chat-bubble bg-pink-300 text-white"><span class="font-bold">${msg?.username}</span>: ${msg?.message}</div>
            </div>
            `;
        }
    });
}
// else {
//     localStorage.setItem("username", JSON.stringify({ username: "INeedAUserName", id: Date.now() }));
//     let unameInfo = JSON.parse(localStorage.getItem("username"));
//     let username = unameInfo.username;
//     let userId = unameInfo.id;
// }



onMessage((e) => {
    const data = JSON.parse(e);
    if (data.type === 'text') {
        let div = document.createElement('div');
        console.log('DATA data.userId\t', data.userId)
        let currentUser = JSON.parse(localStorage.getItem("username"));
        console.log("CURRENT USER\T", currentUser);
        let currentUserId = currentUser.userId;
        console.log("CURRENT USER ID:\t", currentUserId)
        if (data.userId !== currentUserId) {
            div.innerHTML = `
            <div class="chat chat-end">
                <div class="chat-bubble bg-green-300 text-white"><span class="font-bold">${data.username}</span>: ${data.message}</div>
            </div>
            `;
        } else {
            div.innerHTML = `
            <div class="chat chat-start">
                <div class="chat-bubble bg-pink-300 text-white"><span class="font-bold">${data.username}</span>: ${data.message}</div>
            </div>
            `;
        }

        document.getElementById("textMessages")?.appendChild(div);
        const textMessages = document.getElementById("textMessages");
        textMessages.scrollTo(0, textMessages.scrollHeight);
    }
});

(function sendTextMessage() {
    let textMessage = "";
    let username;
    let userId;
    document.getElementById('textMessageInput')?.addEventListener('input', e => {
        textMessage = e.target.value;
    });
    document.getElementById("sendTextBtn").addEventListener('click', () => {
        const socket = getSocket();
        if (socket.readyState === WebSocket.OPEN) {

            if (textMessage === "") return;
            if (localStorage.getItem("username") !== null) {
                let unameInfo = JSON.parse(localStorage.getItem("username"));
                username = unameInfo.username;
                userId = unameInfo.userId;
            } else {
                localStorage.setItem("username", JSON.stringify({ username: "YouNeedAUserName", userId: Date.now() }));
                let unameInfo = JSON.parse(localStorage.getItem("username"));
                username = unameInfo.username;
                userId = unameInfo.userId;
                document.getElementById("usernamePrompt").showModal();
            }

            sendMessage(JSON.stringify({ type: 'text', username: username, userId: userId,  message: textMessage, messageId: Math.random().toString().slice(2) }));

            const input = document.getElementById('textMessageInput');
            input.value = "";
            textMessage = "";
            input?.focus();


        } else {
            console.warn("Web socket is not open... Current state: ", socket.readyState);
            alert('Chat unavailable at the moment, try again in 2 seconds...');
        }
    });
})();

(function sendTextMessageWenter() {
    document.addEventListener('keyup', e => {
        console.log("e\t", e)
        //////////////////let our button click function handle usernameInput field////////////////////
        if (window.usernameInputOnly) {
            let usernameInput = document.getElementById("usernameInput");
            console.log(`usernameInput?.value\t${usernameInput?.value}`)
            if (usernameInput.value !== "" && e.keyCode === 13) {
                console.log('e.keyCode\t', e.keyCode)
                let confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
                confirmUsernameBtn?.click();
                return;
            }
        }

        // document.addEventListener('keyup', e => {
        let filteredValue = checkInputValues(e.key.toUpperCase())
        document.querySelectorAll('.kbd').forEach((keys) => {
            if (filteredValue === keys.innerHTML) {
                keys.classList.remove('bg-pink-200');
            }
        });
        // });
        ///////////////////////////////////////////////////////////////////////////////////
        // console.log('e.keyCode\t', e.keyCode)
        if (!window.textMessageOnly) return;
        if (e.keyCode !== 13) {
            return;
        } else if (e.keyCode === 13 && window.textMessageOnly) {
            const socket = getSocket();
            if (socket?.readyState === WebSocket.OPEN) {
                let username;
                let userId;
                const input = document.getElementById('textMessageInput');
                if (input.value === "") return;
                if (localStorage.getItem("username") !== null) {
                    let unameInfo = JSON.parse(localStorage.getItem("username"));
                    username = unameInfo.username;
                    userId = unameInfo.userId;
                }
                // else {
                //     localStorage.setItem("username", JSON.stringify({ username: "YouNeedAUserName", id: Date.now() }));
                //     let unameInfo = JSON.parse(localStorage.getItem("username"));
                //     username = unameInfo.username;
                //     userId = unameInfo.userId;
                // }
                sendMessage(JSON.stringify({ type: 'text', username: username, userId: userId,  message: input.value, messageId: Math.random().toString().slice(2) }));
                input.value = "";
                input?.focus();

            } else {
                console.warn("Web socket is not open... Current state: ", socket?.readyState);
                alert('Chat unavailable at the moment, try again in 2 seconds...');
            }
        }
    });
})();

