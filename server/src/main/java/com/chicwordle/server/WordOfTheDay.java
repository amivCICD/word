package com.chicwordle.server;

import java.time.LocalDate;
import java.util.Map;

import com.chicwordle.server.data.AllWords;
import com.chicwordle.server.sqliterelated.SQLiteSelect;
import com.chicwordle.server.sqliterelated.SQLiteUpdate;


public class WordOfTheDay {
	private String dailyWord;
    private String newGameWord;
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
    public String newGameWordOfDay() {
        Map<Integer, String> newGameMap = SQLiteSelect.selectWordOfDay();
        if (!newGameMap.isEmpty()) {
            int id = newGameMap.keySet().iterator().next();
            setNewGameWordOfDay(newGameMap.get(id));
        }
        return getNewGameWordOfDay();
    }
    public String getNewGameWordOfDay() { return newGameWord; }
    public void setNewGameWordOfDay(String newGameWord) { this.newGameWord = newGameWord; }

	public int randomIndex() {
		return (int) (Math.random() * AllWords.WORDS.length);
	}
}