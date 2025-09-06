package com.loyalty.controller;

import com.loyalty.model.User;
import com.loyalty.model.Voucher;
import com.loyalty.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {
    private final VoucherRepository voucherRepository;

    @GetMapping
    public ResponseEntity<List<Voucher>> getVouchers(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(voucherRepository.findByActiveTrue());
    }
}