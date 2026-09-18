package com.example.demo.controller;

import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.TaskService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    public TaskController(TaskService taskService, UserRepository userRepository) {
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Task>> getAll() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @GetMapping("/sprint/{sprintId}")
    public ResponseEntity<List<Task>> getBySprint(@PathVariable("sprintId") Long sprintId) {
        return ResponseEntity.ok(taskService.getTasksBySprint(sprintId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getByUser(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(taskService.getTasksByUser(userId));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Task>> getByTeam(@PathVariable("teamId") Long teamId) {
        return ResponseEntity.ok(taskService.getTasksByTeam(teamId));
    }

    @GetMapping("/my-group-tasks")
    public ResponseEntity<List<Task>> getMyGroupTasks(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.badRequest().build();
        }
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(taskService.getTasksForUserTeamsOrAssigned(user.getId()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Task> create(@RequestBody Task task, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.createTask(task, username));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Task> update(@PathVariable("id") Long id, @RequestBody Task task, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.updateTask(id, task, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        taskService.deleteTask(id, username);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<Task> updateProgress(
            @PathVariable("id") Long id,
            @RequestParam("progress") Integer progress,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.updateProgress(id, progress, username));
    }

    @PostMapping(value = "/{id}/submit", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<Task> submitTask(
            @PathVariable("id") Long id,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.submitTask(id, notes, files, username));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Task> approveTask(@PathVariable("id") Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.reviewTask(id, true, null, username));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Task> rejectTask(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(taskService.reviewTask(id, false, reason, username));
    }
}
