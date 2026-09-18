package com.example.demo.service;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectStatus;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final AuditLogService auditLogService;

    public ProjectService(ProjectRepository projectRepository, TeamRepository teamRepository, AuditLogService auditLogService) {
        this.projectRepository = projectRepository;
        this.teamRepository = teamRepository;
        this.auditLogService = auditLogService;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));
    }

    public List<Project> getProjectsForMember(Long userId) {
        return projectRepository.findProjectsByMemberId(userId);
    }

    @Transactional
    public Project createProject(Project project, String currentUsername) {
        if (project.getTeam() != null && project.getTeam().getId() != null) {
            project.setTeam(teamRepository.findById(project.getTeam().getId()).orElse(null));
        } else {
            project.setTeam(null);
        }
        if (project.getStatus() == null) {
            project.setStatus(ProjectStatus.ACTIVE);
        }
        Project saved = projectRepository.save(project);
        auditLogService.logAction(
                "CREATE_PROJECT",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "PROJECT",
                saved.getId(),
                "Created project '" + saved.getName() + "'"
        );
        return saved;
    }

    @Transactional
    public Project updateProject(Long id, Project project, String currentUsername) {
        Project existing = getProjectById(id);
        existing.setName(project.getName());
        existing.setDescription(project.getDescription());
        existing.setStartDate(project.getStartDate());
        existing.setEndDate(project.getEndDate());
        if (project.getStatus() != null) {
            existing.setStatus(project.getStatus());
        }
        if (project.getTeam() != null) {
            if (project.getTeam().getId() != null) {
                existing.setTeam(teamRepository.findById(project.getTeam().getId()).orElse(null));
            } else {
                existing.setTeam(null);
            }
        }
        Project updated = projectRepository.save(existing);
        auditLogService.logAction(
                "UPDATE_PROJECT",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "PROJECT",
                updated.getId(),
                "Updated project '" + updated.getName() + "'"
        );
        return updated;
    }

    @Transactional
    public void deleteProject(Long id, String currentUsername) {
        Project existing = getProjectById(id);
        String name = existing.getName();
        projectRepository.deleteById(id);
        auditLogService.logAction(
                "DELETE_PROJECT",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "PROJECT",
                id,
                "Deleted project '" + name + "'"
        );
    }
}
