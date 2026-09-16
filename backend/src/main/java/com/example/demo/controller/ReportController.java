package com.example.demo.controller;

import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public ReportController(TeamRepository teamRepository, UserRepository userRepository,
                            ProjectRepository projectRepository, TaskRepository taskRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping("/team")
    public ResponseEntity<Map<String, Long>> teamReport() {
        Map<String, Long> report = new LinkedHashMap<>();
        report.put("totalTeams", teamRepository.count());
        report.put("totalUsers", userRepository.count());
        return ResponseEntity.ok(report);
    }

    @GetMapping("/project")
    public ResponseEntity<Map<String, Long>> projectReport() {
        Map<String, Long> report = new LinkedHashMap<>();
        report.put("totalProjects", projectRepository.count());
        report.put("done", taskRepository.findAll().stream().filter(t -> t.getStatus() == TaskStatus.DONE).count());
        report.put("inProgress", taskRepository.findAll().stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
        report.put("todo", taskRepository.findAll().stream().filter(t -> t.getStatus() == TaskStatus.TODO).count());
        return ResponseEntity.ok(report);
    }

    @GetMapping("/performance")
    public ResponseEntity<List<Map<String, Object>>> performanceReport() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : users) {
            long total = taskRepository.findByAssignedToId(user.getId()).size();
            long completed = taskRepository.findByAssignedToId(user.getId()).stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE).count();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", user.getId());
            entry.put("username", user.getUsername());
            entry.put("completedTasks", completed);
            entry.put("totalTasks", total);
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }
}
