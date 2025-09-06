package com.loyalty.security;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
public class RSAEncryptionService {
    @Value("${rsa.private-key}")
    private Resource privateKeyResource;

    @Value("${rsa.public-key}")
    private Resource publicKeyResource;

    private PrivateKey privateKey;
    
    @Getter
    private PublicKey publicKey;

    @PostConstruct
    public void init() throws Exception {
        // Load keys using InputStream to work with classpath resources
        byte[] privateKeyBytes = privateKeyResource.getInputStream().readAllBytes();
        byte[] publicKeyBytes = publicKeyResource.getInputStream().readAllBytes();

        // Initialize keys
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        privateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKeyBytes)));
        publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(publicKeyBytes)));
    }

    public String decrypt(String encryptedData) {
        try {
            // Log input data for debugging
            System.out.println("Attempting to decrypt: " + encryptedData);
            
            // Create OAEPParameterSpec for decryption
            OAEPParameterSpec oaepParams = new OAEPParameterSpec(
                "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT
            );

            // Initialize cipher with OAEP padding
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWITHSHA-256ANDMGF1PADDING");
            cipher.init(Cipher.DECRYPT_MODE, privateKey, oaepParams);

            // Decrypt data
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
            String result = new String(decryptedBytes, StandardCharsets.UTF_8);
            
            // Log decrypted result
            System.out.println("Decryption successful. Result: " + result);
            return result;
        } catch (Exception e) {
            // Log detailed error
            System.err.println("Decryption failed. Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to decrypt data: " + e.getMessage(), e);
        }
    }

    public String encrypt(String data) {
        try {
            // Create OAEPParameterSpec for encryption
            OAEPParameterSpec oaepParams = new OAEPParameterSpec(
                "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT
            );

            // Initialize cipher with OAEP padding
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWITHSHA-256ANDMGF1PADDING");
            cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepParams);

            // Encrypt data
            byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    public String getPublicKeyAsBase64() {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }
}