package com.chicwordle.server.websockethandler;

import java.nio.charset.StandardCharsets;
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
    private final Map<WebSocketSession, JSONObject> currentPlayerMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> newGameWotdMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> matrixArrayMap = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, JSONObject> keyboardStateMap = new ConcurrentHashMap<>();
    private final AtomicInteger incRow = new AtomicInteger(0);
    private int i = 0;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.computeIfAbsent(roomId, k -> new ArrayList<>()); // added 03 02 2025
        if (!roomSessions.contains(session)) {
            roomSessions.add(session);
        }
        System.out.println("Session connected to room: " + roomId + " , sessionId:\t" + session.getId());

    }
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String msgStr = message.getPayload();
        JSONObject msg = new JSONObject(msgStr);
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.get(roomId);

        if (msg.getString("type").equals("updatePlayerState") && msg.getString("updateType").equals("addPlayer")) {
            String payload = session.getId();
            String username = msg.getString("username");
            System.out.println("@@@@username from addPlayer\t" + username);
            String userId = msg.getString("userId");
            boolean isFirstPlayer = roomSessions.isEmpty();
            System.out.println("addPlayer incRow.get()\t" + incRow.get());

            JSONObject user = new JSONObject()
                .put("username", username)
                .put("userId", userId)
                .put("incRow", incRow.get())
                .put("isFirstPlayer", isFirstPlayer);
            System.out.println("User\t" + user);

            if (!currentPlayerMap.containsKey(session)) {
                currentPlayerMap.put(session, user);
            }
            System.out.println("username: " + username + "\nSessionId Payload:\t" + payload);

            getPlayers();


            JSONObject playerDataPayload = new JSONObject()
                .put("type", "updatePlayerState")
                .put("updateType", "addPlayer")
                // .put("sessionId", session.getId())
                // .put("username", username)
                // .put("userId", userId)
                // .put("isFirstPlayer", isFirstPlayer)
                .put("playerCount", roomSessions.stream()
                    .map(s -> {
                        JSONObject currentPlayerInfo = currentPlayerMap.get(s);
                        JSONObject matrixInfo = matrixArrayMap.get(s);
                        JSONObject keyboardInfo = keyboardStateMap.get(s);
                        JSONObject newGameWord = newGameWotdMap.get(s);
                        return new JSONObject()
                            .put("sessionId", s.getId())
                            .put("username", currentPlayerInfo != null ? currentPlayerInfo.optString("username", "") : "")
                            .put("userId", currentPlayerInfo != null ? currentPlayerInfo.optString("userId", "") : "")
                            .put("incRow", incRow.get())
                            // .put("incRow", currentPlayerInfo != null ? currentPlayerInfo.optInt("incRow", 0) : 0)
                            // .put("incRow", currentPlayerInfo != null ? currentPlayerInfo.getInt("incRow") : 0)
                            .put("addPlayerWOTD", newGameWord != null ? newGameWord.optString("serverWordOfTheDay", "") : "")
                            .put("wordRowArrayState", matrixInfo != null ? matrixInfo.optString("wordRowArrayState", "[]") : "[]")
                            .put("keyboardState", keyboardInfo != null ? keyboardInfo.optString("keyboardState", "[]") : "[]")
                            .put("isFirstPlayer", currentPlayerInfo != null && currentPlayerInfo.optBoolean("isFirstPlayer", false));
                    }).collect(Collectors.toList()));
                    // System.out.println("playerDataPayload\t" + playerDataPayload.toString());
                    System.out.println("Payload size: " + playerDataPayload.toString().getBytes(StandardCharsets.UTF_8).length + " bytes");
                    System.out.println("----------currentPlayerMap.get(s)------------");
                    roomSessions.forEach(s -> {
                        JSONObject dbg = currentPlayerMap.get(s);
                        System.out.println("Room session: " + s.getId() + " -> " + (dbg != null ? dbg.toString() : "null"));
                    });
                    System.out.println("---------^currentPlayerMap.get(s)^-----------");

            for(WebSocketSession s : roomSessions) { // 09 04 2025 when we dont broadcast to all, then players dont swap, but we also dont crash the server...
                synchronized (s) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(playerDataPayload.toString()));
                    }
                }
            }
        }
        if (msg.getString("type").equals("updatePlayerState") && msg.getString("updateType").equals("getSyncedKeyboardCSS")) {
            JSONObject keyboardState = keyboardStateMap.get(session);
            if (keyboardState == null) {
                System.out.println("keyboardState is empty");
            }
            JSONObject syncedKeyboard = new JSONObject()
                .put("type", "updatePlayerState")
                .put("updateType", "getSyncedKeyboardCSS")
                .put("test", "test")
                .put("keyboardState", keyboardState);

            synchronized (session) {
                if (session.isOpen()) {
                    System.out.println("@@@@syncedKeyboard.toString()\t" + syncedKeyboard.toString());
                    session.sendMessage(new TextMessage(syncedKeyboard.toString()));
                }
            }
        }
        if (msg.getString("type").equals("updatePlayerState") && msg.getString("updateType").equals("nextPlayer")) {

            String frontEndIncRow = msg.getString("incRow");
            // if (msg.getString("didQuit").equals("false")) {
                System.out.println("@@@@nextPlayer frontEndIncRow in ServerSide@@@@\t" + frontEndIncRow);
                System.out.println("@@@@nextPlayer incRow in ServerSide Before Increment@@@@\t" + incRow);
                incRow.set(incRow.incrementAndGet() % 6);
                System.out.println("@@@@nextPlayer incRow in ServerSide@@@@\t" + incRow);
            // }
            // we are calling this when a player leaves in order to move to next player, and therefore incrementing twice, but front end doesnt stick with this inc row
            // happens in typeout guess, the player_swap()

            ////////////////
            String currentPlayer = msg.getString("currentPlayer");
            String nextPlayer = msg.getString("nextPlayer");
            ////////////////////
            // JSONObject currentPlayer = new JSONObject(msg.getString("currentPlayer"));
            // JSONObject nextPlayer = new JSONObject(msg.getString("nextPlayer"));

            JSONObject current_and_next_player = new JSONObject()
                .put("currentPlayer", currentPlayer)
                .put("incRow", incRow.get())
                .put("nextPlayer", nextPlayer);
            // currentPlayerMap.put(session, current_and_next_player);

            JSONObject currentPlayers = new JSONObject()
                .put("type", "updatePlayerState")
                .put("updateType", "nextPlayer")
                .put("sessionId", session.getId())
                .put("incRow", incRow.get())
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
            String userWhoClicked = msg.getString("userWhoClicked");
            String newGameWord = newGameWordService.getNewGameWord();
            System.out.println("@@@@@@@@@@@ngword in websockerHandler@@@@@@@@\t" + newGameWord + "\t@@@@@@@@");

            JSONObject newGameWotdObject = new JSONObject()
                .put("serverWordOfTheDay", newGameWord);
            newGameWotdMap.put(session, newGameWotdObject);

            // currentPlayerMap.clear(); // 09 04 2025 added to test, then removed!
            matrixArrayMap.clear();
            keyboardStateMap.clear();
            incRow.set(0);
            System.out.println("incRow.get() in resetGameState\t" + incRow.get());
            boolean resetGameState = true;
            JSONObject gameReset = new JSONObject()
                .put("type", "updateGameState")
                .put("updateType", "wordOfDay")
                .put("serverWordOfTheDay", newGameWord)
                .put("incRow", incRow.get())
                .put("userWhoClicked", userWhoClicked)
                .put("whereIsMyShit", "WHERE IS MY SHIT!")
                .put("resetGameState", resetGameState)
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
            String matrixArrayStr = msg.optString("wordRowArrayState", "[[{class: '', value: ''}]]");
            JSONObject matrix = new JSONObject().put("wordRowArrayState", matrixArrayStr);
            matrixArrayMap.put(session, matrix);

            // for (Map.Entry<WebSocketSession, JSONObject> entry : currentPlayerMap.entrySet()) {
            //     WebSocketSession sess = entry.getKey();
            //     JSONObject playerData = entry.getValue();
            //     if (sess.isOpen()) {
            //         System.out.println("PlayerData\t" + playerData + " " + sessionId);
            //     }
            // }
            // getPlayers();
        }
        if (msg.getString("type").equals("updateKeyboardState")) {
            String keyboardStateStr = msg.optString("keyboardState", "[{ class: '', value: '' }]");
            JSONObject kbState = new JSONObject().put("keyboardState", keyboardStateStr);
            keyboardStateMap.put(session, kbState);
        } else if (roomSessions != null) { // 08 26 2025, this is what is letting your append letters go through...
            String payload = message.getPayload();
            for(WebSocketSession s : roomSessions) {
                synchronized(s) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(payload));
                    }
                }
            }
        }

        if (msg.getString("type").equals("userleaving")) {
            currentPlayerMap.remove(session);
            matrixArrayMap.remove(session);
            keyboardStateMap.remove(session);
            newGameWotdMap.remove(session);

            roomSessions.remove(session);
            int userCount = roomSessions.size();
            String userId = msg.getString("userId");
            String username = msg.getString("username");

            JSONObject playerCountAndData = new JSONObject()
                .put("type", "userleaving")
                .put("userId", userId)
                .put("username", username)
                .put("userCount", userCount);

            for(WebSocketSession s : roomSessions) {
                synchronized(s) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(playerCountAndData.toString()));
                    }
                }
            }
        }
    }
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // incRow.set(0);
        i = 0;
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions != null) {
            roomSessions.remove(session);
            if(roomSessions.isEmpty()) {
                rooms.remove(roomId);
            }
        }
        currentPlayerMap.remove(session);
        matrixArrayMap.remove(session);
        keyboardStateMap.remove(session);
        newGameWotdMap.remove(session);

        System.out.println("Session disconnected: " + session.getId());
    }
    private String getRoomId(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.startsWith("room=")) {
            return query.substring(5);
        }
        return "default";
    }
    private void getPlayers() {
        currentPlayerMap.forEach((player, json) -> {
            System.out.println("------------------------------");
            System.out.println("player\t" + player + "\nJSONObject\t" + json.toString() + " count\t" + i);
            System.out.println("------------------------------");
            i++;
        });
    }
    private void setPlayer(WebSocketSession session, String username, String userId, int incRow) {
        JSONObject playerInfo = new JSONObject()
            .put("username", username)
            .put("userId", userId)
            .put("incRow", incRow);
        currentPlayerMap.put(session, playerInfo);
    }
}