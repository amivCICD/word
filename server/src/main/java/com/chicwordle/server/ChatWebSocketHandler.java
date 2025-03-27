package com.chicwordle.server;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.json.JSONObject;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class ChatWebSocketHandler extends TextWebSocketHandler {
    // private final List<WebSocketSession> sessions = new ArrayList<>();
    private final Map<String, List<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> userMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> currentPlayerMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> matrixArrayMap = new ConcurrentHashMap<>();


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
            String incRow = msg.getString("incRow");
            boolean isFirstPlayer = roomSessions.isEmpty();

            JSONObject user = new JSONObject()
                .put("username", username)
                .put("userId", userId)
                .put("incRow", incRow)
                .put("isFirstPlayer", isFirstPlayer);

            userMap.put(session, user);
            System.out.println("username: " + username + " SessionId Payload:\t" + payload); // line 46

            JSONObject sessionId = new JSONObject()
                .put("type", "updatePlayerState")
                .put("updateType", "addPlayer")
                .put("sessionId", session.getId())
                .put("username", username)
                .put("userId", userId)
                .put("isFirstPlayer", isFirstPlayer)
                .put("playerCount", roomSessions.stream()
                    .map(s -> {
                        JSONObject userInfo = userMap.get(s);
                        JSONObject matrixInfo = matrixArrayMap.get(s);
                        return new JSONObject()
                            .put("sessionId", s.getId())
                            .put("username", userInfo != null ? userInfo.getString("username") : "")
                            .put("userId", userInfo != null ? userInfo.getString("userId") : "")
                            .put("incRow", userInfo != null ? userInfo.getString("incRow") : "")
                            .put("wordRowArrayState", matrixInfo != null ? matrixInfo.getString("wordRowArrayState") : "[]")
                            .put("isFirstPlayer", userInfo != null && userInfo.getBoolean("isFirstPlayer"));
                    }).collect(Collectors.toList()));
            for(WebSocketSession s : roomSessions) {
                synchronized (s) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(sessionId.toString()));
                    }
                }
            }
        }
        if (msg.getString("type").equals("updatePlayerState") && msg.getString("updateType").equals("nextPlayer")) {
            String currentPlayer = msg.getString("currentPlayer");
            String nextPlayer = msg.getString("nextPlayer");
            String incRow = msg.getString("incRow");
            System.out.println("@@@@incRow in ServerSide@@@@\t" + incRow);
            JSONObject current_and_next_player = new JSONObject()
                .put("currentPlayer", currentPlayer)
                .put("nextPlayer", nextPlayer);
            currentPlayerMap.put(session, current_and_next_player);

            JSONObject currentPlayers = new JSONObject()
                .put("type", "updatePlayerState")
                .put("updateType", "nextPlayer")
                .put("sessionId", session.getId())
                .put("incRow", incRow)
                .put("currentPlayer", currentPlayer)
                .put("nextPlayer", nextPlayer);

            String playerMessage = currentPlayers.toString();
            for(WebSocketSession s : roomSessions) {
                synchronized (s) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(playerMessage));
                    }
                }
            }
        }

        if (msg.getString("type").equals("syncWordRowArrayState")) {
            String payload = session.getId();
            String matrixArrayStr = msg.optString("wordRowArrayState", "[[{class: '', value: ''}]]");
            // String incRow = msg.getString("incRow");

            JSONObject matrix = new JSONObject().put("wordRowArrayState", matrixArrayStr);
            matrixArrayMap.put(session, matrix);
            matrixArrayMap.forEach((key, val) -> {
                // System.out.println("matrixArrayMap updates: " + val.toString()); // shows word row array state
            });
            // System.out.println("matrixArray\t" + matrixArrayStr + " SessionId Payload:\t" + payload);
            JSONObject syncMatrix = new JSONObject()
                .put("type", "updateGameState")
                .put("updateType", "syncMatrix")
                .put("sessionId", session.getId())
                // .put("incRow", incRow)
                .put("wordRowArrayState", matrixArrayStr);
            String syncMessage = syncMatrix.toString();
            // System.out.println("syncMatrix\t" + syncMessage + " SessionId Payload:\t" + payload);
            synchronized (session) {
                if (session.isOpen()) { // this works without all the other bull shit....ORIGINAL
                    session.sendMessage(new TextMessage(syncMatrix.toString()));
                }
            }
        }
        else if (roomSessions != null) {
            String payload = message.getPayload();
            // System.out.println("Received payload:\t" + payload);
            for(WebSocketSession s : roomSessions) {
                synchronized(s) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(payload));
                    }
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

// class Player {
//     private String username;
//     private String userId;
//     private Score score;
//     private boolean isCurrentPlayer;

//     public Player(String username, String userId, Score score, boolean isCurrentPlayer) {
//         this.username = username;
//         this.userId = userId;
//         this.score = score;
//         this.isCurrentPlayer = isCurrentPlayer;
//     }
//     public String getUsername() {
//         return username;
//     }
//     public String getUserId() {
//         return userId;
//     }
//     public Score getScore() {
//         return score;
//     }
//     public boolean isCurrentPlayer() {
//         return isCurrentPlayer;
//     }
//     public void setScore(Score score) {
//         this.score = score;
//     }
//     public JSONObject toJSONObject() {
//         return new JSONObject()
//             .put("username", username)
//             .put("userId", userId)
//             .put("score", score.toJSONObject())
//             .put("isCurrentPlayer", isCurrentPlayer);
//     }
// }
// class Score {
//     private List<String> letters;

//     public Score() {
//         this.letters = new ArrayList<>();
//     }

//     // Getter
//     public List<String> getLetters() {
//         return letters;
//     }

//     // Add letter (for score updates)
//     public void addLetter(String letter) {
//         letters.add(letter);
//     }

//     // JSON serialization
//     public JSONObject toJSONObject() {
//         return new JSONObject()
//             .put("letters", new JSONArray(letters));
//     }
// }