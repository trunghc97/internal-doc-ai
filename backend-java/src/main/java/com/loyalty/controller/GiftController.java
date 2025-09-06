package com.loyalty.controller;

import com.loyalty.model.Gift;
import com.loyalty.repository.GiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gifts")
@RequiredArgsConstructor
public class GiftController {
    private final GiftRepository giftRepository;

    @GetMapping
    public ResponseEntity<List<Gift>> getGifts() {
        return ResponseEntity.ok(giftRepository.findByActiveTrue());
    }
}