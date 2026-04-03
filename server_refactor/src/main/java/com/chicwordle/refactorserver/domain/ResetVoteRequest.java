package com.chicwordle.refactorserver.domain;

public record ResetVoteRequest(
    String userId,
    boolean confirmed
) {
}
