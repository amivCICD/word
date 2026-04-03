package com.chicwordle.refactorserver.domain;

public record CreateRoomRequest(
    String roomId,
    String hostUsername
) {
}
