package com.chicwordle.refactorserver.websocket;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.chicwordle.refactorserver.domain.ChatEnvelope;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class RoomChatWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper;
    private final Map<String, List<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    public RoomChatWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomId = getRoomId(session);
        rooms.computeIfAbsent(roomId, ignored -> new ArrayList<>()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions == null) {
            return;
        }

        ChatEnvelope envelope = objectMapper.readValue(message.getPayload(), ChatEnvelope.class);
        String payload = objectMapper.writeValueAsString(envelope);
        broadcast(roomSessions, payload);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = getRoomId(session);
        List<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions == null) {
            return;
        }

        roomSessions.remove(session);
        if (roomSessions.isEmpty()) {
            rooms.remove(roomId);
        }
    }

    public void broadcastSystemMessage(String roomId, String type, String username, String userId, String message) {
        List<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions == null || roomSessions.isEmpty()) {
            return;
        }

        try {
            String payload = objectMapper.writeValueAsString(new ChatEnvelope(type, username, userId, message));
            broadcast(roomSessions, payload);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to broadcast chat system message", exception);
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
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null && query.startsWith("room=")) {
            return query.substring(5);
        }
        return "default";
    }
}
