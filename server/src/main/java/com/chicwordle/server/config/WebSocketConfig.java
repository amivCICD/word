package com.chicwordle.server.config;

import org.apache.tomcat.websocket.server.WsServerContainer;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.chicwordle.server.websockethandler.ChatWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/chat")
                .setAllowedOrigins("*");
    }

    /**
     * Customize the embedded Tomcat to increase the max buffer sizes for text and binary messages.
     * This replaces the old ServletServerContainerFactoryBean approach.
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatWebSocketCustomizer() {
        return factory -> factory.addContextCustomizers(context -> {
            WsServerContainer container = (WsServerContainer) context.getServletContext()
                    .getAttribute("jakarta.websocket.server.ServerContainer");
            if (container != null) {
                // Increase max text and binary message buffer sizes
                container.setDefaultMaxTextMessageBufferSize(1024 * 1024);   // 128 KB
                container.setDefaultMaxBinaryMessageBufferSize(1024 * 1024); // 128 KB
            }
        });
    }
}
