package com.chicwordle.refactorserver.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chicwordle.refactorserver.domain.CreateRoomRequest;
import com.chicwordle.refactorserver.domain.JoinRoomRequest;
import com.chicwordle.refactorserver.domain.ResetVoteRequest;
import com.chicwordle.refactorserver.domain.RoomSnapshot;
import com.chicwordle.refactorserver.service.RoomService;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping("/{roomId}")
    public RoomSnapshot getRoom(@PathVariable String roomId) {
        return roomService.getRoomSnapshot(roomId);
    }

    @PostMapping
    public RoomSnapshot createRoom(@RequestBody CreateRoomRequest request) {
        return roomService.createRoom(request);
    }

    @PostMapping("/{roomId}/join")
    public RoomSnapshot joinRoom(@PathVariable String roomId, @RequestBody JoinRoomRequest request) {
        return roomService.joinRoom(roomId, request);
    }

    @PostMapping("/{roomId}/advance-turn")
    public RoomSnapshot advanceTurn(@PathVariable String roomId) {
        return roomService.advanceTurn(roomId);
    }

    @PostMapping("/{roomId}/reset-votes")
    public RoomSnapshot recordResetVote(@PathVariable String roomId, @RequestBody ResetVoteRequest request) {
        return roomService.recordResetVote(roomId, request);
    }
}
