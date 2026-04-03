package com.chicwordle.refactorserver.domain;

public record PlayerState(
    String playerId,
    String username,
    boolean connected,
    int turnOrder,
    int gameScore,
    int totalScore
) {
}
