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
import java.util.Base64;
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
    // @Transactional
    // public Document uploadDocumentFromTestFile(String filename, User user) throws IOException {
    //     // Đặt giá trị mặc định cho sensitive info
    //     String sensitiveInfo = "Test file từ testFile directory";
    //     // Tạo đường dẫn tới file test
    //     Path testFilePath = Paths.get(TEST_FILE_DIR, filename);
    //     File testFile = testFilePath.toFile();
        
    //     if (!testFile.exists()) {
    //         throw new IOException("File test không tồn tại: " + testFilePath.toString());
    //     }
        
    //     log.info("Mock upload file từ testFile: {}", testFilePath.toString());
        
    //     // Đọc nội dung file
    //     byte[] fileBytes = Files.readAllBytes(testFilePath);
    //     // Encode binary data sang Base64 để tránh lỗi UTF8
    //     String fileContent = Base64.getEncoder().encodeToString(fileBytes);
        
    //     // Xác định content type từ extension
    //     String contentType = determineContentType(filename);
        
    //     // Tạo mock MultipartFile để scan mã độc và phát hiện thông tin nhạy cảm
    //     MockMultipartFile mockFile = new MockMultipartFile(filename, fileBytes, contentType);
        
    //     // 1. SCAN MÃ ĐỘC TRƯỚC KHI XỬ LÝ FILE
    //     log.info("Bắt đầu scan mã độc cho test file: {}", filename);
    //     MalwareDetectionService.MalwareDetectionResult scanResult = malwareDetectionService.scanFile(mockFile);
        
    //     // Kiểm tra kết quả scan
    //     if (scanResult.isThreatDetected()) {
    //         log.error("PHÁT HIỆN MÃ ĐỘC trong test file {}: {}", 
    //             filename, scanResult.getThreats());
    //         throw new SecurityException("Test file bị từ chối: Phát hiện mã độc hoặc nội dung nguy hiểm. " +
    //             "Chi tiết: " + scanResult.getThreats().toString());
    //     }
        
    //     if (scanResult.isSuspicious()) {
    //         log.warn("Test file {} có dấu hiệu đáng nghi: {}", 
    //             filename, scanResult.getWarnings());
    //     }
        
    //     // 2. Gọi API Python để phát hiện thông tin nhạy cảm
    //     String detectedSensitiveInfo = sensitiveInfo;
    //     try {
    //         List<PythonApiService.SensitiveInfo> sensitiveInfoList = pythonApiService.detectSensitiveInfo(mockFile);
    //         if (!sensitiveInfoList.isEmpty()) {
    //             StringBuilder sb = new StringBuilder();
    //             if (sensitiveInfo != null && !sensitiveInfo.trim().isEmpty()) {
    //                 sb.append(sensitiveInfo).append("; ");
    //             }
    //             sb.append("Detected: ");
    //             for (PythonApiService.SensitiveInfo info : sensitiveInfoList) {
    //                 sb.append(info.getType()).append("=").append(info.getValue()).append("; ");
    //             }
    //             detectedSensitiveInfo = sb.toString();
    //             log.info("Detected sensitive information in file {}: {}", filename, sensitiveInfoList);
    //         }
    //     } catch (Exception e) {
    //         log.error("Error detecting sensitive information for file {}: {}", filename, e.getMessage());
    //         // Không throw exception, chỉ log lỗi và tiếp tục với thông tin nhạy cảm ban đầu
    //     }

    //     // Tạo Document entity
    //     Document document = new Document();
    //     // Loại bỏ null bytes khỏi filename để tránh lỗi UTF8
    //     document.setFilename(cleanStringForDatabase(filename));
    //     document.setContent(fileContent);
    //     // Loại bỏ null bytes khỏi mimeType để tránh lỗi UTF8
    //     document.setMimeType(cleanStringForDatabase(contentType));
    //     document.setFileSize((long) fileBytes.length);
    //     document.setUser(user);
    //     document.setUploadedAt(LocalDateTime.now());
    //     document.setLastModifiedAt(LocalDateTime.now());
    //     document.setStatus(cleanStringForDatabase("PROCESSING"));
    //     document.setRiskScore(scanResult.isThreatDetected() ? 100 : (scanResult.isSuspicious() ? 50 : 10));
        
    //     // Thêm thông tin scan mã độc vào sensitive info
    //     StringBuilder scanInfo = new StringBuilder();
    //     if (detectedSensitiveInfo != null && !detectedSensitiveInfo.trim().isEmpty()) {
    //         scanInfo.append(detectedSensitiveInfo).append("; ");
    //     }
        
    //     scanInfo.append("MALWARE_SCAN: ");
    //     if (scanResult.isClean()) {
    //         scanInfo.append("CLEAN");
    //     } else {
    //         scanInfo.append("SUSPICIOUS - ");
    //         if (!scanResult.getWarnings().isEmpty()) {
    //             scanInfo.append("Warnings: ");
    //             for (MalwareDetectionService.ThreatInfo warning : scanResult.getWarnings()) {
    //                 scanInfo.append(warning.getType()).append("=").append(warning.getDescription()).append("; ");
    //             }
    //         }
    //     }
    //     scanInfo.append(" [Hash: ").append(scanResult.getFileHash()).append("]");
        
    //     // Loại bỏ null bytes khỏi sensitive info để tránh lỗi UTF8
    //     String finalSensitiveInfo = cleanStringForDatabase(scanInfo.toString());
    //     document.setSensitiveInfo(finalSensitiveInfo);
        
    //     log.info("Test file {} đã được scan và lưu thành công. Trạng thái: {}", 
    //         filename, scanResult.isClean() ? "CLEAN" : "SUSPICIOUS");

    //     // Debug logging để kiểm tra null bytes
    //     log.debug("Document before save - Filename: '{}', Content length: {}, SensitiveInfo length: {}", 
    //         document.getFilename(), 
    //         document.getContent() != null ? document.getContent().length() : 0,
    //         document.getSensitiveInfo() != null ? document.getSensitiveInfo().length() : 0);
        
    //     // Kiểm tra null bytes trong tất cả string fields
    //     if (document.getFilename() != null && document.getFilename().contains("\u0000")) {
    //         log.warn("Filename still contains null bytes after cleaning!");
    //     }
    //     if (document.getSensitiveInfo() != null && document.getSensitiveInfo().contains("\u0000")) {
    //         log.warn("SensitiveInfo still contains null bytes after cleaning!");
    //     }
    //     if (document.getMimeType() != null && document.getMimeType().contains("\u0000")) {
    //         log.warn("MimeType still contains null bytes after cleaning!");
    //     }

    //     return documentRepository.save(document);
    // }
    
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
    public Document uploadDocument(MultipartFile file, User user) throws IOException {
        // Đặt giá trị mặc định cho sensitive info
        String sensitiveInfo = "Tài liệu được upload bởi người dùng";
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
        // Loại bỏ null bytes khỏi filename để tránh lỗi UTF8
        document.setFilename(cleanStringForDatabase(file.getOriginalFilename()));
        // Encode binary data sang Base64 để tránh lỗi UTF8
        byte[] fileBytes = file.getBytes();
        String base64Content = Base64.getEncoder().encodeToString(fileBytes);
        log.info("File size: {} bytes, Base64 content length: {} characters", fileBytes.length, base64Content.length());
        
        // Kiểm tra nếu Base64 content quá dài (PostgreSQL TEXT có giới hạn)
        if (base64Content.length() > 1000000) { // 1MB limit cho demo
            log.warn("Base64 content very large: {} characters, might cause database issues", base64Content.length());
        }
        
        document.setContent(base64Content);
        // Loại bỏ null bytes khỏi mimeType để tránh lỗi UTF8
        document.setMimeType(cleanStringForDatabase(contentType));
        document.setFileSize(file.getSize());
        // Loại bỏ null bytes khỏi sensitive info để tránh lỗi UTF8
        // document.setSensitiveInfo(cleanStringForDatabase(detectedSensitiveInfo));
        document.setOwnerUserId(user.getId());
        document.setUploadedAt(LocalDateTime.now());
        document.setLastModifiedAt(LocalDateTime.now());
        document.setStatus(cleanStringForDatabase("PROCESSING"));
        
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
        
        // Loại bỏ null bytes khỏi sensitive info để tránh lỗi UTF8
        String finalSensitiveInfo = cleanStringForDatabase(scanInfo.toString());
        document.setSensitiveInfo(finalSensitiveInfo);
        
        log.info("File {} đã được scan và lưu thành công. Trạng thái: {}", 
            file.getOriginalFilename(), scanResult.isClean() ? "CLEAN" : "SUSPICIOUS");

        // Debug logging để kiểm tra tất cả fields trước khi lưu
        log.info("Document before save:");
        log.info("  - Filename: '{}'", document.getFilename());
        log.info("  - MimeType: '{}'", document.getMimeType());
        log.info("  - FileSize: {}", document.getFileSize());
        log.info("  - Status: '{}'", document.getStatus());
        log.info("  - RiskScore: {}", document.getRiskScore());
        log.info("  - Content length: {}", document.getContent() != null ? document.getContent().length() : 0);
        log.info("  - SensitiveInfo length: {}", document.getSensitiveInfo() != null ? document.getSensitiveInfo().length() : 0);
        log.info("  - User ID: {}", document.getOwnerUserId() != null ? document.getOwnerUserId() : null);
        
        // Kiểm tra null bytes trong tất cả string fields
        if (document.getFilename() != null && document.getFilename().contains("\u0000")) {
            log.warn("Filename still contains null bytes after cleaning!");
        }
        if (document.getSensitiveInfo() != null && document.getSensitiveInfo().contains("\u0000")) {
            log.warn("SensitiveInfo still contains null bytes after cleaning!");
        }
        if (document.getMimeType() != null && document.getMimeType().contains("\u0000")) {
            log.warn("MimeType still contains null bytes after cleaning!");
        }
        if (document.getStatus() != null && document.getStatus().contains("\u0000")) {
            log.warn("Status still contains null bytes after cleaning!");
        }

        return documentRepository.save(document);
    }

    public Page<Document> getUserDocuments(User user, Pageable pageable) {
        return documentRepository.findByOwnerUserId(user.getId(), pageable);
    }

    public Document getDocument(Long id, User user) {
        return documentRepository.findById(id)
            .filter(doc -> doc.getOwnerUserId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    @Transactional
    public void deleteDocument(Long id, User user) {
        Document document = getDocument(id, user);
        documentRepository.delete(document);
    }
    
    /**
     * Decode Base64 content thành byte array để xử lý file
     */
    public byte[] getDocumentContent(Document document) {
        if (document.getContent() == null) {
            return new byte[0];
        }
        try {
            return Base64.getDecoder().decode(document.getContent());
        } catch (IllegalArgumentException e) {
            log.error("Error decoding Base64 content for document {}: {}", document.getId(), e.getMessage());
            return new byte[0];
        }
    }
    
    /**
     * Utility method để loại bỏ null bytes và các ký tự không hợp lệ khỏi string
     */
    private String cleanStringForDatabase(String input) {
        if (input == null) {
            return null;
        }
        // Loại bỏ null bytes và các ký tự control khác có thể gây vấn đề
        return input.replaceAll("[\u0000-\u001f\u007f-\u009f]", "");
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
