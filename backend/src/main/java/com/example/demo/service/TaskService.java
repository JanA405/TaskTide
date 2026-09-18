package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.SprintRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.TeamRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final TeamRepository teamRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            SprintRepository sprintRepository,
            TeamRepository teamRepository,
            FileStorageService fileStorageService,
            AuditLogService auditLogService
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.sprintRepository = sprintRepository;
        this.teamRepository = teamRepository;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + id));
    }

    public List<Task> getTasksBySprint(Long sprintId) {
        return taskRepository.findBySprintId(sprintId);
    }

    public List<Task> getTasksByUser(Long userId) {
        return taskRepository.findByAssignedToId(userId);
    }

    public List<Task> getTasksByTeam(Long teamId) {
        return taskRepository.findByTeamId(teamId);
    }

    public List<Task> getTasksForUserTeamsOrAssigned(Long userId) {
        return taskRepository.findTasksForMemberOrHisTeams(userId);
    }

    @Transactional
    public Task createTask(Task task, String currentUsername) {
        if (task.getAssignedTo() != null && task.getAssignedTo().getId() != null) {
            task.setAssignedTo(userRepository.findById(task.getAssignedTo().getId()).orElse(null));
        } else {
            task.setAssignedTo(null);
        }

        if (task.getTeam() != null && task.getTeam().getId() != null) {
            task.setTeam(teamRepository.findById(task.getTeam().getId()).orElse(null));
        } else {
            task.setTeam(null);
        }

        if (task.getSprint() != null && task.getSprint().getId() != null) {
            task.setSprint(sprintRepository.findById(task.getSprint().getId()).orElse(null));
        } else {
            task.setSprint(null);
        }

        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.TODO);
        }
        if (task.getProgress() == null) {
            task.setProgress(0);
        }

        Task saved = taskRepository.save(task);

        String teamName = saved.getTeam() != null ? saved.getTeam().getName() : "None";
        auditLogService.logAction(
                "CREATE_TASK",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "TASK",
                saved.getId(),
                "Created task '" + saved.getTitle() + "' assigned to team '" + teamName + "'"
        );

        return saved;
    }

    @Transactional
    public Task updateTask(Long id, Task task, String currentUsername) {
        Task existing = getTaskById(id);

        if (task.getTitle() != null) existing.setTitle(task.getTitle());
        if (task.getDescription() != null) existing.setDescription(task.getDescription());
        if (task.getStatus() != null) existing.setStatus(task.getStatus());
        if (task.getPriority() != null) existing.setPriority(task.getPriority());
        if (task.getDueDate() != null) existing.setDueDate(task.getDueDate());
        if (task.getProgress() != null) existing.setProgress(task.getProgress());

        if (task.getAssignedTo() != null) {
            if (task.getAssignedTo().getId() != null) {
                existing.setAssignedTo(userRepository.findById(task.getAssignedTo().getId()).orElse(null));
            } else {
                existing.setAssignedTo(null);
            }
        }

        if (task.getTeam() != null) {
            if (task.getTeam().getId() != null) {
                existing.setTeam(teamRepository.findById(task.getTeam().getId()).orElse(null));
            } else {
                existing.setTeam(null);
            }
        }

        if (task.getSprint() != null) {
            if (task.getSprint().getId() != null) {
                existing.setSprint(sprintRepository.findById(task.getSprint().getId()).orElse(null));
            } else {
                existing.setSprint(null);
            }
        }

        Task saved = taskRepository.save(existing);
        auditLogService.logAction(
                "UPDATE_TASK",
                currentUsername != null ? currentUsername : "SYSTEM",
                "USER",
                "TASK",
                saved.getId(),
                "Updated task '" + saved.getTitle() + "'"
        );

        return saved;
    }

    @Transactional
    public void deleteTask(Long id, String currentUsername) {
        Task existing = getTaskById(id);
        String title = existing.getTitle();
        taskRepository.deleteById(id);
        auditLogService.logAction(
                "DELETE_TASK",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "TASK",
                id,
                "Deleted task '" + title + "'"
        );
    }

    @Transactional
    public Task updateProgress(Long id, Integer progress, String currentUsername) {
        Task existing = getTaskById(id);
        int validProgress = Math.max(0, Math.min(100, progress != null ? progress : 0));
        existing.setProgress(validProgress);

        if (validProgress > 0 && existing.getStatus() == TaskStatus.TODO) {
            existing.setStatus(TaskStatus.IN_PROGRESS);
        }

        Task saved = taskRepository.save(existing);
        auditLogService.logAction(
                "UPDATE_PROGRESS",
                currentUsername != null ? currentUsername : "SYSTEM",
                "MEMBER",
                "TASK",
                id,
                "Updated task progress to " + validProgress + "%"
        );
        return saved;
    }

    @Transactional
    public Task submitTask(Long id, String notes, List<MultipartFile> files, String currentUsername) {
        Task task = getTaskById(id);
        User user = currentUsername != null ? userRepository.findByUsername(currentUsername).orElse(null) : null;

        task.setStatus(TaskStatus.SUBMITTED);
        task.setSubmittedBy(user);
        task.setSubmittedAt(LocalDateTime.now());
        task.setSubmissionNotes(notes);

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                FileStorageService.StoredFile stored = fileStorageService.storeFile(file);
                Attachment attachment = new Attachment();
                attachment.setFileName(stored.getOriginalName());
                attachment.setFileType(stored.getContentType());
                attachment.setFileSize(stored.getSize());
                attachment.setFilePath(stored.getAbsolutePath());
                attachment.setUploadedBy(user);
                attachment.setUploadedAt(LocalDateTime.now());
                attachment.setTask(task);
                attachment.setFileUrl("/api/attachments/download/" + stored.getStoredName());
                task.getAttachments().add(attachment);
            }
        }

        Task saved = taskRepository.save(task);

        auditLogService.logAction(
                "SUBMIT_TASK",
                currentUsername != null ? currentUsername : "SYSTEM",
                "MEMBER",
                "TASK",
                id,
                "Submitted task for completion with " + (files != null ? files.size() : 0) + " document(s)"
        );

        return saved;
    }

    @Transactional
    public Task reviewTask(Long id, boolean approved, String reason, String reviewerUsername) {
        Task task = getTaskById(id);
        User reviewer = reviewerUsername != null ? userRepository.findByUsername(reviewerUsername).orElse(null) : null;

        task.setReviewedBy(reviewer);
        task.setReviewedAt(LocalDateTime.now());

        if (approved) {
            task.setStatus(TaskStatus.APPROVED);
            task.setProgress(100);
            task.setRejectionReason(null);
        } else {
            task.setStatus(TaskStatus.REJECTED);
            task.setRejectionReason(reason != null && !reason.trim().isEmpty() ? reason : "Submission rejected. Please review notes and resubmit.");
        }

        Task saved = taskRepository.save(task);

        auditLogService.logAction(
                approved ? "APPROVE_TASK" : "REJECT_TASK",
                reviewerUsername != null ? reviewerUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "TASK",
                id,
                approved ? "Approved completion of task '" + task.getTitle() + "'"
                         : "Rejected task with reason: " + task.getRejectionReason()
        );

        return saved;
    }
}
