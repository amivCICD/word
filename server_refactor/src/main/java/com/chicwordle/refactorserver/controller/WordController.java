package com.chicwordle.refactorserver.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chicwordle.refactorserver.domain.WordOfDayResponse;
import com.chicwordle.refactorserver.service.WordService;

@RestController
public class WordController {
    private final WordService wordService;

    public WordController(WordService wordService) {
        this.wordService = wordService;
    }

    @GetMapping("/api/word-of-the-day")
    public WordOfDayResponse getWordOfTheDay() {
        return wordService.getWordOfTheDay();
    }

    @GetMapping("/wordoftheday")
    public Map<String, Object> getLegacyWordOfTheDay() {
        WordOfDayResponse response = wordService.getWordOfTheDay();
        Map<String, Object> payload = new HashMap<>();
        payload.put("word", response.word());
        payload.put("wordDefinition", wordService.getDefinition(response.word()));
        return payload;
    }

    @GetMapping("/newgameword")
    public Map<String, Object> getLegacyNewGameWord() {
        String word = wordService.getRandomRoomWord();
        Map<String, Object> payload = new HashMap<>();
        payload.put("word", word);
        payload.put("wordDefinition", wordService.getDefinition(word));
        return payload;
    }
}
