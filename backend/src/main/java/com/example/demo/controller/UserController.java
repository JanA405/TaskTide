package com.example.demo.controller;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public UserController(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.badRequest().build();
        }
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRole(
            @PathVariable("id") Long id,
            @RequestParam("role") Role role,
            Authentication authentication
    ) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        Role oldRole = user.getRole();
        user.setRole(role);
        User saved = userRepository.save(user);

        String currentUsername = authentication != null ? authentication.getName() : "ADMIN";
        auditLogService.logAction(
                "UPDATE_USER_ROLE",
                currentUsername,
                "ADMIN",
                "USER",
                user.getId(),
                "Changed role for user '" + user.getUsername() + "' from " + oldRole + " to " + role
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id, Authentication authentication) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String targetUsername = user.getUsername();
        Role targetRole = user.getRole();

        userRepository.deleteById(id);

        String currentUsername = authentication != null ? authentication.getName() : "ADMIN";
        auditLogService.logAction(
                "DELETE_USER",
                currentUsername,
                "ADMIN",
                "USER",
                id,
                "Deleted user '" + targetUsername + "' (" + targetRole + ")"
        );

        return ResponseEntity.noContent().build();
    }
}
