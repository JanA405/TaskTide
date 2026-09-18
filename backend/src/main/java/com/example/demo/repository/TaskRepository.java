package com.example.demo.repository;

import com.example.demo.model.Task;
import com.example.demo.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findBySprintId(Long sprintId);
    List<Task> findByAssignedToId(Long userId);
    List<Task> findByTeamId(Long teamId);
    List<Task> findByStatus(TaskStatus status);

    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN t.team team LEFT JOIN team.members member WHERE t.assignedTo.id = :userId OR member.id = :userId")
    List<Task> findTasksForMemberOrHisTeams(@Param("userId") Long userId);

    @Query("SELECT DISTINCT t FROM Task t JOIN t.team team JOIN team.members member WHERE member.id = :userId")
    List<Task> findTasksByTeamMemberId(@Param("userId") Long userId);
}
