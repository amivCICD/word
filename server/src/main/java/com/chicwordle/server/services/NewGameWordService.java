package com.chicwordle.server.services;

import org.springframework.stereotype.Service;

import com.chicwordle.server.WordOfTheDay;

@Service
public class NewGameWordService {
    public String getNewGameWord() {
        WordOfTheDay newGameWordOfTheDay = new WordOfTheDay();
        return newGameWordOfTheDay.newGameWordOfDay();
    }
}