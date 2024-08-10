package com.chicwordle.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.MediaType;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.chicwordle.server.AllWords;

@SpringBootApplication
public class ServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}

}

@RestController
@CrossOrigin(origins = "http://localhost:1985")
class ServerController {
	private final WordOfTheDay wordOfTheDay = new WordOfTheDay();

	@GetMapping(value = "/wordoftheday", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, String> dailyWordMap() {
		Map<String, String> response = new HashMap<>();
		response.put("word", wordOfTheDay.dailyWord());
		return response;
	}
	@GetMapping(value = "/newgameword", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, String> newGameWordMap() {
		Map<String, String> response = new HashMap<>();
		response.put("word", wordOfTheDay.newGameWordOfTheDay());
		return response;
	}
	@GetMapping("/error")
	public String handleError() {
		return "Error, no comprende";
	}
}

class WordOfTheDay {
	// private String[] words = {"loves","ghost","music","sings","peach","flows"};
	private String dailyWord;
	private LocalDate lastGeneratedDate;

	public String dailyWord() {
		LocalDate today = LocalDate.now();
		if (lastGeneratedDate == null || !lastGeneratedDate.equals(today)) {
			dailyWord = AllWords.WORDS[randomIndex()];
			lastGeneratedDate = today;
		}
		return dailyWord;
	}

	public String newGameWordOfTheDay() {
		return AllWords.WORDS[randomIndex()];
	}
	public int randomIndex() {
		return (int) (Math.random() * AllWords.WORDS.length);
	}
}
