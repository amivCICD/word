package com.chicwordle.refactorserver.domain;

public record BoardCell(
    String letter,
    String status
) {
}
