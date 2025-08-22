package com.chicwordle.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.chicwordle.server.websockethandler.ChatWebSocketHandler;

// @Configuration // old
// @EnableWebSocket
// public class WebSocketConfig implements WebSocketConfigurer {
//     @Override
//     public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
//         registry.addHandler(new ChatWebSocketHandler(), "/chat").setAllowedOrigins("*");
//     }
// }

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final ChatWebSocketHandler chatWebSocketHandler;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/chat").setAllowedOrigins("*");
    }
}