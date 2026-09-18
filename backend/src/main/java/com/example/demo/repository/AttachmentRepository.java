package com.example.demo.repository;

import com.example.demo.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByTaskId(Long taskId);
    Optional<Attachment> findByFileUrl(String fileUrl);
}
