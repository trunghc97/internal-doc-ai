package com.docai.service;

import com.docai.dto.AuthRequest;
import com.docai.dto.AuthResponse;
import com.docai.dto.RegisterRequest;
import com.docai.model.User;
import com.docai.repository.UserRepository;
import com.docai.security.JwtTokenProvider;
import com.docai.security.RSAEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RSAEncryptionService rsaEncryptionService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate username and email
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        try {
            // Decrypt password
            String decryptedPassword = rsaEncryptionService.decrypt(request.getPassword());
            
            // Create new user with encoded password
            User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(decryptedPassword))
                .email(request.getEmail())
                .role(User.Role.USER)
                .enabled(true)
                .build();

            // Save user and generate token
            user = userRepository.save(user);
            String token = jwtTokenProvider.generateToken(user);
            
            log.info("User registered successfully: {}", user.getUsername());
            return new AuthResponse(token, user.getUsername(), user.getRole().name());
        } catch (Exception e) {
            log.error("Registration failed for user {}: {}", request.getUsername(), e.getMessage());
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    public AuthResponse login(AuthRequest request) {
        try {
            log.debug("Attempting to decrypt password for user: {}", request.getUsername());
            String decryptedPassword = rsaEncryptionService.decrypt(request.getPassword());
            
            log.debug("Authenticating user: {}", request.getUsername());
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), decryptedPassword)
            );
            
            User user = (User) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(user);
            
            log.info("User logged in successfully: {}", user.getUsername());
            return new AuthResponse(token, user.getUsername(), user.getRole().name());
        } catch (Exception e) {
            log.error("Login failed for user {}: {}", request.getUsername(), e.getMessage());
            throw new RuntimeException("Login failed: " + e.getMessage());
        }
    }
}
