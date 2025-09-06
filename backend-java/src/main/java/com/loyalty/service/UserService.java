package com.loyalty.service;

import com.loyalty.dto.AuthRequest;
import com.loyalty.dto.AuthResponse;
import com.loyalty.dto.RegisterRequest;
import com.loyalty.model.User;
import com.loyalty.repository.UserRepository;
import com.loyalty.security.JwtTokenProvider;
import com.loyalty.security.RSAEncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // Decrypt password and create new user with encoded password
        String decryptedPassword = rsaEncryptionService.decrypt(request.getPassword());
        User user = User.builder()
            .username(request.getUsername())
            .password(passwordEncoder.encode(decryptedPassword))
            .email(request.getEmail())
            .points(0L)
            .enabled(true)
            .build();

        // Save user and generate token
        user = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user);
        
        // Clear sensitive data before returning
        user.setPassword(null);
        return new AuthResponse(token, user.getUsername(), user.getPoints());
    }

    public AuthResponse login(AuthRequest request) {
        try {
            String decryptedPassword = rsaEncryptionService.decrypt(request.getPassword());
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), decryptedPassword)
            );
            User user = (User) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(user);
            return new AuthResponse(token, user.getUsername(), user.getPoints());
        } catch (Exception e) {
            throw new RuntimeException("Login failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void updatePoints(String userId, Long amount) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPoints(user.getPoints() + amount);
        userRepository.save(user);
    }
}
