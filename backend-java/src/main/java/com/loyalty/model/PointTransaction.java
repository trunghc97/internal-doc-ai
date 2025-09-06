package com.loyalty.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
@Table(name = "point_transactions")
public class PointTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    private String blockchainTx;

    private String description;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date timestamp;

    private String referenceId; // ID của giao dịch liên quan (nếu có)

    @PrePersist
    protected void onCreate() {
        timestamp = new Date();
    }

    public enum TransactionType {
        EARN,       // Earn points from activities
        REDEEM,     // Redeem points for rewards
        TRANSFER,   // Transfer points to another user
        TRADE,      // Trade points on blockchain
        PAY,        // Pay with points on blockchain
        ANCHOR      // Anchor transaction receipt on blockchain
    }

    public enum TransactionStatus {
        PENDING,    // Transaction is being processed
        SUCCESS,    // Transaction completed successfully
        FAILED      // Transaction failed
    }
}
