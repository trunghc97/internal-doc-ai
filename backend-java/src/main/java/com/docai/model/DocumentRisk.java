package com.docai.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "documents_risk")
public class DocumentRisk {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "risk_type", columnDefinition = "text")
    private String riskType;

    @Column(name = "risk_key", columnDefinition = "text")
    private String riskKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Document document;
}
