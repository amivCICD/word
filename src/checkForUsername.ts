// check for existing username
// import { socket } from "./sendTextMessage";
import { sendMessage } from "./multiplayer/initialize_web_socket";


export const usernameExists = (function checkForExistingUsername() {
    let username = false;
    const storedUserName = localStorage.getItem("username");
        if (storedUserName !== null && storedUserName !== undefined) {
                const usernameInfo = JSON.parse(localStorage?.getItem("username"));
                username = usernameInfo?.username;
                sendMessage({ type: 'usernameUpdate', message: username });
                return username;
            }
        else {
            console.warn('Username not yet set!');
        }
    return username;
})();
