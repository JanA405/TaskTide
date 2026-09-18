package com.example.demo.security;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // Drop legacy H2 check constraints on tasks table to allow all TaskStatus enum values
        try {
            jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS CONSTRAINT_4B");
            System.out.println("Executed: ALTER TABLE tasks DROP CONSTRAINT IF EXISTS CONSTRAINT_4B");
        } catch (Exception e) {
            try {
                jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT CONSTRAINT_4B");
                System.out.println("Executed: ALTER TABLE tasks DROP CONSTRAINT CONSTRAINT_4B");
            } catch (Exception ex) {
                System.out.println("Could not drop CONSTRAINT_4B directly: " + ex.getMessage());
            }
        }

        try {
            List<String> checkConstraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE UPPER(TABLE_NAME) = 'TASKS' AND CONSTRAINT_TYPE = 'CHECK'",
                    String.class
            );
            for (String constraintName : checkConstraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT " + constraintName);
                    System.out.println("Dropped check constraint from TABLE_CONSTRAINTS: " + constraintName);
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            System.out.println("TABLE_CONSTRAINTS query failed: " + e.getMessage());
        }

        try {
            List<String> checkConstraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CONSTRAINTS WHERE UPPER(TABLE_NAME) = 'TASKS' AND CONSTRAINT_TYPE = 'CHECK'",
                    String.class
            );
            for (String constraintName : checkConstraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT " + constraintName);
                    System.out.println("Dropped check constraint from CONSTRAINTS: " + constraintName);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}

        // Ensure Admin user
        User admin = userRepository.findByUsername("admin").orElseGet(() -> {
            User u = new User();
            u.setUsername("admin");
            u.setEmail("admin@tasktide.io");
            u.setFullName("System Administrator");
            return u;
        });
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ROLE_ADMIN);
        userRepository.save(admin);

        // Ensure Project Manager user
        User manager = userRepository.findByUsername("janz").orElseGet(() -> {
            User u = new User();
            u.setUsername("janz");
            u.setEmail("janz@tasktide.io");
            u.setFullName("Janz Project Lead");
            return u;
        });
        manager.setPassword(passwordEncoder.encode("manager123"));
        manager.setRole(Role.ROLE_MANAGER);
        userRepository.save(manager);

        // Ensure Team Member user
        User devAlex = userRepository.findByUsername("dev_alex").orElseGet(() -> {
            User u = new User();
            u.setUsername("dev_alex");
            u.setEmail("alex@tasktide.io");
            u.setFullName("Alex Engineer");
            return u;
        });
        devAlex.setPassword(passwordEncoder.encode("alex123"));
        devAlex.setRole(Role.ROLE_MEMBER);
        userRepository.save(devAlex);
    }
}
