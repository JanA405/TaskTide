package com.example.demo.controller;

import com.example.demo.model.Attachment;
import com.example.demo.model.Role;
import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.repository.AttachmentRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@CrossOrigin(origins = "*")
public class AttachmentController {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public AttachmentController(
            AttachmentRepository attachmentRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService
    ) {
        this.attachmentRepository = attachmentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<List<Attachment>> getByTask(@PathVariable("taskId") Long taskId) {
        return ResponseEntity.ok(attachmentRepository.findByTaskId(taskId));
    }

    @PostMapping
    public ResponseEntity<Attachment> create(@RequestBody Attachment attachment) {
        if (attachment.getUploadedAt() == null) {
            attachment.setUploadedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(attachmentRepository.save(attachment));
    }

    @PostMapping("/upload/{taskId}")
    public ResponseEntity<Attachment> uploadFile(
            @PathVariable("taskId") Long taskId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));

        User user = authentication != null ? userRepository.findByUsername(authentication.getName()).orElse(null) : null;

        FileStorageService.StoredFile stored = fileStorageService.storeFile(file);

        Attachment attachment = new Attachment();
        attachment.setFileName(stored.getOriginalName());
        attachment.setFileType(stored.getContentType());
        attachment.setFileSize(stored.getSize());
        attachment.setFilePath(stored.getAbsolutePath());
        attachment.setFileUrl("/api/attachments/download/" + stored.getStoredName());
        attachment.setUploadedAt(LocalDateTime.now());
        attachment.setUploadedBy(user);
        attachment.setTask(task);

        return ResponseEntity.ok(attachmentRepository.save(attachment));
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("fileName") String fileName,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check file access authorization (Admin, Manager, or assigned team/user)
        String downloadUrl = "/api/attachments/download/" + fileName;
        Attachment attachment = attachmentRepository.findByFileUrl(downloadUrl).orElse(null);

        if (attachment != null && attachment.getTask() != null) {
            Task task = attachment.getTask();
            boolean isStaff = user.getRole() == Role.ROLE_ADMIN || user.getRole() == Role.ROLE_MANAGER;
            boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(user.getId());
            boolean isTeamMember = task.getTeam() != null && task.getTeam().getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()));

            if (!isStaff && !isAssignee && !isTeamMember) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        Resource resource = fileStorageService.loadFileAsResource(fileName);

        String contentType = "application/octet-stream";
        if (attachment != null && attachment.getFileType() != null) {
            contentType = attachment.getFileType();
        }

        String originalName = attachment != null ? attachment.getFileName() : resource.getFilename();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalName + "\"")
                .body(resource);
    }
}
