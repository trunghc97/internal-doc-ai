package com.docai.controller;

import com.docai.model.Document;
import com.docai.model.User;
import com.docai.service.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<Document> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sensitiveInfo") String sensitiveInfo,
            @AuthenticationPrincipal User user) throws Exception {
        return ResponseEntity.ok(documentService.uploadDocument(file, user, sensitiveInfo));
    }
    
    @PostMapping("/test-upload")
    public ResponseEntity<Document> uploadDocumentFromTestFile(
            @RequestParam("filename") String filename,
            @RequestParam(value = "sensitiveInfo", defaultValue = "Test file từ testFile directory") String sensitiveInfo,
            @AuthenticationPrincipal User user) throws Exception {
        log.info("Mock upload file từ testFile: {}", filename);
        return ResponseEntity.ok(documentService.uploadDocumentFromTestFile(filename, user, sensitiveInfo));
    }

    @GetMapping
    public ResponseEntity<Page<Document>> getDocuments(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        return ResponseEntity.ok(documentService.getUserDocuments(user, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.getDocument(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        documentService.deleteDocument(id, user);
        return ResponseEntity.ok().build();
    }
}