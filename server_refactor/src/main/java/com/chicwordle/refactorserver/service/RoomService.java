package com.chicwordle.refactorserver.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.chicwordle.refactorserver.domain.BoardCell;
import com.chicwordle.refactorserver.domain.BoardRow;
import com.chicwordle.refactorserver.domain.BoardState;
import com.chicwordle.refactorserver.domain.CreateRoomRequest;
import com.chicwordle.refactorserver.domain.GameEventResponse;
import com.chicwordle.refactorserver.domain.JoinRoomRequest;
import com.chicwordle.refactorserver.domain.PlayerRemovalResult;
import com.chicwordle.refactorserver.domain.PlayerState;
import com.chicwordle.refactorserver.domain.ResetVoteRequest;
import com.chicwordle.refactorserver.domain.RoomSnapshot;
import com.chicwordle.refactorserver.domain.RoomState;
import com.chicwordle.refactorserver.store.RoomStore;

@Service
public class RoomService {
    private static final int MAX_PLAYERS_PER_ROOM = 6;

    private final RoomStore roomStore;
    private final WordService wordService;

    public RoomService(RoomStore roomStore, WordService wordService) {
        this.roomStore = roomStore;
        this.wordService = wordService;
    }

    public RoomSnapshot getRoomSnapshot(String roomId) {
        return toSnapshot(requireRoom(roomId));
    }

    public RoomSnapshot createRoom(CreateRoomRequest request) {
        String roomId = sanitizeRoomId(request.roomId());
        String hostUsername = sanitizeUsername(request.hostUsername());

        if (roomStore.find(roomId) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room already exists");
        }

        List<PlayerState> players = List.of(
            new PlayerState(newPlayerId(), hostUsername, true, 0, 0, 0)
        );

        RoomState createdRoom = new RoomState(
            roomId,
            5,
            6,
            players,
            buildEmptyBoardState(5, 6),
            0,
            "WAITING_FOR_PLAYERS",
            wordService.getRandomRoomWord().toUpperCase(),
            List.of(),
            List.of()
        );

        roomStore.save(createdRoom);
        return toSnapshot(createdRoom);
    }

    public RoomSnapshot joinRoom(String roomId, JoinRoomRequest request) {
        RoomState room = requireRoom(roomId);
        String username = sanitizeUsername(request.username());

        boolean duplicateUsername = room.getPlayers()
            .stream()
            .anyMatch(player -> player.username().equalsIgnoreCase(username));
        if (duplicateUsername) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists in room");
        }
        if (room.getPlayers().size() >= MAX_PLAYERS_PER_ROOM) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is full");
        }

        List<PlayerState> updatedPlayers = new ArrayList<>(room.getPlayers());
        updatedPlayers.add(new PlayerState(newPlayerId(), username, true, updatedPlayers.size(), 0, 0));

        RoomState updatedRoom = new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            List.copyOf(updatedPlayers),
            room.getBoard(),
            room.getCurrentTurnOrder(),
            updatedPlayers.size() > 1 ? "IN_PROGRESS" : room.getStatus(),
            room.getSolutionWord(),
            room.getWordDefinition(),
            List.of()
        );

        roomStore.save(updatedRoom);
        return toSnapshot(updatedRoom);
    }

    public RoomSnapshot updateUsername(String roomId, String userId, String username) {
        RoomState room = requireRoom(roomId);
        String sanitizedUserId = sanitizeUserId(userId);
        String sanitizedUsername = sanitizeUsername(username);

        boolean duplicateUsername = room.getPlayers()
            .stream()
            .anyMatch(player -> !player.playerId().equals(sanitizedUserId) && player.username().equalsIgnoreCase(sanitizedUsername));
        if (duplicateUsername) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists in room");
        }

        List<PlayerState> updatedPlayers = room.getPlayers()
            .stream()
            .map(player -> player.playerId().equals(sanitizedUserId)
                ? new PlayerState(player.playerId(), sanitizedUsername, player.connected(), player.turnOrder(), player.gameScore(), player.totalScore())
                : player)
            .toList();

        boolean playerFound = updatedPlayers.stream().anyMatch(player -> player.playerId().equals(sanitizedUserId));
        if (!playerFound) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found in room");
        }

        RoomState updatedRoom = new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            List.copyOf(updatedPlayers),
            room.getBoard(),
            room.getCurrentTurnOrder(),
            room.getStatus(),
            room.getSolutionWord(),
            room.getWordDefinition(),
            room.getResetConfirmedPlayerIds()
        );

        roomStore.save(updatedRoom);
        return toSnapshot(updatedRoom);
    }

    public PlayerRemovalResult removePlayer(String roomId, String userId) {
        RoomState room = roomStore.find(roomId);
        if (room == null) {
            return new PlayerRemovalResult(null, null, true);
        }

        String sanitizedUserId = sanitizeUserId(userId);
        PlayerState removedPlayer = room.getPlayers().stream()
            .filter(player -> player.playerId().equals(sanitizedUserId))
            .findFirst()
            .orElse(null);

        if (removedPlayer == null) {
            return new PlayerRemovalResult(toSnapshot(room), null, false);
        }

        List<PlayerState> remainingPlayers = room.getPlayers().stream()
            .filter(player -> !player.playerId().equals(sanitizedUserId))
            .toList();

        if (remainingPlayers.isEmpty()) {
            roomStore.delete(roomId);
            return new PlayerRemovalResult(null, removedPlayer.username(), true);
        }

        int previousCurrentTurnOrder = room.getCurrentTurnOrder();
        int removedTurnOrder = removedPlayer.turnOrder();

        List<PlayerState> reindexedPlayers = new ArrayList<>();
        for (int index = 0; index < remainingPlayers.size(); index++) {
            PlayerState player = remainingPlayers.get(index);
            reindexedPlayers.add(new PlayerState(
                player.playerId(),
                player.username(),
                player.connected(),
                index,
                player.gameScore(),
                player.totalScore()
            ));
        }

        int nextTurnOrder;
        if (previousCurrentTurnOrder > removedTurnOrder) {
            nextTurnOrder = previousCurrentTurnOrder - 1;
        } else if (previousCurrentTurnOrder == removedTurnOrder) {
            nextTurnOrder = removedTurnOrder >= reindexedPlayers.size() ? 0 : removedTurnOrder;
        } else {
            nextTurnOrder = previousCurrentTurnOrder;
        }

        RoomState updatedRoom = new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            List.copyOf(reindexedPlayers),
            room.getBoard(),
            nextTurnOrder,
            reindexedPlayers.size() > 1 ? room.getStatus() : "WAITING_FOR_PLAYERS",
            room.getSolutionWord(),
            room.getWordDefinition(),
            List.of()
        );

        roomStore.save(updatedRoom);
        return new PlayerRemovalResult(toSnapshot(updatedRoom), removedPlayer.username(), false);
    }

    public RoomSnapshot advanceTurn(String roomId) {
        RoomState room = requireRoom(roomId);
        if (room.getPlayers().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot advance turn without players");
        }

        int nextTurnOrder = (room.getCurrentTurnOrder() + 1) % room.getPlayers().size();
        BoardState board = room.getBoard();
        BoardState updatedBoard = new BoardState(
            Math.min(board.activeRowIndex() + 1, room.getMaxRows() - 1),
            board.rows(),
            board.keyboard()
        );

        RoomState updatedRoom = new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            room.getPlayers(),
            updatedBoard,
            nextTurnOrder,
            room.getStatus(),
            room.getSolutionWord(),
            room.getWordDefinition(),
            room.getResetConfirmedPlayerIds()
        );

        roomStore.save(updatedRoom);
        return toSnapshot(updatedRoom);
    }

    private RoomState requireRoom(String roomId) {
        RoomState room = roomStore.find(roomId);
        if (room == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found");
        }
        return room;
    }

    private RoomSnapshot toSnapshot(RoomState room) {
        PlayerState currentTurn = room.getPlayers()
            .stream()
            .filter(player -> player.turnOrder() == room.getCurrentTurnOrder())
            .findFirst()
            .orElse(null);

        return new RoomSnapshot(
            room.getRoomId(),
            room.getStatus(),
            room.getWordLength(),
            room.getMaxRows(),
            room.getPlayers(),
            currentTurn,
            room.getBoard(),
            isTerminal(room.getStatus()) ? room.getSolutionWord() : null,
            room.getSolutionWord(),
            room.getWordDefinition(),
            room.getResetConfirmedPlayerIds()
        );
    }

    private String sanitizeRoomId(String roomId) {
        if (roomId == null || roomId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room ID is required");
        }
        return roomId.trim();
    }

    private String sanitizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        return username.trim();
    }

    private String newPlayerId() {
        return UUID.randomUUID().toString();
    }

    private BoardState buildEmptyBoardState(int wordLength, int maxRows) {
        List<BoardRow> rows = new ArrayList<>();
        for (int rowIndex = 0; rowIndex < maxRows; rowIndex++) {
            List<BoardCell> cells = new ArrayList<>();
            for (int cellIndex = 0; cellIndex < wordLength; cellIndex++) {
                cells.add(new BoardCell("", "empty"));
            }
            rows.add(new BoardRow(List.copyOf(cells)));
        }
        return new BoardState(0, List.copyOf(rows), Map.of());
    }

    public GameEventResponse appendLetter(String roomId, String userId, String letter) {
        RoomState room = requireRoom(roomId);
        PlayerState currentTurn = requireCurrentTurn(room, userId);
        String normalizedLetter = sanitizeLetter(letter);
        BoardState board = room.getBoard();
        int rowIndex = board.activeRowIndex();
        List<BoardRow> rows = mutableRows(board.rows());
        List<BoardCell> currentRow = new ArrayList<>(rows.get(rowIndex).cells());

        int nextEmptyIndex = findNextEmptyIndex(currentRow);
        if (nextEmptyIndex == -1) {
            return new GameEventResponse("roomState", null, toSnapshot(room), null, 0);
        }

        currentRow.set(nextEmptyIndex, new BoardCell(normalizedLetter, "empty"));
        rows.set(rowIndex, new BoardRow(List.copyOf(currentRow)));

        RoomState updatedRoom = new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            room.getPlayers(),
            new BoardState(board.activeRowIndex(), List.copyOf(rows), board.keyboard()),
            room.getCurrentTurnOrder(),
            room.getStatus(),
            room.getSolutionWord(),
            room.getWordDefinition(),
            List.of()
        );

        roomStore.save(updatedRoom);
        return new GameEventResponse("roomState", null, toSnapshot(updatedRoom), null, 0);
    }

    public GameEventResponse backspace(String roomId, String userId) {
        RoomState room = requireRoom(roomId);
        requireCurrentTurn(room, userId);
        BoardState board = room.getBoard();
        int rowIndex = board.activeRowIndex();
        List<BoardRow> rows = mutableRows(board.rows());
        List<BoardCell> currentRow = new ArrayList<>(rows.get(rowIndex).cells());

        int lastFilledIndex = findLastFilledIndex(currentRow);
        if (lastFilledIndex == -1) {
            return new GameEventResponse("roomState", null, toSnapshot(room), null, 0);
        }

        currentRow.set(lastFilledIndex, new BoardCell("", "empty"));
        rows.set(rowIndex, new BoardRow(List.copyOf(currentRow)));

        RoomState updatedRoom = new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            room.getPlayers(),
            new BoardState(board.activeRowIndex(), List.copyOf(rows), board.keyboard()),
            room.getCurrentTurnOrder(),
            room.getStatus(),
            room.getSolutionWord(),
            room.getWordDefinition(),
            List.of()
        );

        roomStore.save(updatedRoom);
        return new GameEventResponse("roomState", null, toSnapshot(updatedRoom), null, 0);
    }

    public GameEventResponse submitGuess(String roomId, String userId) {
        RoomState room = requireRoom(roomId);
        requireCurrentTurn(room, userId);
        BoardState board = room.getBoard();
        int rowIndex = board.activeRowIndex();
        List<BoardCell> currentRow = new ArrayList<>(board.rows().get(rowIndex).cells());
        String guess = currentRow.stream().map(BoardCell::letter).reduce("", String::concat);

        if (guess.length() != room.getWordLength() || guess.contains(" ")) {
            return new GameEventResponse("roomState", null, toSnapshot(room), null, 0);
        }

        if (!wordService.isValidGuess(guess.toLowerCase())) {
            return new GameEventResponse("invalidGuess", "Word not in list", toSnapshot(room), null, 0);
        }

        String solution = room.getSolutionWord();
        List<BoardCell> evaluatedRow = evaluateGuess(currentRow, solution);
        List<BoardRow> rows = mutableRows(board.rows());
        rows.set(rowIndex, new BoardRow(List.copyOf(evaluatedRow)));
        boolean solved = guess.equals(solution);
        int earnedPoints = calculateEarnedPoints(board, evaluatedRow, solved);
        List<PlayerState> updatedPlayers = awardPoints(room.getPlayers(), userId, earnedPoints);

        Map<String, String> updatedKeyboard = updateKeyboard(board.keyboard(), evaluatedRow);
        boolean failed = !solved && rowIndex == room.getMaxRows() - 1;
        int nextRowIndex = solved || failed ? rowIndex : Math.min(rowIndex + 1, room.getMaxRows() - 1);
        int nextTurnOrder = solved || failed
            ? room.getCurrentTurnOrder()
            : room.getPlayers().isEmpty() ? 0 : (room.getCurrentTurnOrder() + 1) % room.getPlayers().size();
        String nextStatus = solved ? "COMPLETED" : failed ? "FAILED" : room.getStatus();
        List<String> definition = (solved || failed) ? wordService.getDefinition(solution) : room.getWordDefinition();

        RoomState updatedRoom = new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            List.copyOf(updatedPlayers),
            new BoardState(nextRowIndex, List.copyOf(rows), updatedKeyboard),
            nextTurnOrder,
            nextStatus,
            room.getSolutionWord(),
            definition,
            List.of()
        );

        roomStore.save(updatedRoom);
        PlayerState scoringPlayer = updatedPlayers.stream()
            .filter(player -> player.playerId().equals(userId))
            .findFirst()
            .orElse(null);
        return new GameEventResponse("roomState", null, toSnapshot(updatedRoom), scoringPlayer != null ? scoringPlayer.username() : null, earnedPoints);
    }

    private PlayerState requireCurrentTurn(RoomState room, String userId) {
        if (isTerminal(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game is already finished");
        }
        PlayerState currentTurn = room.getPlayers()
            .stream()
            .filter(player -> player.turnOrder() == room.getCurrentTurnOrder())
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No current turn set"));

        if (!currentTurn.playerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not this player's turn");
        }
        return currentTurn;
    }

    private String sanitizeLetter(String letter) {
        if (letter == null || letter.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Letter is required");
        }
        String normalized = letter.trim().toUpperCase();
        if (normalized.length() != 1 || normalized.charAt(0) < 'A' || normalized.charAt(0) > 'Z') {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Letter must be A-Z");
        }
        return normalized;
    }

    private int findNextEmptyIndex(List<BoardCell> row) {
        for (int index = 0; index < row.size(); index++) {
            if (row.get(index).letter().isEmpty()) {
                return index;
            }
        }
        return -1;
    }

    private int findLastFilledIndex(List<BoardCell> row) {
        for (int index = row.size() - 1; index >= 0; index--) {
            if (!row.get(index).letter().isEmpty()) {
                return index;
            }
        }
        return -1;
    }

    private List<BoardRow> mutableRows(List<BoardRow> sourceRows) {
        List<BoardRow> rows = new ArrayList<>();
        rows.addAll(sourceRows);
        return rows;
    }

    private List<BoardCell> evaluateGuess(List<BoardCell> row, String solution) {
        List<BoardCell> evaluated = new ArrayList<>();
        for (int index = 0; index < row.size(); index++) {
            String letter = row.get(index).letter();
            String status;
            if (solution.charAt(index) == letter.charAt(0)) {
                status = "correct";
            } else if (solution.contains(letter)) {
                status = "present";
            } else {
                status = "miss";
            }
            evaluated.add(new BoardCell(letter, status));
        }
        return evaluated;
    }

    private Map<String, String> updateKeyboard(Map<String, String> currentKeyboard, List<BoardCell> row) {
        Map<String, String> updated = new LinkedHashMap<>(currentKeyboard);
        for (BoardCell cell : row) {
            String existing = updated.get(cell.letter());
            if (existing == null || "miss".equals(existing) || ("present".equals(existing) && "correct".equals(cell.status()))) {
                updated.put(cell.letter(), cell.status());
            }
        }
        return updated;
    }

    private List<PlayerState> awardPoints(List<PlayerState> players, String userId, int earnedPoints) {
        return players.stream()
            .map(player -> player.playerId().equals(userId)
                ? new PlayerState(
                    player.playerId(),
                    player.username(),
                    player.connected(),
                    player.turnOrder(),
                    player.gameScore() + earnedPoints,
                    player.totalScore() + earnedPoints
                )
                : player)
            .toList();
    }

    private int calculateEarnedPoints(BoardState board, List<BoardCell> evaluatedRow, boolean solved) {
        int earnedPoints = 0;
        Map<String, String> currentKeyboard = board.keyboard();

        for (int index = 0; index < evaluatedRow.size(); index++) {
            BoardCell cell = evaluatedRow.get(index);
            if ("correct".equals(cell.status())) {
                if (isFreshCorrect(board.rows(), index, cell.letter())) {
                    earnedPoints += 2;
                }
                continue;
            }

            if ("present".equals(cell.status())) {
                String existing = currentKeyboard.get(cell.letter());
                if (!"present".equals(existing) && !"correct".equals(existing)) {
                    earnedPoints += 1;
                }
            }
        }

        if (solved) {
            earnedPoints += 1;
        }

        return earnedPoints;
    }

    private boolean isFreshCorrect(List<BoardRow> rows, int columnIndex, String letter) {
        return rows.stream().noneMatch(row -> {
            if (columnIndex >= row.cells().size()) {
                return false;
            }
            BoardCell existing = row.cells().get(columnIndex);
            return "correct".equals(existing.status()) && letter.equals(existing.letter());
        });
    }

    public RoomSnapshot recordResetVote(String roomId, ResetVoteRequest request) {
        RoomState room = requireRoom(roomId);

        String userId = sanitizeUserId(request.userId());
        List<String> votes = new ArrayList<>(room.getResetConfirmedPlayerIds());
        if (request.confirmed()) {
            if (!votes.contains(userId)) {
                votes.add(userId);
            }
        } else {
            votes.remove(userId);
        }

        boolean allConfirmed = !room.getPlayers().isEmpty()
            && room.getPlayers().stream().allMatch(player -> votes.contains(player.playerId()));

        RoomState nextRoom = allConfirmed ? buildResetRoom(room) : new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            room.getPlayers(),
            room.getBoard(),
            room.getCurrentTurnOrder(),
            room.getStatus(),
            room.getSolutionWord(),
            room.getWordDefinition(),
            List.copyOf(votes)
        );

        roomStore.save(nextRoom);
        return toSnapshot(nextRoom);
    }

    private RoomState buildResetRoom(RoomState room) {
        List<PlayerState> resetPlayers = room.getPlayers().stream()
            .map(player -> new PlayerState(
                player.playerId(),
                player.username(),
                player.connected(),
                player.turnOrder(),
                0,
                player.totalScore()
            ))
            .toList();

        return new RoomState(
            room.getRoomId(),
            room.getWordLength(),
            room.getMaxRows(),
            resetPlayers,
            buildEmptyBoardState(room.getWordLength(), room.getMaxRows()),
            0,
            "IN_PROGRESS",
            wordService.getRandomRoomWord().toUpperCase(),
            List.of(),
            List.of()
        );
    }

    private boolean isTerminal(String status) {
        return "COMPLETED".equals(status) || "FAILED".equals(status);
    }

    private String sanitizeUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        return userId.trim();
    }
}
