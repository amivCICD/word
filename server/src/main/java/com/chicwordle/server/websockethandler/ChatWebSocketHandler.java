package com.chicwordle.server.websockethandler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.chicwordle.server.services.NewGameWordService;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {
    @Autowired
    private NewGameWordService newGameWordService;

    private final Map<String, List<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> userMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> currentPlayerMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> newGameWotdMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> matrixArrayMap = new ConcurrentHashMap<>();
    private final AtomicInteger incRow = new AtomicInteger(0);

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.computeIfAbsent(roomId, k -> new ArrayList<>()); // added 03 02 2025
        roomSessions.add(session);
        System.out.println("Session connected to room: " + roomId + " , sessionId:\t" + session.getId());
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
            boolean isFirstPlayer = roomSessions.isEmpty();

            JSONObject user = new JSONObject()
                .put("username", username)
                .put("userId", userId)
                .put("incRow", incRow)
                .put("isFirstPlayer", isFirstPlayer);

            userMap.put(session, user);
            System.out.println("username: " + username + " SessionId Payload:\t" + payload);

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
                        JSONObject newGameWord = newGameWotdMap.get(s);
                        return new JSONObject()
                            .put("sessionId", s.getId())
                            .put("username", userInfo != null ? userInfo.getString("username") : "")
                            .put("userId", userInfo != null ? userInfo.getString("userId") : "")
                            .put("incRow", userInfo != null ? userInfo.getInt("incRow") : 0)
                            .put("addPlayerWOTD", newGameWord != null ? newGameWord.getString("serverWordOfTheDay") : "")
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
            incRow.set(incRow.incrementAndGet() % 6);
            String currentPlayer = msg.getString("currentPlayer");
            String nextPlayer = msg.getString("nextPlayer");
            // String incRow = msg.getString("incRow");
            // System.out.println("@@@@incRow in ServerSide@@@@\t" + incRow);
            JSONObject current_and_next_player = new JSONObject()
                .put("currentPlayer", currentPlayer)
                .put("incRow", incRow)
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
        if (msg.getString("type").equals("updateServerWord") && msg.getString("updateType").equals("generateNewGameWord")) {
            System.out.println("Generating a new word for a new game on button click");
            newGameWordService.generateNewGameWord();
        }
        if (msg.getString("type").equals("updateGameState") && msg.getString("updateType").equals("resetGameState")) {
            System.out.println("SERVER SAW THE RESET GAME STATE!");
            // WordOfTheDay wotd = new WordOfTheDay();
            // String newGameWord = wotd.newGameWordOfDay(); // lets try using what the front end sent?

            // String wordOfTheDay = msg.getString("wordOfTheDay"); // old

            // WordOfTheDay newGameWordOfTheDay = new WordOfTheDay();
            // String newGameWord = newGameWordOfTheDay.newGameWordOfDay();


            String newGameWord = newGameWordService.getNewGameWord();
            System.out.println("@@@@@@@@@@@ngword in websockerHandler@@@@@@@@\t" + newGameWord + "\t@@@@@@@@");
            // if (newGameWord == null) {
            //     newGameWordService.generateNewGameWord();
            //     newGameWord = newGameWordService.getNewGameWord();
            // }

            JSONObject newGameWotdObject = new JSONObject()
                .put("serverWordOfTheDay", newGameWord);
            newGameWotdMap.put(session, newGameWotdObject);
            // System.out.println("serverWOTD\t" + newGameWord);
            /////////////////////////
            matrixArrayMap.clear();
            incRow.set(0);
            // String resetGameState = msg.getString("resetGameState");
            // String wordOfTheDayLetters = msg.optString("wordOfTheDayLetters", "['', '', '', '', '']");
            JSONObject gameReset = new JSONObject()
                .put("type", "updateGameState")
                .put("updateType", "wordOfDay")
                .put("serverWordOfTheDay", newGameWord)
                // .put("newGameWord", newGameWord)
                .put("whereIsMyShit", "WHERE IS MY SHIT!")
                // .put("resetGameState", resetGameState)
                // .put("wordOfTheDayLetters", wordOfTheDayLetters)
                .put("reset", true);
            for(WebSocketSession s : roomSessions) {
                synchronized(s) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(gameReset.toString()));
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
            // System.out.println("syncMatrix\t" + syncMessage + " SessionId Payload:\t" + payload);
            synchronized (session) {
                if (session.isOpen()) { // this works without all the other bull shit....ORIGINAL
                    session.sendMessage(new TextMessage(syncMatrix.toString()));
                }
            }
        }
        else if (roomSessions != null) { // does this need to be here? what exactly does this do... 08 25 2025 I Believe this was creating your duplicate server logs...
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
        if (msg.getString("type").equals("userleaving")) {
            System.out.println("@@@@ msg.getString('type').equals('userleaving' FIRED OFF");
            roomSessions.remove(session);
            int userCount = roomSessions.size();
            String userId = msg.getString("userId");
            String username = msg.getString("username");

            JSONObject playerCountAndData = new JSONObject()
                .put("type", "userleaving")
                .put("userId", userId)
                .put("username", username)
                .put("userCount", userCount);

            String payload = String.format("{\"type\" : \"userleaving\", \"count\":%d}", userCount);
            for(WebSocketSession s : roomSessions) {
                synchronized(s) {
                    if (s.isOpen()) {
                        // s.sendMessage(new TextMessage(payload));
                        s.sendMessage(new TextMessage(playerCountAndData.toString()));
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