package com.docai.service;

import com.docai.model.Document;
import com.docai.model.User;
import com.docai.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final PythonApiService pythonApiService;
    private final MalwareDetectionService malwareDetectionService;
    
    // Đường dẫn tới thư mục testFile
    private static final String TEST_FILE_DIR = "/Users/macus/project/java/internal-doc-ai/backend-java/testFile/";

    /**
     * Mock method để lấy file từ thư mục testFile thay vì MultipartFile
     */
    @Transactional
    public Document uploadDocumentFromTestFile(String filename, User user, String sensitiveInfo) throws IOException {
        // Tạo đường dẫn tới file test
        Path testFilePath = Paths.get(TEST_FILE_DIR, filename);
        File testFile = testFilePath.toFile();
        
        if (!testFile.exists()) {
            throw new IOException("File test không tồn tại: " + testFilePath.toString());
        }
        
        log.info("Mock upload file từ testFile: {}", testFilePath.toString());
        
        // Đọc nội dung file
        byte[] fileBytes = Files.readAllBytes(testFilePath);
        String fileContent = new String(fileBytes);
        
        // Xác định content type từ extension
        String contentType = determineContentType(filename);
        
        // Tạo mock MultipartFile để scan mã độc và phát hiện thông tin nhạy cảm
        MockMultipartFile mockFile = new MockMultipartFile(filename, fileBytes, contentType);
        
        // 1. SCAN MÃ ĐỘC TRƯỚC KHI XỬ LÝ FILE
        log.info("Bắt đầu scan mã độc cho test file: {}", filename);
        MalwareDetectionService.MalwareDetectionResult scanResult = malwareDetectionService.scanFile(mockFile);
        
        // Kiểm tra kết quả scan
        if (scanResult.isThreatDetected()) {
            log.error("PHÁT HIỆN MÃ ĐỘC trong test file {}: {}", 
                filename, scanResult.getThreats());
            throw new SecurityException("Test file bị từ chối: Phát hiện mã độc hoặc nội dung nguy hiểm. " +
                "Chi tiết: " + scanResult.getThreats().toString());
        }
        
        if (scanResult.isSuspicious()) {
            log.warn("Test file {} có dấu hiệu đáng nghi: {}", 
                filename, scanResult.getWarnings());
        }
        
        // 2. Gọi API Python để phát hiện thông tin nhạy cảm
        String detectedSensitiveInfo = sensitiveInfo;
        try {
            List<PythonApiService.SensitiveInfo> sensitiveInfoList = pythonApiService.detectSensitiveInfo(mockFile);
            if (!sensitiveInfoList.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                if (sensitiveInfo != null && !sensitiveInfo.trim().isEmpty()) {
                    sb.append(sensitiveInfo).append("; ");
                }
                sb.append("Detected: ");
                for (PythonApiService.SensitiveInfo info : sensitiveInfoList) {
                    sb.append(info.getType()).append("=").append(info.getValue()).append("; ");
                }
                detectedSensitiveInfo = sb.toString();
                log.info("Detected sensitive information in file {}: {}", filename, sensitiveInfoList);
            }
        } catch (Exception e) {
            log.error("Error detecting sensitive information for file {}: {}", filename, e.getMessage());
            // Không throw exception, chỉ log lỗi và tiếp tục với thông tin nhạy cảm ban đầu
        }

        // Tạo Document entity
        Document document = new Document();
        document.setFilename(filename);
        document.setContent(fileContent);
        document.setMimeType(contentType);
        document.setFileSize((long) fileBytes.length);
        document.setUser(user);
        document.setUploadedAt(LocalDateTime.now());
        document.setLastModifiedAt(LocalDateTime.now());
        
        // Thêm thông tin scan mã độc vào sensitive info
        StringBuilder scanInfo = new StringBuilder();
        if (detectedSensitiveInfo != null && !detectedSensitiveInfo.trim().isEmpty()) {
            scanInfo.append(detectedSensitiveInfo).append("; ");
        }
        
        scanInfo.append("MALWARE_SCAN: ");
        if (scanResult.isClean()) {
            scanInfo.append("CLEAN");
        } else {
            scanInfo.append("SUSPICIOUS - ");
            if (!scanResult.getWarnings().isEmpty()) {
                scanInfo.append("Warnings: ");
                for (MalwareDetectionService.ThreatInfo warning : scanResult.getWarnings()) {
                    scanInfo.append(warning.getType()).append("=").append(warning.getDescription()).append("; ");
                }
            }
        }
        scanInfo.append(" [Hash: ").append(scanResult.getFileHash()).append("]");
        
        document.setSensitiveInfo(scanInfo.toString());
        
        log.info("Test file {} đã được scan và lưu thành công. Trạng thái: {}", 
            filename, scanResult.isClean() ? "CLEAN" : "SUSPICIOUS");

        return documentRepository.save(document);
    }
    
    /**
     * Xác định content type từ tên file
     */
    private String determineContentType(String filename) {
        if (filename == null) {
            return "application/octet-stream";
        }
        
        if (filename.endsWith(".pdf")) {
            return "application/pdf";
        } else if (filename.endsWith(".doc")) {
            return "application/msword";
        } else if (filename.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
            return "application/octet-stream";
        }
    }

    @Transactional
    public Document uploadDocument(MultipartFile file, User user, String sensitiveInfo) throws IOException {
        // 1. SCAN MÃ ĐỘC TRƯỚC KHI XỬ LÝ FILE
        log.info("Bắt đầu scan mã độc cho file: {}", file.getOriginalFilename());
        MalwareDetectionService.MalwareDetectionResult scanResult = malwareDetectionService.scanFile(file);
        
        // Kiểm tra kết quả scan
        if (scanResult.isThreatDetected()) {
            log.error("PHÁT HIỆN MÃ ĐỘC trong file {}: {}", 
                file.getOriginalFilename(), scanResult.getThreats());
            throw new SecurityException("File bị từ chối: Phát hiện mã độc hoặc nội dung nguy hiểm. " +
                "Chi tiết: " + scanResult.getThreats().toString());
        }
        
        if (scanResult.isSuspicious()) {
            log.warn("File {} có dấu hiệu đáng nghi: {}", 
                file.getOriginalFilename(), scanResult.getWarnings());
            // Có thể cho phép upload nhưng đánh dấu cảnh báo
        }
        
        String contentType = file.getContentType();
        if (contentType == null) {
            // Nếu không có contentType, thử đoán từ tên file
            String filename = file.getOriginalFilename();
            if (filename != null) {
                if (filename.endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (filename.endsWith(".doc")) {
                    contentType = "application/msword";
                } else if (filename.endsWith(".docx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else {
                    contentType = "application/octet-stream"; // Default binary type
                }
            } else {
                contentType = "application/octet-stream";
            }
        }

        // Gọi API Python để phát hiện thông tin nhạy cảm
        String detectedSensitiveInfo = sensitiveInfo;
        try {
            List<PythonApiService.SensitiveInfo> sensitiveInfoList = pythonApiService.detectSensitiveInfo(file);
            if (!sensitiveInfoList.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                if (sensitiveInfo != null && !sensitiveInfo.trim().isEmpty()) {
                    sb.append(sensitiveInfo).append("; ");
                }
                sb.append("Detected: ");
                for (PythonApiService.SensitiveInfo info : sensitiveInfoList) {
                    sb.append(info.getType()).append("=").append(info.getValue()).append("; ");
                }
                detectedSensitiveInfo = sb.toString();
                log.info("Detected sensitive information in file {}: {}", file.getOriginalFilename(), sensitiveInfoList);
            }
        } catch (Exception e) {
            log.error("Error detecting sensitive information for file {}: {}", file.getOriginalFilename(), e.getMessage());
            // Không throw exception, chỉ log lỗi và tiếp tục với thông tin nhạy cảm ban đầu
        }

        Document document = new Document();
        document.setFilename(file.getOriginalFilename());
        document.setContent(new String(file.getBytes()));
        document.setMimeType(contentType);
        document.setFileSize(file.getSize());
        document.setSensitiveInfo(detectedSensitiveInfo);
        document.setUser(user);
        document.setUploadedAt(LocalDateTime.now());
        document.setLastModifiedAt(LocalDateTime.now());
        
        // Thêm thông tin scan mã độc vào sensitive info
        StringBuilder scanInfo = new StringBuilder();
        if (detectedSensitiveInfo != null && !detectedSensitiveInfo.trim().isEmpty()) {
            scanInfo.append(detectedSensitiveInfo).append("; ");
        }
        
        scanInfo.append("MALWARE_SCAN: ");
        if (scanResult.isClean()) {
            scanInfo.append("CLEAN");
        } else {
            scanInfo.append("SUSPICIOUS - ");
            if (!scanResult.getWarnings().isEmpty()) {
                scanInfo.append("Warnings: ");
                for (MalwareDetectionService.ThreatInfo warning : scanResult.getWarnings()) {
                    scanInfo.append(warning.getType()).append("=").append(warning.getDescription()).append("; ");
                }
            }
        }
        scanInfo.append(" [Hash: ").append(scanResult.getFileHash()).append("]");
        
        document.setSensitiveInfo(scanInfo.toString());
        
        log.info("File {} đã được scan và lưu thành công. Trạng thái: {}", 
            file.getOriginalFilename(), scanResult.isClean() ? "CLEAN" : "SUSPICIOUS");

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
    
    /**
     * Mock MultipartFile implementation để test
     */
    private static class MockMultipartFile implements MultipartFile {
        private final String filename;
        private final byte[] content;
        private final String contentType;
        
        public MockMultipartFile(String filename, byte[] content, String contentType) {
            this.filename = filename;
            this.content = content;
            this.contentType = contentType;
        }
        
        @Override
        public String getName() {
            return "file";
        }
        
        @Override
        public String getOriginalFilename() {
            return filename;
        }
        
        @Override
        public String getContentType() {
            return contentType;
        }
        
        @Override
        public boolean isEmpty() {
            return content == null || content.length == 0;
        }
        
        @Override
        public long getSize() {
            return content != null ? content.length : 0;
        }
        
        @Override
        public byte[] getBytes() throws IOException {
            return content;
        }
        
        @Override
        public InputStream getInputStream() throws IOException {
            return new ByteArrayInputStream(content);
        }
        
        @Override
        public void transferTo(File dest) throws IOException, IllegalStateException {
            Files.write(dest.toPath(), content);
        }
    }
}