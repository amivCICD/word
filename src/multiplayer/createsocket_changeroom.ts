// import { roomId } from "./generateRoomId";
import { initializeSocket } from "./initialize_web_socket";
import { windowLocationOrigin } from "../window_api_url";

export const roomId = (function generateroomId(){
    return `room_${Math.random().toString(36).substr(2, 9)}`;
})();

export const playMultiPlayer = (function(roomId) {
    console.log('roomId from playMultiPlayer event listener\t', roomId);
    document.getElementById("startGameButton")?.addEventListener('click', () => {
        // const urlParams = new URLSearchParams(window.location.search);
        const basePath = '/multi_player/'
        console.log('window.location.origin\t', window.location.origin)
        const url = `${window.location.origin}${basePath}chat?room=${roomId}`;
        console.log("url\t", url)
        history.pushState({}, '', url);
        // window.location.href = url;
        initializeSocket(roomId);
    });
})(roomId);

const urlParams = new URLSearchParams(window.location.search);
const initialRoomId = urlParams.get("room");
if (initialRoomId && window.location.pathname.includes('/multi_player/chat')) {
    initializeSocket(initialRoomId);
}

