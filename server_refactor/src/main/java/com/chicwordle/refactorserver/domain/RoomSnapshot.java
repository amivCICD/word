package com.chicwordle.refactorserver.domain;

import java.util.List;

public record RoomSnapshot(
    String roomId,
    String status,
    int wordLength,
    int maxRows,
    List<PlayerState> players,
    PlayerState currentTurn,
    BoardState board,
    String revealedWord,
    String debugWord,
    List<String> wordDefinition,
    List<String> resetConfirmedPlayerIds
) {
}
