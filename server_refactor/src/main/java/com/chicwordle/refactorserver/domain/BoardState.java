package com.chicwordle.refactorserver.domain;

import java.util.List;
import java.util.Map;

public record BoardState(
    int activeRowIndex,
    List<BoardRow> rows,
    Map<String, String> keyboard
) {
}
