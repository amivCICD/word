package com.chicwordle.server.newgameword;


public class NewGameWord {
    private String newGameWord;

    public NewGameWord() {}

    public NewGameWord(String newWord) {
        this.newGameWord = newWord;
    }

    public String getNewGameWord() { return newGameWord; }
    public void setNewGameWord(String newWord) { this.newGameWord = newWord; }
}