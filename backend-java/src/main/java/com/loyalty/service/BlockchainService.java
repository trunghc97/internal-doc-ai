package com.loyalty.service;

import com.loyalty.model.PointTransaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class BlockchainService {
    private final RestTemplate restTemplate;
    
    @Value("${blockchain.service.url}")
    private String blockchainServiceUrl;

    public record BlockchainRequest(
        String userId,
        Long amount,
        String transactionId
    ) {}

    public record BlockchainResponse(
        String txHash,
        String status,
        String error
    ) {}

    public BlockchainResponse trade(PointTransaction transaction) {
        String endpoint = blockchainServiceUrl + "/blockchain/trade";
        var request = new BlockchainRequest(
            transaction.getUserId(),
            transaction.getAmount(),
            transaction.getId()
        );
        
        try {
            ResponseEntity<BlockchainResponse> response = restTemplate.postForEntity(
                endpoint,
                request,
                BlockchainResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling blockchain trade service", e);
            return new BlockchainResponse(null, "FAILED", e.getMessage());
        }
    }

    public BlockchainResponse pay(PointTransaction transaction) {
        String endpoint = blockchainServiceUrl + "/blockchain/pay";
        var request = new BlockchainRequest(
            transaction.getUserId(),
            transaction.getAmount(),
            transaction.getId()
        );
        
        try {
            ResponseEntity<BlockchainResponse> response = restTemplate.postForEntity(
                endpoint,
                request,
                BlockchainResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling blockchain pay service", e);
            return new BlockchainResponse(null, "FAILED", e.getMessage());
        }
    }

    public BlockchainResponse anchorReceipt(PointTransaction transaction) {
        String endpoint = blockchainServiceUrl + "/blockchain/anchor-receipt";
        var request = new BlockchainRequest(
            transaction.getUserId(),
            transaction.getAmount(),
            transaction.getId()
        );
        
        try {
            ResponseEntity<BlockchainResponse> response = restTemplate.postForEntity(
                endpoint,
                request,
                BlockchainResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling blockchain anchor service", e);
            return new BlockchainResponse(null, "FAILED", e.getMessage());
        }
    }

    public BlockchainResponse getStatus(String txId) {
        String endpoint = blockchainServiceUrl + "/blockchain/status?txId=" + txId;
        
        try {
            ResponseEntity<BlockchainResponse> response = restTemplate.getForEntity(
                endpoint,
                BlockchainResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling blockchain status service", e);
            return new BlockchainResponse(null, "FAILED", e.getMessage());
        }
    }
}