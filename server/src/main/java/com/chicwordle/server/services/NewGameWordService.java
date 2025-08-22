package com.chicwordle.server.services;

import org.springframework.stereotype.Service;

import com.chicwordle.server.WordOfTheDay;

@Service
public class NewGameWordService {
    private volatile String newGameWord;

    public String getNewGameWord() {
        return newGameWord;
    }
    public void generateNewGameWord() {
        WordOfTheDay newGameWordOfTheDay = new WordOfTheDay();
        setNewGameWord(newGameWordOfTheDay.newGameWordOfDay());
    }
    public void setNewGameWord(String newGameWord) {
        this.newGameWord = newGameWord;
    }
    public void initNewGameWord() {
        if (newGameWord == null) {
            generateNewGameWord();
        }
    }
}