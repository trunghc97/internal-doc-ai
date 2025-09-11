package com.docai.model;

import jakarta.persistence.*;
import lombok.Data;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;

@Data
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "log_type", columnDefinition = "text")
    private String logType;

    @Type(JsonType.class)
    @Column(name = "details_logs", columnDefinition = "jsonb")
    private Object detailsLogs;
}
