package com.chicwordle.server.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chicwordle.server.WordOfTheDay;

@RestController
@CrossOrigin(origins = "http://localhost:5173") // use for dev
// @CrossOrigin(origins = "http://localhost:1985") // remove for production
public class ServerController {
	private final WordOfTheDay wordOfTheDay = new WordOfTheDay();

	@GetMapping(value = "/wordoftheday", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, String> dailyWordMap() {
		Map<String, String> response = new HashMap<>();
		response.put("word", wordOfTheDay.setSQLWordOfDay().dailyWord());
		return response;
	}
	@GetMapping(value = "/newgameword", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, String> newGameWordMap() {
		Map<String, String> response = new HashMap<>();
		response.put("word", wordOfTheDay.newGameWordOfDay());
		return response;
	}
	@GetMapping("/error")
	public String handleError() {
		return "Error, no comprende";
	}
}