package com.chicwordle.server;

import java.util.Map;
import java.time.LocalDate;
import com.chicwordle.server.SQLiteSelect;
import com.chicwordle.server.SQLiteUpdate;


public class WordOfTheDay {
	private String dailyWord;
	private LocalDate lastGeneratedDate;

	public String dailyWord() {
		LocalDate today = LocalDate.now();
		if (lastGeneratedDate == null || !lastGeneratedDate.equals(today)) {
			// dailyWord = AllWords.WORDS[randomIndex()];
			lastGeneratedDate = today;
		}
		return dailyWord;
	}
    public WordOfTheDay setSQLWordOfDay() {
        if (dailyWord == null || !LocalDate.now().equals(lastGeneratedDate)) {
            Map<Integer, String> result = SQLiteSelect.selectWordOfDay();
            if (!result.isEmpty()) {
                int id = result.keySet().iterator().next();
                dailyWord = result.get(id);
                lastGeneratedDate = LocalDate.now();
                SQLiteUpdate.updateWordAsUsed(id);
            }
        }
        return this;
    }

	public String newGameWordOfTheDay() {
		return AllWords.WORDS[randomIndex()];
	}
	public int randomIndex() {
		return (int) (Math.random() * AllWords.WORDS.length);
	}
}