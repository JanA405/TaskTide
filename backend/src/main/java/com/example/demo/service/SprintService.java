package com.example.demo.service;

import com.example.demo.model.Sprint;
import com.example.demo.repository.SprintRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SprintService {

    private final SprintRepository sprintRepository;

    public SprintService(SprintRepository sprintRepository) {
        this.sprintRepository = sprintRepository;
    }

    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    public Sprint createSprint(Sprint sprint) {
        return sprintRepository.save(sprint);
    }

    public Sprint updateSprint(Long id, Sprint sprint) {
        Sprint existing = sprintRepository.findById(id).orElseThrow(() -> new RuntimeException("Sprint not found"));
        existing.setName(sprint.getName());
        existing.setStartDate(sprint.getStartDate());
        existing.setEndDate(sprint.getEndDate());
        existing.setProject(sprint.getProject());
        return sprintRepository.save(existing);
    }

    public List<Sprint> getSprintsByProject(Long projectId) {
        return sprintRepository.findByProjectId(projectId);
    }

    public void deleteSprint(Long id) {
        sprintRepository.deleteById(id);
    }
}
