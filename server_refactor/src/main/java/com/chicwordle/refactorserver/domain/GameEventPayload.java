package com.chicwordle.refactorserver.domain;

public record GameEventPayload(
    String type,
    String userId,
    String letter,
    Boolean confirmed,
    String username
) {
}
