package com.chicwordle.server;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class ChatWebSocketHandler extends TextWebSocketHandler {
    // private final List<WebSocketSession> sessions = new ArrayList<>();
    private final Map<String, List<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> userMap = new ConcurrentHashMap<>();


    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // sessions.add(session);
        String roomId = getRoomId(session);
        // rooms.computeIfAbsent(roomId, k -> new ArrayList<>()).add(session); // removed 03/02/2025
        List<WebSocketSession> roomSessions = rooms.computeIfAbsent(roomId, k -> new ArrayList<>()); // added 03 02 2025

        // boolean isFirstPlayer = roomSessions.isEmpty();
        roomSessions.add(session);

        System.out.println("Session connected to room: " + roomId + ": " + session.getId());
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

        String msgStr = message.getPayload();
        JSONObject msg = new JSONObject(msgStr);
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.computeIfAbsent(roomId, k -> new ArrayList<>());

        if (msg.getString("type").equals("updatePlayerState") && msg.getString("updateType").equals("addPlayer")) {
            String payload = session.getId();
            String username = msg.getString("username");
            String userId = msg.getString("userId");

            JSONObject user = new JSONObject()
                .put("username", username)
                .put("userId", userId);

            userMap.put(session, user);
            System.out.println("username: " + username + " SessionId Payload:\t" + payload);

            JSONObject sessionId = new JSONObject()
                .put("type", "updatePlayerState")
                .put("updateType", "addPlayer")
                .put("sessionId", session.getId())
                .put("username", username)
                .put("userId", userId)

                .put("playerCount", roomSessions.stream()
                    .map(s -> {
                        JSONObject userInfo = userMap.get(s);
                        return new JSONObject()
                            .put("sessionId", s.getId())
                            .put("username", userInfo != null ? userInfo.getString("username") : "")
                            .put("userId", userInfo != null ? userInfo.getString("userId") : "");
                    }).collect(Collectors.toList()));

            for(WebSocketSession s : roomSessions) {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(sessionId.toString()));
                }
            }



        }
        // if (msg.getString("type").equals("updatePlayerState") && msg.getString("updateType").equals("addPlayer")) {
        //     String username = msg.getString("username");
        //     String userId = msg.getString("userId");
        //     List<Player> allPlayers = playerRooms.getOrDefault(roomId, new ArrayList<>());
        //     boolean isFirstPlayer = allPlayers.isEmpty();
        //     Player newPlayer = new Player(username, userId, new Score(), isFirstPlayer);
        //     allPlayers.add(newPlayer);
        //     playerRooms.put(roomId, allPlayers);
        //     JSONObject jsonMessage = new JSONObject()
        //         .put("type", "updatePlayerState")
        //         .put("updateType", "addPlayer")
        //         .put("userId", userId)
        //         .put("sessionId", session.getId())
        //         .put("username", username) // Replace with username from client
        //         .put("score", new JSONObject().put("letters", new JSONArray()))
        //         .put("isCurrentPlayer", isFirstPlayer)
        //         .put("playerCount", roomSessions.stream()
        //             .map(s -> new JSONObject()
        //                 .put("userId", userId)
        //                 .put("sessionId", s.getId())
        //                 .put("username", username)
        //                 .put("score", new JSONObject().put("letters", new JSONArray()))
        //                 .put("isCurrentPlayer", s == roomSessions.get(0)))
        //             .collect(Collectors.toList()));

        //     List<WebSocketSession> roomSessions2 = rooms.get(roomId);
        //     for (WebSocketSession s : roomSessions2) {
        //         if (s.isOpen()) {
        //             s.sendMessage(new TextMessage(jsonMessage.toString()));
        //         }
        //     }
        // }


        // List<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions != null) {
            String payload = message.getPayload();
            System.out.println("Received payload:\t" + payload);
            for(WebSocketSession s : roomSessions) {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(payload));
                }
            }
        }
    }
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions != null) {
            roomSessions.remove(session);
            if(roomSessions.isEmpty()) {
                rooms.remove(roomId);
            }
        }
        // sessions.remove(session);
        System.out.println("Session disconnected: " + session.getId());
    }

    private String getRoomId(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.startsWith("room=")) {
            return query.substring(5);
        }
        return "default";
    }
}

class Player {
    private String username;
    private String userId;
    private Score score;
    private boolean isCurrentPlayer;

    public Player(String username, String userId, Score score, boolean isCurrentPlayer) {
        this.username = username;
        this.userId = userId;
        this.score = score;
        this.isCurrentPlayer = isCurrentPlayer;
    }
    public String getUsername() {
        return username;
    }
    public String getUserId() {
        return userId;
    }
    public Score getScore() {
        return score;
    }
    public boolean isCurrentPlayer() {
        return isCurrentPlayer;
    }
    public void setScore(Score score) {
        this.score = score;
    }
    public JSONObject toJSONObject() {
        return new JSONObject()
            .put("username", username)
            .put("userId", userId)
            .put("score", score.toJSONObject())
            .put("isCurrentPlayer", isCurrentPlayer);
    }
}
class Score {
    private List<String> letters;

    public Score() {
        this.letters = new ArrayList<>();
    }

    // Getter
    public List<String> getLetters() {
        return letters;
    }

    // Add letter (for score updates)
    public void addLetter(String letter) {
        letters.add(letter);
    }

    // JSON serialization
    public JSONObject toJSONObject() {
        return new JSONObject()
            .put("letters", new JSONArray(letters));
    }
}