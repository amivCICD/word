package com.chicwordle.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
public class ServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}

}

@RestController
@CrossOrigin(origins = "http://localhost:1985")
class ServerController {
	@GetMapping(value = "/javaword", produces = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, String> word() {
		WordOfTheDay wordOfTheDay = new WordOfTheDay();
		Map<String, String> response = new HashMap<>();
		response.put("word", wordOfTheDay.wordOfTheDay());
		return response;
	}
	@GetMapping("/error")
	public String handleError() {
		return "Error, no comprende";
	}
}

class WordOfTheDay {
	private String[] words = {"loves","ghost","music","sings","peach","flows"};

	public String wordOfTheDay() {
		return words[randomIndex()];
	}
	public int randomIndex() {
		return (int) (Math.random() * words.length);
	}
}
