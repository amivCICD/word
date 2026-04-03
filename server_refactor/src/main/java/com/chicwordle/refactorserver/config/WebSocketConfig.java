package com.chicwordle.refactorserver.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.chicwordle.refactorserver.websocket.RoomGameWebSocketHandler;
import com.chicwordle.refactorserver.websocket.RoomChatWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final RoomChatWebSocketHandler roomChatWebSocketHandler;
    private final RoomGameWebSocketHandler roomGameWebSocketHandler;

    public WebSocketConfig(
        RoomChatWebSocketHandler roomChatWebSocketHandler,
        RoomGameWebSocketHandler roomGameWebSocketHandler
    ) {
        this.roomChatWebSocketHandler = roomChatWebSocketHandler;
        this.roomGameWebSocketHandler = roomGameWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(roomChatWebSocketHandler, "/ws/chat")
            .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://word.es9.app");
        registry.addHandler(roomGameWebSocketHandler, "/ws/game")
            .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://word.es9.app");
    }
}
