export const roomId = (function generateRoomId(){
    return `room_${Math.random().toString(36).substr(2, 9)}`;
})();
