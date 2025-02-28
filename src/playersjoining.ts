import { onMessage, sendMessage } from "./multiplayer/initialize_web_socket";
import { getAllTextMessageState } from "./multiplayer/initialize_web_socket";

// if (localStorage.getItem("username") !== null) {
//     const userinfo = JSON.parse(localStorage.getItem("username"));
//     const username = userinfo.username;
//     const userID = userinfo.userId;
//     console.log(`username ${username} userID: ${userID} JOINED`);
//     sendMessage(JSON.stringify({ type: "join", username: username, userId: userID }));

//     onMessage((e) => {
//         const data = JSON.parse(e);
//         if (data.type === "join") {
//             const joinedChat = document.getElementById("textMessages");
//             const div = document.createElement('div');
//             div.innerHTML = `<div class="chat-footer">
//                 <span class="font-bold italic">${data.username}</span> joined the chat.<br />
//                 <time class="text-xs opacity-50">${new Date(Date.now()).toString().slice(0, 24)}</time>
//             </div>`;
//             joinedChat.appendChild(div);
//         }
//     }); // initial join if they exist
// }



