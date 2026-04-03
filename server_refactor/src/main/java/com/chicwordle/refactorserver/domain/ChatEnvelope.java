package com.chicwordle.refactorserver.domain;

public record ChatEnvelope(
    String type,
    String username,
    String userId,
    String message
) {
}
