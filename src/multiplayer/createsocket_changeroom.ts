
import { initializeSocket } from "./initialize_web_socket";

export const roomId = (function generateroomId(){
    return `room_${Math.random().toString(36).substr(2, 9)}`;
})();

export const playMultiPlayer = (function(roomId) {
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

export const playMultiPlayerAfterUsername = function(roomId) {
        const basePath = '/multi_player/';
        const urlParams = new URLSearchParams(window.location.search);
        const initialRoomId = urlParams.get("room");
        if (initialRoomId && window.location.pathname.includes('/multi_player/chat')) {
            const url = `${window.location.origin}${basePath}chat?room=${initialRoomId}`;
            history.pushState({}, '', url);
            initializeSocket(initialRoomId);
        } else {
            const url = `${window.location.origin}${basePath}chat?room=${roomId}`;
            console.log("url\t", url)
            history.pushState({}, '', url);
            initializeSocket(roomId);
        }
};

const urlParams = new URLSearchParams(window.location.search);
const initialRoomId = urlParams.get("room");
if (initialRoomId && window.location.pathname.includes('/multi_player/chat')) {
    initializeSocket(initialRoomId);
}

