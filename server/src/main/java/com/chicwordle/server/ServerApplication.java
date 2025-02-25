package com.chicwordle.server;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class ServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
		Connect.connect(); // these were commented out from last build 30-34
		CreateDB.initDB();
		SQLiteCreateTable.createWordTable("words");
		InsertWordsToDB.insertManyWords(AllWords.WORDS);
		SQLiteSelect.selectWordOfDay();

	}

}

@RestController
// @CrossOrigin(origins = "http://localhost:5173") // use for dev
// @CrossOrigin(origins = "http://localhost:1985") // remove for production

class ServerController {
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

// class WordOfTheDay {
// 	// private String[] words = {"loves","ghost","music","sings","peach","flows"};
// 	private String dailyWord;
// 	private LocalDate lastGeneratedDate;

// 	public String dailyWord() {
// 		LocalDate today = LocalDate.now();
// 		if (lastGeneratedDate == null || !lastGeneratedDate.equals(today)) {
// 			dailyWord = AllWords.WORDS[randomIndex()];
// 			lastGeneratedDate = today;
// 		}
// 		return dailyWord;
// 	}

// 	public String newGameWordOfTheDay() {
// 		return AllWords.WORDS[randomIndex()];
// 	}
// 	public int randomIndex() {
// 		return (int) (Math.random() * AllWords.WORDS.length);
// 	}
// }

class Connect {

	public static void connect() {
			Connection conn = null;
			try {
					String url = "jdbc:sqlite:sqlite-sakila.db";
					conn = DriverManager.getConnection(url);
					System.out.println("Connection to SQLite successful...");
			} catch (SQLException e) {
					System.out.println(e.getMessage());
			} finally {
					try {
							if (conn != null) {
								conn.close();
							}
					} catch(SQLException ex) {
							System.out.println(ex.getMessage());
					}
			}

	}
}
