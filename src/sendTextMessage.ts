const socket = new WebSocket("ws://localhost:1985/chat");
socket.onopen = () => console.log("connected to web sockets!");
socket.onclose = () => console.log("Disconnected...");
socket.onerror = (error) => console.log("ERROR: ", error);





(function sendTextMessage() {
    let textMessage = "";
    document.getElementById('textMessageInput')?.addEventListener('input', e => {
        textMessage = e.target.value;
    });
    document.getElementById("sendTextBtn").addEventListener('click', () => {
        if (socket.readyState === WebSocket.OPEN) {
            if (textMessage === "") return;
            socket.send(textMessage);
            socket.onmessage = ((e) => {
                let div = document.createElement('div');
                div.innerHTML = `
                    <div class="chat chat-start">
                        <div class="chat-bubble bg-pink-300 text-white">${e.data}</div>
                    </div>
                    `;
                document.getElementById("textMessages")?.appendChild(div);
            });
            const input = document.getElementById('textMessageInput');
            input.value = "";
            textMessage = "";
            input?.focus();
            document.getElementById("textMessages").scrollTo(0, document.getElementById("textMessages")?.scrollHeight);

        } else {
            console.warn("Web socket is not open... Current state: ", socket.readyState);
            alert('Chat unavailable at the moment, try again in 2 seconds...');
        }

    });
})();