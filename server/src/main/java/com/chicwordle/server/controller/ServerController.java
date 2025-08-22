package com.chicwordle.server.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chicwordle.server.WordOfTheDay;
import com.chicwordle.server.services.NewGameWordService;

import jakarta.annotation.PostConstruct;

@RestController
@CrossOrigin(origins = "http://localhost:5173") // use for dev
// @CrossOrigin(origins = "http://localhost:1985") // remove for production
public class ServerController {
	private final WordOfTheDay wordOfTheDay = new WordOfTheDay();

    @Autowired
    private NewGameWordService newGameWordService;

    @PostConstruct
    public void initNewGameWord() { newGameWordService.initNewGameWord(); }

	@GetMapping(value = "/wordoftheday", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, String> dailyWordMap() {
         // prepare service to have a word on new game click
		Map<String, String> response = new HashMap<>();
		response.put("word", wordOfTheDay.setSQLWordOfDay().dailyWord());
		return response;
	}
	@GetMapping(value = "/newgameword", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, String> newGameWordMap() {
		Map<String, String> response = new HashMap<>();

        System.out.println("```newGameWordService.getNewGameWord()```\t" + newGameWordService.getNewGameWord());
        response.put("word", newGameWordService.getNewGameWord());
		// response.put("word", wordOfTheDay.newGameWordOfDay()); // old, generates too many random words.. 08 22 2025
		return response;
	}
	@GetMapping("/error")
	public String handleError() {
		return "Error, no comprende";
	}
}