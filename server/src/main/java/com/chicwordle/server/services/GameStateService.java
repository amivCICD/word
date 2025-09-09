package com.chicwordle.server.services;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.json.JSONObject;
import org.springframework.stereotype.Service;

@Service
public class GameStateService {
    private final Map<String, JSONObject> gameStateMaps = new ConcurrentHashMap<>();

    public JSONObject getGameState(String roomId) {
        return gameStateMaps.get(roomId);
    }
    public void updateGameState(String roomId, JSONObject state) {
        gameStateMaps.put(roomId, state);
    }
    public Map<String, JSONObject> getAllGameStates() {
        return gameStateMaps;
    }
}
