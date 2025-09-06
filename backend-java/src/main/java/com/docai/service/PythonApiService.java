package com.docai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PythonApiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String pythonApiUrl;

    public PythonApiService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${python.api.url:http://localhost:8081}") String pythonApiUrl
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.pythonApiUrl = pythonApiUrl;
    }

    public List<SensitiveInfo> detectSensitiveInfo(MultipartFile file) throws IOException {
        try {
            // Tạo request body với multipart/form-data
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Tạo ByteArrayResource từ MultipartFile
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            // Tạo multipart body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Gọi API Python
            String url = pythonApiUrl + "/detect";
            log.info("Calling Python API: {}", url);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return parseSensitiveInfoResponse(response.getBody());
            } else {
                log.error("Python API returned error: {}", response.getStatusCode());
                throw new RuntimeException("Failed to detect sensitive information");
            }
            
        } catch (Exception e) {
            log.error("Error calling Python API for sensitive info detection", e);
            throw new IOException("Failed to detect sensitive information: " + e.getMessage());
        }
    }

    private List<SensitiveInfo> parseSensitiveInfoResponse(String responseBody) throws IOException {
        List<SensitiveInfo> sensitiveInfoList = new ArrayList<>();
        
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode sensitiveInfoArray = rootNode.get("sensitive_info");
            
            if (sensitiveInfoArray != null && sensitiveInfoArray.isArray()) {
                for (JsonNode infoNode : sensitiveInfoArray) {
                    SensitiveInfo info = new SensitiveInfo();
                    info.setType(infoNode.get("type").asText());
                    info.setValue(infoNode.get("value").asText());
                    info.setStart(infoNode.get("start").asInt());
                    info.setEnd(infoNode.get("end").asInt());
                    sensitiveInfoList.add(info);
                }
            }
            
        } catch (Exception e) {
            log.error("Error parsing sensitive info response", e);
            throw new IOException("Failed to parse sensitive info response");
        }
        
        return sensitiveInfoList;
    }

    public static class SensitiveInfo {
        private String type;
        private String value;
        private int start;
        private int end;

        // Getters and setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
        
        public int getStart() { return start; }
        public void setStart(int start) { this.start = start; }
        
        public int getEnd() { return end; }
        public void setEnd(int end) { this.end = end; }

        @Override
        public String toString() {
            return String.format("SensitiveInfo{type='%s', value='%s', start=%d, end=%d}", 
                type, value, start, end);
        }
    }
}
