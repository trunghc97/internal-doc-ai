package com.docai.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

@Slf4j
@Service
public class RSAEncryptionService {
    private final PrivateKey privateKey;

    public RSAEncryptionService(@Value("${rsa.private-key-value}") String privateKeyValue) throws Exception {
        String privateKeyContent = privateKeyValue
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s", "");

        try {
            byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyContent);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PKCS8EncodedKeySpec privateSpec = new PKCS8EncodedKeySpec(privateKeyBytes);
            this.privateKey = keyFactory.generatePrivate(privateSpec);
            log.info("RSA private key initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize RSA private key", e);
            throw e;
        }
    }

    public String decrypt(String encryptedData) {
        try {
            log.debug("Attempting to decrypt data: {}", encryptedData);
            
            // Decode base64
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedData);
            log.debug("Decoded bytes length: {}", encryptedBytes.length);
            
            // Initialize cipher with PKCS1Padding (same as JSEncrypt)
            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.DECRYPT_MODE, privateKey);
            
            // Decrypt
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            String decryptedText = new String(decryptedBytes, StandardCharsets.UTF_8);
            
            log.debug("Decrypted text: {}", decryptedText);
            return decryptedText;
        } catch (Exception e) {
            log.error("Error decrypting data: {}", e.getMessage());
            log.error("Stack trace:", e);
            throw new RuntimeException("Error decrypting data", e);
        }
    }
}
