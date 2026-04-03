package com.chicwordle.refactorserver.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageForwardController {

    @GetMapping("/multi_player_refactor")
    public String multiPlayerRefactorRoot() {
        return "forward:/multi_player_refactor/index.html";
    }

    @GetMapping("/multi_player_refactor/")
    public String multiPlayerRefactorSlash() {
        return "forward:/multi_player_refactor/index.html";
    }

    @GetMapping("/multi_player")
    public String multiPlayerRoot() {
        return "forward:/multi_player/index.html";
    }

    @GetMapping("/multi_player/")
    public String multiPlayerSlash() {
        return "forward:/multi_player/index.html";
    }
}
