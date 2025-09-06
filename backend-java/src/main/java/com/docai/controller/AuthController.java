package com.docai.controller;

import com.docai.dto.AuthRequest;
import com.docai.dto.AuthResponse;
import com.docai.dto.RegisterRequest;
import com.docai.security.RSAEncryptionService;
import com.docai.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final RSAEncryptionService rsaEncryptionService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received register request for username: {}", request.getUsername());
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("Received login request for username: {}", request.getUsername());
        return ResponseEntity.ok(userService.login(request));
    }

}
