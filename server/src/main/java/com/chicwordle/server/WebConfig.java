package com.chicwordle.server;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/multi_player/chat")
                .setViewName("forward:/multi_player/index.html");
        registry.addViewController("/multi_player/")
                .setViewName("forward:/multi_player/index.html");
    }
}