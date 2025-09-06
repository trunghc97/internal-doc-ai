package com.docai.service;

import com.docai.model.Document;
import com.docai.model.User;
import com.docai.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository documentRepository;

    @Transactional
    public Document uploadDocument(MultipartFile file, User user, String sensitiveInfo) throws IOException {
        Document document = new Document();
        document.setFilename(file.getOriginalFilename());
        document.setContent(new String(file.getBytes()));
        document.setMimeType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setSensitiveInfo(sensitiveInfo);
        document.setUser(user);
        document.setUploadedAt(LocalDateTime.now());
        document.setLastModifiedAt(LocalDateTime.now());

        return documentRepository.save(document);
    }

    public Page<Document> getUserDocuments(User user, Pageable pageable) {
        return documentRepository.findByUser(user, pageable);
    }

    public Document getDocument(Long id, User user) {
        return documentRepository.findById(id)
            .filter(doc -> doc.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    @Transactional
    public void deleteDocument(Long id, User user) {
        Document document = getDocument(id, user);
        documentRepository.delete(document);
    }
}
