import { sendMessage, getPlayerState, onMessage, getCurrentKeyboardState } from "../socket_related/initialize_web_socket";
import { getGameState } from "../socket_related/initialize_web_socket";

export function newUserJoiningMessage() {
    const state = getGameState();
    const playerState = getPlayerState();
    if (localStorage.getItem("username") !== null) {
        const userinfo = JSON.parse(localStorage.getItem("username"));
        const username = userinfo.username;
        const userId = userinfo.userId;


        sendMessage(JSON.stringify({ // for text messages
            type: "newuserjoining",
            username: username,
            userId: userId.toString(),
        }));

        sendMessage(JSON.stringify({
            type: "updatePlayerState",
            updateType: "addPlayer",
            username: username,
            userId: userId.toString(),
            score: { letters: [] },
            wordRowArrayState: JSON.stringify(state.wordRowArrayState),
            keyboardState: JSON.stringify(getCurrentKeyboardState().map((key) => ({ class: key.className.value })))
            // incRow: JSON.stringify(state.incRow) // the server is handling incRow, shouldnt need this 03 31 2025
            // gameState: JSON.stringify(state)
            // matrixArray: JSON.stringify(state.matrixArray) // was working, moving to above 03 05 2025
            // isCurrentPlayer: !playerState.allPlayers.length
        }));


    }
}

export const userLeavingMessage =  (function() {
    window.addEventListener("beforeunload", (e) => {
        if (localStorage.getItem("username") !== null) {
            const userinfo = JSON.parse(localStorage.getItem("username"));
            const username = userinfo.username;
            const userID = userinfo.userId.toString();
            sendMessage(JSON.stringify({ type: "userleaving", username: username, userId: userID }));
            // sendMessage(JSON.stringify({ type: "updatePlayerState", updateType: "removePlayer", userId: userID })); // remove for now 03 02 2025
        }
    });
})();



