// import { socket } from "./sendTextMessage";
import { onMessage, sendMessage } from "./multiplayer/initialize_web_socket";

if (localStorage.getItem("username") !== null) {
    const userinfo = JSON.parse(localStorage.getItem("username"));
    const username = userinfo.username;
    const userID = userinfo.id;
    console.log(`username ${username} userID: ${userID}`);
    sendMessage(JSON.stringify({ type: 'join', username: username, id: userID }))
    onMessage(e => console.log(`event socket.onmessage:\t${e}`));
}



