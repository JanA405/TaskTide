package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
        "png", "jpg", "jpeg", "gif", "svg", "webp", "zip", "rar", "7z", "json"
    ));

    public FileStorageService(@Value("${file.upload-dir:./uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public StoredFile storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store an empty file.");
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");

        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFileName);
        }

        // Validate extension
        String extension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("File type '." + extension + "' is not permitted. Allowed: " + ALLOWED_EXTENSIONS);
        }

        String storedFileName = UUID.randomUUID().toString() + "_" + originalFileName.replaceAll("[^a-zA-Z0-9.-]", "_");

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return new StoredFile(
                originalFileName,
                storedFileName,
                targetLocation.toString(),
                file.getContentType(),
                file.getSize()
            );
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String storedFileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(storedFileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + storedFileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found " + storedFileName, ex);
        }
    }

    public static class StoredFile {
        private final String originalName;
        private final String storedName;
        private final String absolutePath;
        private final String contentType;
        private final long size;

        public StoredFile(String originalName, String storedName, String absolutePath, String contentType, long size) {
            this.originalName = originalName;
            this.storedName = storedName;
            this.absolutePath = absolutePath;
            this.contentType = contentType;
            this.size = size;
        }

        public String getOriginalName() { return originalName; }
        public String getStoredName() { return storedName; }
        public String getAbsolutePath() { return absolutePath; }
        public String getContentType() { return contentType; }
        public long getSize() { return size; }
    }
}
