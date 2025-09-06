package com.loyalty.repository;

import com.loyalty.model.PointTransaction;
import com.loyalty.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByUserOrderByTimestampDesc(User user);
    
    @Query("SELECT COUNT(pt) FROM PointTransaction pt WHERE pt.user = :user AND pt.status = 'SUCCESS'")
    Long countSuccessfulTransactionsByUser(@Param("user") User user);
    
    @Query("SELECT pt.amount FROM PointTransaction pt WHERE pt.user = :user AND pt.status = 'SUCCESS'")
    List<Long> findSuccessfulTransactionAmountsByUser(@Param("user") User user);
}
