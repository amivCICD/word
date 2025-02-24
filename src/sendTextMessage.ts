const socket = new WebSocket("ws://localhost:1985/chat");
socket.onopen = () => console.log("connected to web sockets!");
socket.onclose = () => console.log("Disconnected...");
socket.onerror = (error) => console.log("ERROR: \t", error);

let textMessage = "";


(function sendTextMessage() {
    document.getElementById('textMessageInput')?.addEventListener('input', e => {
        textMessage = e.target.value;
    });
    document.getElementById("sendTextBtn").addEventListener('click', () => {
        if (socket.readyState === WebSocket.OPEN) {
            if (textMessage === "") return;
            const username = JSON.parse(localStorage.getItem("username"));
            socket.send(JSON.stringify({ type: 'text', username, message: textMessage }));
            socket.onmessage = ((e) => {
                let div = document.createElement('div');

                console.log('e.data\t', JSON.parse(e.data));
                const data = JSON.parse(e.data);
                if (data.username.id !== username.id) {
                    div.innerHTML = `
                    <div class="chat chat-end">
                        <div class="chat-bubble bg-green-300 text-white"><span class="font-bold">${data.username.username}</span>: ${data.message}</div>
                    </div>
                    `;
                } else {
                    div.innerHTML = `
                    <div class="chat chat-start">
                        <div class="chat-bubble bg-pink-300 text-white"><span class="font-bold">${data.username.username}</span>: ${data.message}</div>
                    </div>
                    `;
                }

                document.getElementById("textMessages")?.appendChild(div);
                const textMessages = document.getElementById("textMessages");
                textMessages.scrollTo(0, textMessages.scrollHeight);
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

(function sendTextMessageWenter(socket, textMessage) {
    // let textMessage = "";
    // document.getElementById('textMessageInput')?.addEventListener('input', e => {
    //     textMessage = e.target.value;
    // });
    document.addEventListener('keyup', e => {

        console.log('e.keyCode\t', e.keyCode)
        if (!window.textMessageOnly) return;
        if (e.keyCode !== 13) {
            return;
        } else if (e.keyCode === 13 && window.textMessageOnly) {
            if (socket.readyState === WebSocket.OPEN) {
                const input = document.getElementById('textMessageInput');
                if (input.value === "") return;
                const username = JSON.parse(localStorage.getItem("username"));
                socket.send(JSON.stringify({ type: 'text', username, message: input.value }));
                socket.onmessage = ((e) => {
                    let div = document.createElement('div');

                    console.log('e.data\t', JSON.parse(e.data));
                    const data = JSON.parse(e.data);
                    if (data.username.id !== username.id) {
                        div.innerHTML = `
                        <div class="chat chat-end">
                            <div class="chat-bubble bg-green-300 text-white"><span class="font-bold">${data.username.username}</span>: ${data.message}</div>
                        </div>
                        `;
                    } else {
                        div.innerHTML = `
                        <div class="chat chat-start">
                            <div class="chat-bubble bg-pink-300 text-white"><span class="font-bold">${data.username.username}</span>: ${data.message}</div>
                        </div>
                        `;
                    }

                    document.getElementById("textMessages")?.appendChild(div);
                    const textMessages = document.getElementById("textMessages");
                    textMessages.scrollTo(0, textMessages.scrollHeight);
                });
                // const input = document.getElementById('textMessageInput');
                input.value = "";
                textMessage = "";
                input?.focus();



                    const expandContent = document.querySelector('.collapse-content')


            } else {
                console.warn("Web socket is not open... Current state: ", socket.readyState);
                alert('Chat unavailable at the moment, try again in 2 seconds...');
            }
        }
    });
})(socket, textMessage);