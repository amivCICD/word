package com.chicwordle.server.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chicwordle.server.WordOfTheDay;
import com.chicwordle.server.services.GameStateService;
import com.chicwordle.server.services.NewGameWordService;
import com.chicwordle.server.wotddefinition.WordDefinitionFetch;

import jakarta.annotation.PostConstruct;

@RestController
// @CrossOrigin(origins = "http://localhost:5173") // use for dev
// @CrossOrigin(origins = "http://localhost:1985") // use for dev
@CrossOrigin(origins = { "http://localhost:1985", "https://word.es9.app", "http://localhost:5173" }) // remove for production
public class ServerController {
	private final GameStateService gameStateService;
	private final WordOfTheDay wordOfTheDay = new WordOfTheDay();

    @Autowired
    private NewGameWordService newGameWordService;

	public ServerController(GameStateService gameStateService) {
		this.gameStateService = gameStateService;
	}

    @PostConstruct
    public void initNewGameWord() { newGameWordService.initNewGameWord(); }

	@GetMapping(value = "/wordoftheday", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> dailyWordMap() {
         // prepare service to have a word on new game click
		Map<String, Object> response = new HashMap<>();
		String word = wordOfTheDay.setSQLWordOfDay().dailyWord();
		response.put("word", word);

		WordDefinitionFetch wordDefinitionFetch = new WordDefinitionFetch(word);
		try {
			// wordDefinitionFetch.fetchDefinition();
			wordDefinitionFetch.fetchDefinition();
			List<String> wordDefinition = wordDefinitionFetch.getDefinition();
			response.put("wordDefinition", wordDefinition);
		} catch (Exception e) {
			e.printStackTrace();
			response.put("wordDefinition", "Definition Unavailable");
		}

		return response;
	}
	@GetMapping(value = "/newgameword", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> newGameWordMap() {
		Map<String, Object> response = new HashMap<>();

		String word = newGameWordService.getNewGameWord();
        System.out.println("```newGameWordService.getNewGameWord()```\t" + word);
        response.put("word", word);

		WordDefinitionFetch wordDefinitionFetch = new WordDefinitionFetch(word);
		try {
			wordDefinitionFetch.fetchDefinition();
			List<String> wordDefinition = wordDefinitionFetch.getDefinition();
			response.put("wordDefinition", wordDefinition);

		} catch (Exception e) {
			e.printStackTrace();
			response.put("wordDefinition", "Definition Unavailable");
		}
		// response.put("word", wordOfTheDay.newGameWordOfDay()); // old, generates too many random words.. 08 22 2025
		return response;
	}

	@GetMapping(value = "/api/getgamestate", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Map<String, Object>> getGameState(@RequestParam String roomId) {
		JSONObject state = gameStateService.getGameState(roomId);
		if (state == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(state.toMap());
	}

	@GetMapping("/error")
	public String handleError() {
		return "Error, no comprende";
	}
}