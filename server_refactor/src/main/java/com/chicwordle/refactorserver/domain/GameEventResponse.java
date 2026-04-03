package com.chicwordle.refactorserver.domain;

public record GameEventResponse(
    String type,
    String message,
    RoomSnapshot snapshot,
    String scoringUsername,
    int pointsAwarded
) {
}
