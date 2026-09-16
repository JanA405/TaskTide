package com.example.demo.service;

import com.example.demo.model.Team;
import com.example.demo.repository.TeamRepository;
import org.springframework.stereotype.Service;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public Team createTeam(Team team) {
        return teamRepository.save(team);
    }

    public Team updateTeam(Long id, Team team) {
        Team existing = teamRepository.findById(id).orElseThrow(() -> new RuntimeException("Team not found"));
        existing.setName(team.getName());
        existing.setDescription(team.getDescription());
        return teamRepository.save(existing);
    }

    public void deleteTeam(Long id) {
        teamRepository.deleteById(id);
    }
}
