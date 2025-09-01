package com.chicwordle.server.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chicwordle.server.WordOfTheDay;
import com.chicwordle.server.services.NewGameWordService;
import com.chicwordle.server.wotddefinition.WordDefinitionFetch;

import jakarta.annotation.PostConstruct;

@RestController
// @CrossOrigin(origins = "http://localhost:5173") // use for dev
@CrossOrigin(origins = "http://localhost:1985") // remove for production
public class ServerController {
	private final WordOfTheDay wordOfTheDay = new WordOfTheDay();

    @Autowired
    private NewGameWordService newGameWordService;

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
	@GetMapping("/error")
	public String handleError() {
		return "Error, no comprende";
	}
}