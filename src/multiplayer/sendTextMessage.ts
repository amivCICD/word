
import { getSocket, sendMessage, onMessage } from "./initialize_web_socket";
import { getTextMessageState, getAllTextMessageState } from "./initialize_web_socket";


// const urlParams = new URLSearchParams(window.location.search);
// console.log('urlParams\t', urlParams.get("room"));
// const room = urlParams.get("room");

// export const socket = playMultiPlayer?.socket;


let currentUser = JSON.parse(localStorage.getItem("username"));
let currentUserId = currentUser.id;

const allMessageState = getAllTextMessageState();
allMessageState.forEach((msg) => {
    console.log("CURRENT USER ID:\t", currentUserId)
    let div = document.createElement('div');
    if (msg.userId !== currentUserId) {
        div.innerHTML = `
        <div class="chat chat-end">
            <div class="chat-bubble bg-green-300 text-white"><span class="font-bold">${msg.username}</span>: ${msg.message}</div>
        </div>
        `;
    } else {
        div.innerHTML = `
        <div class="chat chat-start">
            <div class="chat-bubble bg-pink-300 text-white"><span class="font-bold">${msg.username}</span>: ${msg.message}</div>
        </div>
        `;
    }
});

onMessage((e) => {
    const data = JSON.parse(e);
    if (data.type === 'text') {
        let div = document.createElement('div');
        console.log('DATA data.userId\t', data.userId)
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
    document.getElementById('textMessageInput')?.addEventListener('input', e => {
        textMessage = e.target.value;
    });
    document.getElementById("sendTextBtn").addEventListener('click', () => {
        const socket = getSocket();
        if (socket.readyState === WebSocket.OPEN) {
            let username;
            let userId;
            if (textMessage === "") return;
            if (localStorage.getItem("username") !== null) {
                let unameInfo = JSON.parse(localStorage.getItem("username"));
                username = unameInfo.username;
                userId = unameInfo.id;
            } else {
                localStorage.setItem("username", JSON.stringify({ username: "YouNeedAUserName", id: Date.now() }));
                let unameInfo = JSON.parse(localStorage.getItem("username"));
                username = unameInfo.username;
                userId = unameInfo.id;
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
        //////////////////let our button click function handle usernameInput field////////////////////
        if (window.usernameInputOnly) {
            let usernameInput = document.getElementById("usernameInput");
            console.log(`usernameInput?.value\t${usernameInput?.value}`)
            if (usernameInput.value !== "" && e.keyCode === 13) {
                let confirmUsernameBtn = document.getElementById("confirmUsernameBtn");
                confirmUsernameBtn?.click();
                return;
            }
        }
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
                    userId = unameInfo.id;
                } else {
                    localStorage.setItem("username", JSON.stringify({ username: "YouNeedAUserName", id: Date.now() }));
                    let unameInfo = JSON.parse(localStorage.getItem("username"));
                    username = unameInfo.username;
                    userId = unameInfo.id;
                }
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

