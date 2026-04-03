package com.chicwordle.refactorserver.store;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.chicwordle.refactorserver.domain.RoomState;

@Component
public class RoomStore {
    private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();

    public RoomState find(String roomId) {
        return rooms.get(roomId);
    }

    public RoomState save(RoomState roomState) {
        rooms.put(roomState.getRoomId(), roomState);
        return roomState;
    }

    public void delete(String roomId) {
        rooms.remove(roomId);
    }
}
