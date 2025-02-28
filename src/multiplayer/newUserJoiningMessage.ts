import { onMessage, sendMessage, } from "./initialize_web_socket";

export function newUserJoiningMessage() {
    if (localStorage.getItem("username") !== null) {
        const userinfo = JSON.parse(localStorage.getItem("username"));
        const username = userinfo.username;
        const userID = userinfo.userId;
        console.log(`username ${username} userID: ${userID} JOINED`);
        sendMessage(JSON.stringify({ type: "newuserjoining", username: username, userId: userID }));
    }
}

export const userLeavingMessage =  (function() {
    window.addEventListener("beforeunload", (e) => {
        if (localStorage.getItem("username") !== null) {
            const userinfo = JSON.parse(localStorage.getItem("username"));
            const username = userinfo.username;
            const userID = userinfo.userId;
            sendMessage(JSON.stringify({ type: "userleaving", username: username, userId: userID }));
        }
    });
})();



