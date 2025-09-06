package com.loyalty.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PointsRequest {
    @NotNull
    @Min(1)
    private Long amount;
    
    private String toUsername;  // For transfer
    private String description;
}
