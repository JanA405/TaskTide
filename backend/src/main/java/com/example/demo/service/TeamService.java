package com.example.demo.service;

import com.example.demo.model.Team;
import com.example.demo.model.User;
import com.example.demo.repository.TeamRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public TeamService(TeamRepository teamRepository, UserRepository userRepository, AuditLogService auditLogService) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public Team getTeamById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with ID: " + id));
    }

    public List<Team> getTeamsForUser(Long userId) {
        return teamRepository.findTeamsByMemberId(userId);
    }

    @Transactional
    public Team createTeam(Team team, String currentUsername) {
        if (currentUsername != null) {
            userRepository.findByUsername(currentUsername).ifPresent(team::setCreatedBy);
        }
        Team saved = teamRepository.save(team);
        auditLogService.logAction(
                "CREATE_TEAM",
                currentUsername != null ? currentUsername : "SYSTEM",
                "MANAGER/ADMIN",
                "TEAM",
                saved.getId(),
                "Created team '" + saved.getName() + "'"
        );
        return saved;
    }

    @Transactional
    public Team updateTeam(Long id, Team team, String currentUsername) {
        Team existing = getTeamById(id);
        existing.setName(team.getName());
        existing.setDescription(team.getDescription());
        Team updated = teamRepository.save(existing);
        auditLogService.logAction(
                "UPDATE_TEAM",
                currentUsername != null ? currentUsername : "SYSTEM",
                "MANAGER/ADMIN",
                "TEAM",
                updated.getId(),
                "Updated team details for '" + updated.getName() + "'"
        );
        return updated;
    }

    @Transactional
    public void deleteTeam(Long id, String currentUsername) {
        Team existing = getTeamById(id);
        String name = existing.getName();
        teamRepository.deleteById(id);
        auditLogService.logAction(
                "DELETE_TEAM",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "TEAM",
                id,
                "Deleted team '" + name + "'"
        );
    }

    @Transactional
    public Team addMemberToTeam(Long teamId, Long userId, String currentUsername) {
        Team team = getTeamById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Prevent duplicate members
        boolean alreadyMember = team.getMembers().stream().anyMatch(m -> m.getId().equals(userId));
        if (alreadyMember) {
            throw new IllegalArgumentException("User '" + user.getUsername() + "' is already a member of team '" + team.getName() + "'.");
        }

        team.addMember(user);
        Team saved = teamRepository.save(team);

        auditLogService.logAction(
                "ADD_TEAM_MEMBER",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "TEAM",
                team.getId(),
                "Added user '" + user.getUsername() + "' to team '" + team.getName() + "'"
        );

        return saved;
    }

    @Transactional
    public Team removeMemberFromTeam(Long teamId, Long userId, String currentUsername) {
        Team team = getTeamById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        team.removeMember(user);
        Team saved = teamRepository.save(team);

        auditLogService.logAction(
                "REMOVE_TEAM_MEMBER",
                currentUsername != null ? currentUsername : "SYSTEM",
                "ADMIN/MANAGER",
                "TEAM",
                team.getId(),
                "Removed user '" + user.getUsername() + "' from team '" + team.getName() + "'"
        );

        return saved;
    }

    public List<User> getTeamMembers(Long teamId) {
        Team team = getTeamById(teamId);
        return new ArrayList<>(team.getMembers());
    }
}
