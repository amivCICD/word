package com.chicwordle.refactorserver.domain;

public record PlayerRemovalResult(
    RoomSnapshot snapshot,
    String removedUsername,
    boolean roomDeleted
) {
}
