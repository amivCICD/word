package com.chicwordle.refactorserver.domain;

import java.util.List;

public record BoardRow(
    List<BoardCell> cells
) {
}
