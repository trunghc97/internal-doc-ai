package com.loyalty.service;

import com.loyalty.model.PointTransaction;
import com.loyalty.repository.PointTransactionRepository;
import com.loyalty.service.BlockchainService.BlockchainResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PointsService {
    private final PointTransactionRepository transactionRepository;
    private final BlockchainService blockchainService;

    public Long getBalance(String userId) {
        List<PointTransaction> transactions = transactionRepository.findSuccessfulTransactionAmountsByUserId(userId);
        return transactions.stream()
            .mapToLong(tx -> {
                switch (tx.getType()) {
                    case EARN:
                    case TRANSFER: // when receiving
                        return tx.getAmount();
                    case REDEEM:
                    case PAY:
                    case TRADE:
                        return -tx.getAmount();
                    default:
                        return 0L;
                }
            })
            .sum();
    }

    @Transactional
    public PointTransaction earnPoints(String userId, Long amount, String description) {
        var transaction = new PointTransaction();
        transaction.setUserId(userId);
        transaction.setType(PointTransaction.TransactionType.EARN);
        transaction.setAmount(amount);
        transaction.setStatus(PointTransaction.TransactionStatus.SUCCESS);
        transaction.setDescription(description);
        transaction.setTimestamp(new Date());
        
        return transactionRepository.save(transaction);
    }

    @Transactional
    public PointTransaction redeemPoints(String userId, Long amount, String description) {
        Long balance = getBalance(userId);
        if (balance < amount) {
            throw new IllegalStateException("Insufficient points balance");
        }

        var transaction = new PointTransaction();
        transaction.setUserId(userId);
        transaction.setType(PointTransaction.TransactionType.REDEEM);
        transaction.setAmount(amount);
        transaction.setStatus(PointTransaction.TransactionStatus.SUCCESS);
        transaction.setDescription(description);
        transaction.setTimestamp(new Date());
        
        return transactionRepository.save(transaction);
    }

    @Transactional
    public PointTransaction transferPoints(String fromUserId, String toUserId, Long amount, String description) {
        Long balance = getBalance(fromUserId);
        if (balance < amount) {
            throw new IllegalStateException("Insufficient points balance");
        }

        // Deduct from sender
        var senderTx = new PointTransaction();
        senderTx.setUserId(fromUserId);
        senderTx.setType(PointTransaction.TransactionType.TRANSFER);
        senderTx.setAmount(-amount);
        senderTx.setStatus(PointTransaction.TransactionStatus.SUCCESS);
        senderTx.setDescription("Transfer to: " + toUserId + " - " + description);
        senderTx.setTimestamp(new Date());
        transactionRepository.save(senderTx);

        // Add to receiver
        var receiverTx = new PointTransaction();
        receiverTx.setUserId(toUserId);
        receiverTx.setType(PointTransaction.TransactionType.TRANSFER);
        receiverTx.setAmount(amount);
        receiverTx.setStatus(PointTransaction.TransactionStatus.SUCCESS);
        receiverTx.setDescription("Transfer from: " + fromUserId + " - " + description);
        receiverTx.setTimestamp(new Date());
        receiverTx.setReferenceId(senderTx.getId());
        
        return transactionRepository.save(receiverTx);
    }

    @Transactional
    public PointTransaction tradeOnBlockchain(String userId, Long amount) {
        Long balance = getBalance(userId);
        if (balance < amount) {
            throw new IllegalStateException("Insufficient points balance");
        }

        // Create pending transaction
        var transaction = new PointTransaction();
        transaction.setUserId(userId);
        transaction.setType(PointTransaction.TransactionType.TRADE);
        transaction.setAmount(amount);
        transaction.setStatus(PointTransaction.TransactionStatus.PENDING);
        transaction.setTimestamp(new Date());
        transaction = transactionRepository.save(transaction);

        // Call blockchain service
        BlockchainResponse response = blockchainService.trade(transaction);
        
        // Update transaction status
        transaction.setBlockchainTx(response.txHash());
        transaction.setStatus("SUCCESS".equals(response.status()) 
            ? PointTransaction.TransactionStatus.SUCCESS 
            : PointTransaction.TransactionStatus.FAILED);
        
        return transactionRepository.save(transaction);
    }

    @Transactional
    public PointTransaction payWithPoints(String userId, Long amount) {
        Long balance = getBalance(userId);
        if (balance < amount) {
            throw new IllegalStateException("Insufficient points balance");
        }

        // Create pending transaction
        var transaction = new PointTransaction();
        transaction.setUserId(userId);
        transaction.setType(PointTransaction.TransactionType.PAY);
        transaction.setAmount(amount);
        transaction.setStatus(PointTransaction.TransactionStatus.PENDING);
        transaction.setTimestamp(new Date());
        transaction = transactionRepository.save(transaction);

        // Call blockchain service
        BlockchainResponse response = blockchainService.pay(transaction);
        
        // Update transaction status
        transaction.setBlockchainTx(response.txHash());
        transaction.setStatus("SUCCESS".equals(response.status()) 
            ? PointTransaction.TransactionStatus.SUCCESS 
            : PointTransaction.TransactionStatus.FAILED);
        
        return transactionRepository.save(transaction);
    }

    public List<PointTransaction> getTransactionHistory(String userId) {
        return transactionRepository.findByUserIdOrderByTimestampDesc(userId);
    }
}