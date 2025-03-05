import { sendMessage, getPlayerState } from "./initialize_web_socket";
import { getGameState } from "./initialize_web_socket";

export function newUserJoiningMessage() {
    const state = getGameState();
    const playerState = getPlayerState();
    if (localStorage.getItem("username") !== null) {
        const userinfo = JSON.parse(localStorage.getItem("username"));
        const username = userinfo.username;
        const userId = userinfo.userId;
        // console.log(`username ${username} userID: ${userID} JOINED`);
        // let randomPlayerChoice = Math.floor(Math.random() * playerState.allPlayers.length);
        // const currentPlayer = playerState.allPlayers[randomPlayerChoice];
        // userinfo.isCurrentUser = false;


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
            matrixArray: JSON.stringify(state.matrixArray)
            // isCurrentPlayer: !playerState.allPlayers.length
        }));


    }
}

export const userLeavingMessage =  (function() {
    window.addEventListener("beforeunload", (e) => {
        if (localStorage.getItem("username") !== null) {
            const userinfo = JSON.parse(localStorage.getItem("username"));
            const username = userinfo.username;
            const userID = userinfo.userId;
            sendMessage(JSON.stringify({ type: "userleaving", username: username, userId: userID }));
            // sendMessage(JSON.stringify({ type: "updatePlayerState", updateType: "removePlayer", userId: userID })); // remove for now 03 02 2025
        }
    });
})();



