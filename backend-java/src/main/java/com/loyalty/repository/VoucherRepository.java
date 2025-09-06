package com.loyalty.repository;

import com.loyalty.model.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findByActiveTrue();
    Optional<Voucher> findByCodeAndActiveTrue(String code);
}
