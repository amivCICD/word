// export const socket = new WebSocket("ws://localhost:1985/chat");
import { getSocket, sendMessage, onMessage } from "./multiplayer/initialize_web_socket";




// const urlParams = new URLSearchParams(window.location.search);
// console.log('urlParams\t', urlParams.get("room"));
// const room = urlParams.get("room");

// export const socket = playMultiPlayer?.socket;







let textMessage = "";
const seenMessages = new Set();

(function sendTextMessage() {
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
            sendMessage(JSON.stringify({ type: 'text', username: username, id: userId,  message: textMessage, messageId: Math.random().toString().slice(2) }));

            onMessage((e) => {
                console.log('e\t', e)
                if (!seenMessages.has(e)) {
                    seenMessages.add(e);
                    const data = JSON.parse(e);

                    if (data.type === 'text') {
                        let div = document.createElement('div');
                        if (data.id !== userId) {
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
                }
            });

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
                sendMessage(JSON.stringify({ type: 'text', username: username, id: userId,  message: textMessage, messageId: Math.random().toString().slice(2) }));
                onMessage((e) => {
                    if (!seenMessages.has(e)) {
                        seenMessages.add(e);
                        const data = JSON.parse(e);
                        if (data.type === "text") {
                            let div = document.createElement('div');

                            if (data.id !== userId) {
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
                    }
                });
                input.value = "";
                textMessage = "";
                input?.focus();

            } else {
                console.warn("Web socket is not open... Current state: ", socket?.readyState);
                alert('Chat unavailable at the moment, try again in 2 seconds...');
            }
        }
    });
})();

