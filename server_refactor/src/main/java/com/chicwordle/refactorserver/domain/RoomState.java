package com.chicwordle.refactorserver.domain;

import java.util.List;

public class RoomState {
    private final String roomId;
    private final int wordLength;
    private final int maxRows;
    private final List<PlayerState> players;
    private final BoardState board;
    private final int currentTurnOrder;
    private final String status;
    private final String solutionWord;
    private final List<String> wordDefinition;
    private final List<String> resetConfirmedPlayerIds;

    public RoomState(
        String roomId,
        int wordLength,
        int maxRows,
        List<PlayerState> players,
        BoardState board,
        int currentTurnOrder,
        String status,
        String solutionWord,
        List<String> wordDefinition,
        List<String> resetConfirmedPlayerIds
    ) {
        this.roomId = roomId;
        this.wordLength = wordLength;
        this.maxRows = maxRows;
        this.players = players;
        this.board = board;
        this.currentTurnOrder = currentTurnOrder;
        this.status = status;
        this.solutionWord = solutionWord;
        this.wordDefinition = wordDefinition;
        this.resetConfirmedPlayerIds = resetConfirmedPlayerIds;
    }

    public String getRoomId() {
        return roomId;
    }

    public int getWordLength() {
        return wordLength;
    }

    public int getMaxRows() {
        return maxRows;
    }

    public List<PlayerState> getPlayers() {
        return players;
    }

    public BoardState getBoard() {
        return board;
    }

    public int getCurrentTurnOrder() {
        return currentTurnOrder;
    }

    public String getStatus() {
        return status;
    }

    public String getSolutionWord() {
        return solutionWord;
    }

    public List<String> getWordDefinition() {
        return wordDefinition;
    }

    public List<String> getResetConfirmedPlayerIds() {
        return resetConfirmedPlayerIds;
    }
}
