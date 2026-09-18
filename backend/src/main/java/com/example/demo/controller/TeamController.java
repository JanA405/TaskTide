package com.example.demo.controller;

import com.example.demo.model.Team;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "*")
public class TeamController {

    private final TeamService teamService;
    private final UserRepository userRepository;

    public TeamController(TeamService teamService, UserRepository userRepository) {
        this.teamService = teamService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Team>> getAll() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @GetMapping("/my-teams")
    public ResponseEntity<List<Team>> getMyTeams(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.badRequest().build();
        }
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(teamService.getTeamsForUser(user.getId()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<User>> getMembers(@PathVariable("id") Long id) {
        return ResponseEntity.ok(teamService.getTeamMembers(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Team> create(@RequestBody Team team, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(teamService.createTeam(team, username));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Team> update(@PathVariable("id") Long id, @RequestBody Team team, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(teamService.updateTeam(id, team, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        teamService.deleteTeam(id, username);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Team> addMember(
            @PathVariable("id") Long teamId,
            @PathVariable("userId") Long userId,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(teamService.addMemberToTeam(teamId, userId, username));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Team> removeMember(
            @PathVariable("id") Long teamId,
            @PathVariable("userId") Long userId,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(teamService.removeMemberFromTeam(teamId, userId, username));
    }
}
