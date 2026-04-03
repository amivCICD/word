package com.chicwordle.refactorserver.websocket;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.server.ResponseStatusException;

import com.chicwordle.refactorserver.domain.GameEventPayload;
import com.chicwordle.refactorserver.domain.GameEventResponse;
import com.chicwordle.refactorserver.domain.PlayerRemovalResult;
import com.chicwordle.refactorserver.domain.ResetVoteRequest;
import com.chicwordle.refactorserver.service.RoomService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class RoomGameWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper;
    private final RoomService roomService;
    private final RoomChatWebSocketHandler roomChatWebSocketHandler;
    private final Map<String, List<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    public RoomGameWebSocketHandler(ObjectMapper objectMapper, RoomService roomService, RoomChatWebSocketHandler roomChatWebSocketHandler) {
        this.objectMapper = objectMapper;
        this.roomService = roomService;
        this.roomChatWebSocketHandler = roomChatWebSocketHandler;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.computeIfAbsent(roomId, ignored -> new ArrayList<>());
        roomSessions.add(session);

        try {
            GameEventResponse response = new GameEventResponse("roomState", null, roomService.getRoomSnapshot(roomId), null, 0);
            broadcast(roomSessions, objectMapper.writeValueAsString(response));
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode() != HttpStatus.NOT_FOUND) {
                throw exception;
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to broadcast room state", exception);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions == null) {
            return;
        }

        GameEventPayload payload = objectMapper.readValue(message.getPayload(), GameEventPayload.class);
        GameEventResponse response;
        try {
            response = switch (payload.type()) {
                case "append" -> roomService.appendLetter(roomId, payload.userId(), payload.letter());
                case "backspace" -> roomService.backspace(roomId, payload.userId());
                case "submit" -> roomService.submitGuess(roomId, payload.userId());
                case "resetVote" -> new GameEventResponse(
                    "roomState",
                    null,
                    roomService.recordResetVote(roomId, new ResetVoteRequest(payload.userId(), Boolean.TRUE.equals(payload.confirmed()))),
                    null,
                    0
                );
                case "renameUser" -> new GameEventResponse(
                    "roomState",
                    null,
                    roomService.updateUsername(roomId, payload.userId(), payload.username()),
                    null,
                    0
                );
                case "sync" -> new GameEventResponse("roomState", null, roomService.getRoomSnapshot(roomId), null, 0);
                default -> new GameEventResponse("noop", null, roomService.getRoomSnapshot(roomId), null, 0);
            };
        } catch (ResponseStatusException exception) {
            response = new GameEventResponse(
                "roomState",
                exception.getReason(),
                roomService.getRoomSnapshot(roomId),
                null,
                0
            );
        }

        broadcast(roomSessions, objectMapper.writeValueAsString(response));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.get(roomId);
        String userId = getQueryValue(session, "userId");

        if (roomSessions != null) {
            roomSessions.remove(session);
            if (roomSessions.isEmpty()) {
                rooms.remove(roomId);
            }
        }

        if (userId == null || userId.isBlank()) {
            return;
        }

        PlayerRemovalResult removalResult = roomService.removePlayer(roomId, userId);
        if (removalResult.removedUsername() != null) {
            roomChatWebSocketHandler.broadcastSystemMessage(
                roomId,
                "leave",
                removalResult.removedUsername(),
                userId,
                removalResult.removedUsername() + " left the room"
            );
        }

        if (!removalResult.roomDeleted() && removalResult.snapshot() != null) {
            List<WebSocketSession> remainingSessions = rooms.get(roomId);
            if (remainingSessions != null && !remainingSessions.isEmpty()) {
                try {
                    GameEventResponse response = new GameEventResponse("roomState", null, removalResult.snapshot(), null, 0);
                    broadcast(remainingSessions, objectMapper.writeValueAsString(response));
                } catch (IOException exception) {
                    throw new IllegalStateException("Unable to broadcast room state after player removal", exception);
                }
            }
        }
    }

    private void broadcast(List<WebSocketSession> roomSessions, String payload) throws IOException {
        for (WebSocketSession roomSession : roomSessions) {
            synchronized (roomSession) {
                if (roomSession.isOpen()) {
                    roomSession.sendMessage(new TextMessage(payload));
                }
            }
        }
    }

    private String getRoomId(WebSocketSession session) {
        String roomId = getQueryValue(session, "room");
        return roomId != null ? roomId : "default";
    }

    private String getQueryValue(WebSocketSession session, String key) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query == null || query.isBlank()) {
            return null;
        }

        String[] params = query.split("&");
        for (String param : params) {
            String[] keyValue = param.split("=", 2);
            if (keyValue.length == 2 && key.equals(keyValue[0])) {
                return keyValue[1];
            }
        }
        return null;
    }
}
