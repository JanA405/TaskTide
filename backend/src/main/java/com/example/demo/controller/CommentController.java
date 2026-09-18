package com.example.demo.controller;

import com.example.demo.model.Comment;
import com.example.demo.repository.CommentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    private final CommentRepository commentRepository;

    public CommentController(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Comment>> getAll() {
        return ResponseEntity.ok(commentRepository.findAll());
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<Comment>> getByTask(@PathVariable("taskId") Long taskId) {
        return ResponseEntity.ok(commentRepository.findByTaskId(taskId));
    }

    @PostMapping
    public ResponseEntity<Comment> create(@RequestBody Comment comment) {
        return ResponseEntity.ok(commentRepository.save(comment));
    }
}
