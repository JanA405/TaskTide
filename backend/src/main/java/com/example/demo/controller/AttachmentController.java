package com.example.demo.controller;

import com.example.demo.model.Attachment;
import com.example.demo.repository.AttachmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@CrossOrigin(origins = "*")
public class AttachmentController {

    private final AttachmentRepository attachmentRepository;

    public AttachmentController(AttachmentRepository attachmentRepository) {
        this.attachmentRepository = attachmentRepository;
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<List<Attachment>> getByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(attachmentRepository.findByTaskId(taskId));
    }

    @PostMapping
    public ResponseEntity<Attachment> create(@RequestBody Attachment attachment) {
        return ResponseEntity.ok(attachmentRepository.save(attachment));
    }
}
