package com.loyalty.controller;

import com.loyalty.model.PointTransaction;
import com.loyalty.service.PointsService;
import com.loyalty.dto.PointsRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {
    private final PointsService pointsService;

    @GetMapping("/balance")
    public ResponseEntity<Long> getBalance(@AuthenticationPrincipal UserDetails userDetails) {
        Long balance = pointsService.getBalance(userDetails.getUsername());
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/earn")
    public ResponseEntity<PointTransaction> earnPoints(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PointsRequest request) {
        PointTransaction transaction = pointsService.earnPoints(
            userDetails.getUsername(),
            request.getAmount(),
            request.getDescription()
        );
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/redeem")
    public ResponseEntity<PointTransaction> redeemPoints(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PointsRequest request) {
        PointTransaction transaction = pointsService.redeemPoints(
            userDetails.getUsername(),
            request.getAmount(),
            request.getDescription()
        );
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/transfer/{toUserId}")
    public ResponseEntity<PointTransaction> transferPoints(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String toUserId,
            @RequestBody PointsRequest request) {
        PointTransaction transaction = pointsService.transferPoints(
            userDetails.getUsername(),
            toUserId,
            request.getAmount(),
            request.getDescription()
        );
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/trade")
    public ResponseEntity<PointTransaction> tradeOnBlockchain(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PointsRequest request) {
        PointTransaction transaction = pointsService.tradeOnBlockchain(
            userDetails.getUsername(),
            request.getAmount()
        );
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/pay")
    public ResponseEntity<PointTransaction> payWithPoints(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PointsRequest request) {
        PointTransaction transaction = pointsService.payWithPoints(
            userDetails.getUsername(),
            request.getAmount()
        );
        return ResponseEntity.ok(transaction);
    }

    @GetMapping("/history")
    public ResponseEntity<List<PointTransaction>> getTransactionHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<PointTransaction> history = pointsService.getTransactionHistory(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }
}